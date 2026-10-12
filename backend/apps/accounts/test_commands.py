import tempfile
from io import StringIO
from django.core.management import call_command
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.accounts.models import CompanyProfile, CandidateProfile
from apps.jobs.models import Job

User = get_user_model()


class DemoCommandsTests(TestCase):
    def setUp(self):
        # Create an unrelated pre-existing user and company to verify non-destruction
        self.unrelated_user = User.objects.create_user(
            username="unrelated_student",
            email="unrelated@student.local",
            password="ProtectedPassword123!",
            role=User.Role.CANDIDATE,
        )
        self.unrelated_profile = CandidateProfile.objects.create(
            user=self.unrelated_user,
            university="Pre-existing University",
            major="Civil Engineering",
        )
        self.temp_manifest = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
        self.manifest_path = self.temp_manifest.name
        self.temp_manifest.close()

    def tearDown(self):
        import os
        if os.path.exists(self.manifest_path):
            try:
                os.remove(self.manifest_path)
            except OSError:
                pass

    def test_seed_and_clear_lifecycle(self):
        out = StringIO()

        # 1. Run seed_demo_data
        call_command("seed_demo_data", manifest=self.manifest_path, stdout=out)
        out_str = out.getvalue()
        self.assertIn("[SUCCESS] Demo seeding completed successfully!", out_str)

        # 2. Verify expected record counts
        self.assertEqual(Job.objects.filter(company__user__username__startswith="demo_comp_").count(), 24)
        self.assertEqual(CompanyProfile.objects.filter(user__username__startswith="demo_comp_").count(), 9)
        self.assertEqual(CandidateProfile.objects.filter(user__username__startswith="demo_cand_").count(), 5)

        # 3. Verify unrelated pre-existing user remains untouched
        self.assertTrue(User.objects.filter(username="unrelated_student").exists())
        self.assertTrue(CandidateProfile.objects.filter(user=self.unrelated_user).exists())

        # 4. Verify IDEMPOTENCY: running seed again creates 0 new records
        out_second = StringIO()
        call_command("seed_demo_data", manifest=self.manifest_path, stdout=out_second)
        out_second_str = out_second.getvalue()
        self.assertIn("Total Newly Created Records  : 0", out_second_str)
        self.assertEqual(Job.objects.filter(company__user__username__startswith="demo_comp_").count(), 24)

        # 5. Verify DRY RUN: reports without modifying database
        out_dry = StringIO()
        call_command("clear_demo_data", dry_run=True, manifest=self.manifest_path, stdout=out_dry)
        out_dry_str = out_dry.getvalue()
        self.assertIn("[DRY RUN]", out_dry_str)
        self.assertIn("jobs.Job", out_dry_str)
        self.assertEqual(Job.objects.filter(company__user__username__startswith="demo_comp_").count(), 24)

        # 6. Verify SAFE CLEANUP: deletes only tracked demo records
        out_clear = StringIO()
        call_command("clear_demo_data", no_input=True, manifest=self.manifest_path, stdout=out_clear)
        out_clear_str = out_clear.getvalue()
        self.assertIn("[SUCCESS] Successfully removed", out_clear_str)

        # Verify demo records are removed
        self.assertEqual(Job.objects.filter(company__user__username__startswith="demo_comp_").count(), 0)
        self.assertEqual(CompanyProfile.objects.filter(user__username__startswith="demo_comp_").count(), 0)
        self.assertEqual(CandidateProfile.objects.filter(user__username__startswith="demo_cand_").count(), 0)

        # Verify unrelated user was PRESERVED
        self.assertTrue(User.objects.filter(username="unrelated_student").exists())
        self.assertTrue(CandidateProfile.objects.filter(user=self.unrelated_user).exists())

        # 7. Verify RE-SEEDING after cleanup
        out_reseed = StringIO()
        call_command("seed_demo_data", manifest=self.manifest_path, stdout=out_reseed)
        self.assertEqual(Job.objects.filter(company__user__username__startswith="demo_comp_").count(), 24)
        self.assertEqual(CompanyProfile.objects.filter(user__username__startswith="demo_comp_").count(), 9)
        self.assertEqual(CandidateProfile.objects.filter(user__username__startswith="demo_cand_").count(), 5)
        self.assertTrue(User.objects.filter(username="unrelated_student").exists())
