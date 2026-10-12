from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from ._demo_tracker import DemoTracker


class Command(BaseCommand):
    help = "Safely deletes only records explicitly tracked as demo data, strictly preserving all unrelated records."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what records would be deleted without actually modifying the database.",
        )
        parser.add_argument(
            "--no-input",
            "--confirm",
            action="store_true",
            dest="no_input",
            help="Bypass interactive user confirmation prompt (for automated scripts or tests).",
        )
        parser.add_argument(
            "--manifest",
            type=str,
            default=None,
            help="Optional path to a custom demo manifest file.",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        no_input = options.get("no_input", False)
        manifest_path = options.get("manifest")

        tracker = DemoTracker(manifest_path=manifest_path)

        self.stdout.write(self.style.MIGRATE_HEADING("=== CareerLens Demo Data Safe Cleanup ==="))

        inventory = tracker.get_tracked_inventory()
        total_tracked_records = sum(item["count"] for item in inventory)
        unrelated = tracker.get_unrelated_counts()

        if total_tracked_records == 0:
            self.stdout.write(self.style.SUCCESS("[INFO] No tracked demo records found in database. Nothing to delete."))
            if unrelated:
                self.stdout.write("\nExisting protected non-demo records in database:")
                for model_label, count in unrelated.items():
                    self.stdout.write(f"  - {model_label:<30}: {count} records preserved")
            return

        self.stdout.write(f"Found {total_tracked_records} tracked demo records across {len(inventory)} models.\n")
        self.stdout.write("Tracked Demo Records Inventory (Reverse Dependency Order):")
        for item in inventory:
            self.stdout.write(f"  - {item['app_label']}.{item['model_name']:<25}: {item['count']} records")

        if unrelated:
            self.stdout.write("\nProtected Unrelated / Non-Demo Records:")
            for model_label, count in unrelated.items():
                self.stdout.write(f"  - {model_label:<30}: {count} records (WILL BE PRESERVED)")

        # Handle Dry-Run
        if dry_run:
            self.stdout.write(self.style.WARNING("\n[DRY RUN] No database records were modified or deleted."))
            self.stdout.write(f"[DRY RUN] Exact number of records that would be removed: {total_tracked_records}")
            return

        # Interactive Confirmation Guard
        if not no_input:
            self.stdout.write(
                self.style.WARNING(
                    f"\n[WARNING] You are about to permanently delete {total_tracked_records} tracked demo records."
                )
            )
            confirm = input("Type 'yes' to proceed with deletion: ").strip().lower()
            if confirm != "yes":
                self.stdout.write(self.style.NOTICE("Cleanup operation aborted by user. Database unchanged."))
                return

        # Execute Safe Deletion inside atomic transaction
        self.stdout.write("\nExecuting safe deletion...")
        with transaction.atomic():
            results = tracker.clear_tracked_records(dry_run=False)

        total_deleted = sum(r["count"] for r in results)
        self.stdout.write(self.style.SUCCESS(f"\n[SUCCESS] Successfully removed {total_deleted} demo records."))
        self.stdout.write("Deletion Summary:")
        for r in results:
            self.stdout.write(f"  - {r['model']:<30}: {r['count']} deleted")

        remaining_unrelated = tracker.get_unrelated_counts()
        if remaining_unrelated:
            self.stdout.write("\nConfirmed: Non-Demo Records Remained Fully Intact:")
            for model_label, count in remaining_unrelated.items():
                self.stdout.write(f"  - {model_label:<30}: {count} records intact")
