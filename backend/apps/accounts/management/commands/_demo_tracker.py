import json
import logging
from pathlib import Path
from django.apps import apps
from django.conf import settings
from apps.accounts.models import AuditLog

logger = logging.getLogger(__name__)

DEMO_ACTION_TAG = "DEMO_SEED_RECORD"
MANIFEST_FILENAME = ".demo_seed_manifest.json"

# Strict reverse dependency deletion order:
# Dependent child records must be deleted before their parent records.
MODEL_CLEANUP_ORDER = [
    ("applications", "Offer"),
    ("applications", "Interview"),
    ("applications", "ApplicationNote"),
    ("applications", "ApplicationStatusHistory"),
    ("applications", "Application"),
    ("jobs", "JobSkill"),
    ("jobs", "SavedJob"),
    ("jobs", "Job"),
    ("accounts", "CandidateSkill"),
    ("messaging", "Message"),
    ("messaging", "Notification"),
    ("accounts", "CandidateProfile"),
    ("accounts", "CompanyProfile"),
    ("jobs", "Skill"),
    ("accounts", "User"),
]


class DemoTracker:
    """
    Tracks records created by demo seeding without altering business schemas or adding migrations.
    
    Persistence strategy:
    1. Database-backed registry: Uses the existing AuditLog table with action='DEMO_SEED_RECORD'.
       This ensures the registry is persistent, portable across environments (Docker, hosted DB, local),
       and immune to local file loss.
    2. Local file mirror: Mirrors tracked identifiers into backend/.demo_seed_manifest.json for
       instant developer inspection and offline debugging.
    """

    def __init__(self, manifest_path=None):
        if manifest_path is None:
            self.manifest_path = Path(settings.BASE_DIR) / MANIFEST_FILENAME
        else:
            self.manifest_path = Path(manifest_path)
        self.in_memory_records = []

    def record_created(self, instance, demo_key, metadata=None):
        """
        Record that a specific model instance was newly created as part of the demo dataset.
        """
        app_label = instance._meta.app_label
        model_name = instance._meta.model_name
        target_type = f"{app_label}.{instance._meta.object_name}"
        target_id = str(instance.pk)

        meta = {
            "demo_key": demo_key,
            "app_label": app_label,
            "model_name": instance._meta.object_name,
            "pk": instance.pk,
            "metadata": metadata or {},
        }
        details_str = json.dumps(meta)

        # Write to database AuditLog
        AuditLog.objects.create(
            actor=None,
            action=DEMO_ACTION_TAG,
            target_type=target_type,
            target_id=target_id,
            details=details_str,
        )

        self.in_memory_records.append(meta)

    def save_manifest(self):
        """
        Save the current database-backed tracking registry into the local JSON manifest mirror.
        """
        all_tracked = self.get_all_tracked_records_metadata()
        try:
            with open(self.manifest_path, "w", encoding="utf-8") as f:
                json.dump(all_tracked, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not write demo manifest to {self.manifest_path}: {e}")

    def get_all_tracked_records_metadata(self):
        """
        Retrieves all tracked demo entries from AuditLog combined with the manifest mirror.
        """
        records = []
        seen = set()

        # Source 1: Database AuditLog
        for log in AuditLog.objects.filter(action=DEMO_ACTION_TAG):
            try:
                data = json.loads(log.details)
                key = (data.get("app_label"), data.get("model_name"), data.get("pk"))
                if key not in seen:
                    seen.add(key)
                    records.append(data)
            except Exception:
                continue

        # Source 2: File manifest fallback/merge
        if self.manifest_path.exists():
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    file_data = json.load(f)
                    for item in file_data:
                        key = (item.get("app_label"), item.get("model_name"), item.get("pk"))
                        if key not in seen:
                            seen.add(key)
                            records.append(item)
            except Exception:
                pass

        return records

    def get_tracked_pks_for_model(self, app_label, model_name):
        """
        Returns a set of integer PKs tracked as demo-owned for a given model.
        """
        tracked_pks = set()
        target_type = f"{app_label}.{model_name}"

        # 1. From database AuditLog
        logs = AuditLog.objects.filter(action=DEMO_ACTION_TAG, target_type=target_type)
        for log in logs:
            try:
                tracked_pks.add(int(log.target_id))
            except (ValueError, TypeError):
                continue

        # 2. From file manifest
        if self.manifest_path.exists():
            try:
                with open(self.manifest_path, "r", encoding="utf-8") as f:
                    file_data = json.load(f)
                    for item in file_data:
                        if (
                            item.get("app_label") == app_label
                            and item.get("model_name") == model_name
                        ):
                            try:
                                tracked_pks.add(int(item.get("pk")))
                            except (ValueError, TypeError):
                                pass
            except Exception:
                pass

        return tracked_pks

    def is_instance_tracked(self, instance):
        """
        Verifies whether an existing instance was explicitly created and tracked by the seed command.
        """
        app_label = instance._meta.app_label
        model_name = instance._meta.object_name
        tracked_pks = self.get_tracked_pks_for_model(app_label, model_name)
        return instance.pk in tracked_pks

    def get_tracked_inventory(self):
        """
        Scans models in reverse dependency order and returns the count and PKs
        of records that are strictly tracked as demo data.
        """
        inventory = []

        for app_label, model_name in MODEL_CLEANUP_ORDER:
            try:
                model_cls = apps.get_model(app_label, model_name)
            except LookupError:
                continue

            tracked_pks = self.get_tracked_pks_for_model(app_label, model_name)
            if not tracked_pks:
                continue

            # Query database to confirm instances actually still exist
            existing_qs = model_cls.objects.filter(pk__in=tracked_pks)
            existing_pks = list(existing_qs.values_list("pk", flat=True))

            if existing_pks:
                inventory.append({
                    "app_label": app_label,
                    "model_name": model_name,
                    "model_cls": model_cls,
                    "pks": existing_pks,
                    "count": len(existing_pks),
                })

        return inventory

    def get_unrelated_counts(self):
        """
        Counts records in the database that are NOT tracked as demo data,
        ensuring visibility into protected records.
        """
        unrelated = {}
        for app_label, model_name in MODEL_CLEANUP_ORDER:
            try:
                model_cls = apps.get_model(app_label, model_name)
            except LookupError:
                continue

            tracked_pks = self.get_tracked_pks_for_model(app_label, model_name)
            unrelated_count = model_cls.objects.exclude(pk__in=tracked_pks).count()
            if unrelated_count > 0:
                unrelated[f"{app_label}.{model_name}"] = unrelated_count

        return unrelated

    def clear_tracked_records(self, dry_run=False):
        """
        Deletes tracked demo records in strict reverse dependency order.
        If dry_run is True, returns what would be deleted without modifying the database.
        """
        inventory = self.get_tracked_inventory()
        results = []

        if dry_run:
            for item in inventory:
                results.append({
                    "model": f"{item['app_label']}.{item['model_name']}",
                    "count": item["count"],
                    "pks": item["pks"],
                })
            return results

        # Execute safe deletion
        for item in inventory:
            model_cls = item["model_cls"]
            pks = item["pks"]
            
            # Special protection for Skill: Only delete if no non-demo references exist
            if item["model_name"] == "Skill":
                skills_to_delete = []
                for skill_pk in pks:
                    skill = model_cls.objects.filter(pk=skill_pk).first()
                    if skill and not skill.job_skills.exists() and not skill.candidate_skills.exists():
                        skills_to_delete.append(skill_pk)
                pks = skills_to_delete

            if pks:
                deleted_count, _ = model_cls.objects.filter(pk__in=pks).delete()
                results.append({
                    "model": f"{item['app_label']}.{item['model_name']}",
                    "count": deleted_count,
                    "pks": pks,
                })

        # Remove the tracking AuditLog entries
        AuditLog.objects.filter(action=DEMO_ACTION_TAG).delete()

        # Clear or remove manifest file
        if self.manifest_path.exists():
            try:
                self.manifest_path.unlink()
            except Exception as e:
                logger.warning(f"Could not delete manifest file {self.manifest_path}: {e}")

        return results
