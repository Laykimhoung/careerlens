from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.accounts.models import CandidateProfile
from .models import Resume, ResumeVersion, CandidateUsage

User = get_user_model()


class ResumeAndCVStudioTests(APITestCase):
    def setUp(self):
        self.candidate_user = User.objects.create_user(
            username="cand_test",
            email="cand@test.com",
            password="pw1",
            role=User.Role.CANDIDATE,
            first_name="Sokha",
            last_name="Chan",
        )
        self.candidate_profile = CandidateProfile.objects.create(
            user=self.candidate_user,
            university="RUPP",
            major="Computer Science",
            graduation_year=2026,
            bio="Passionate software engineering student.",
        )
        self.client.force_authenticate(user=self.candidate_user)

    def test_upload_and_get_latest_resume(self):
        url = reverse('resume_upload')
        fake_file = SimpleUploadedFile("sokha_cv.pdf", b"%PDF-1.4 sample resume content", content_type="application/pdf")
        response = self.client.post(url, {"file": fake_file, "target_role": "Backend Developer"}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("parsed_data", response.data)
        self.assertIn("analysis", response.data)
        resume_id = response.data["id"]

        # Fetch latest
        latest_url = reverse('latest_resume')
        latest_res = self.client.get(latest_url)
        self.assertEqual(latest_res.status_code, status.HTTP_200_OK)
        self.assertEqual(latest_res.data["id"], resume_id)
        self.assertEqual(latest_res.data["target_role"], "Backend Developer")

    def test_update_parsed_data_and_analyze(self):
        resume = Resume.objects.create(
            candidate=self.candidate_profile,
            file_name="cv.pdf",
            target_role="Full Stack",
            parsed_data={"contact_info": {"name": "Sokha"}, "summary": "Dev", "skills": {"technical": ["React"]}},
            analysis={"overall_score": 6.5},
            is_active=True,
        )
        patch_url = reverse('resume_parsed_data', args=[resume.id])
        patch_res = self.client.patch(patch_url, {
            "summary": "Experienced full stack engineer with proven deliveries.",
            "skills": {"technical": ["React", "Python", "Django", "PostgreSQL"], "soft": ["Teamwork"]},
        }, format='json')
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(patch_res.data["parsed_data"]["skills"]["technical"]), 4)

        # Run analysis
        analyze_url = reverse('resume_analyze', args=[resume.id])
        analyze_res = self.client.post(analyze_url, {"target_role": "Full Stack Engineer"}, format='json')
        self.assertEqual(analyze_res.status_code, status.HTTP_200_OK)
        self.assertIn("overall_score", analyze_res.data["analysis"])
        self.assertGreater(analyze_res.data["analysis"]["overall_score"], 0)

    def test_cv_studio_diagnosis_and_questionnaire(self):
        diag_url = reverse('improvement_diagnosis')
        diag_res = self.client.get(diag_url)
        self.assertEqual(diag_res.status_code, status.HTTP_200_OK)
        self.assertIn("improvement_options", diag_res.data)
        self.assertGreater(len(diag_res.data["improvement_options"]), 0)

        q_url = reverse('improvement_questionnaire')
        q_res = self.client.get(q_url)
        self.assertEqual(q_res.status_code, status.HTTP_200_OK)
        self.assertIn("questions", q_res.data)

    def test_cv_studio_generation_and_versions(self):
        gen_url = reverse('improvement_generate')
        payload = {
            "selected_improvements": ["quantify_impact", "tailor_summary"],
            "questionnaire_answers": {"q_metrics": "Optimized latency by 30%"},
            "template": "modern",
            "target_role": "Backend Engineer",
        }
        gen_res = self.client.post(gen_url, payload, format='json')
        self.assertEqual(gen_res.status_code, status.HTTP_201_CREATED)
        self.assertIn("version", gen_res.data)
        ver_id = gen_res.data["version"]["id"]

        # List versions
        list_url = reverse('resume_versions')
        list_res = self.client.get(list_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)

        # Approve version
        approve_url = reverse('approve_resume_version', args=[ver_id])
        appr_res = self.client.post(approve_url)
        self.assertEqual(appr_res.status_code, status.HTTP_200_OK)
        self.assertTrue(appr_res.data["version"]["is_approved"])

        # Restore version as draft
        restore_url = reverse('restore_resume_version', args=[ver_id])
        rest_res = self.client.post(restore_url)
        self.assertEqual(rest_res.status_code, status.HTTP_200_OK)
        self.assertEqual(ResumeVersion.objects.filter(candidate=self.candidate_profile).count(), 2)

    def test_usage_and_upgrade(self):
        usage_url = reverse('usage_summary')
        get_res = self.client.get(usage_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(get_res.data["plan_tier"], "FREE")

        up_url = reverse('upgrade_usage')
        post_res = self.client.post(up_url, {"action": "upgrade"}, format='json')
        self.assertEqual(post_res.status_code, status.HTTP_200_OK)
        self.assertEqual(post_res.data["usage"]["plan_tier"], "PREMIUM")
        self.assertEqual(post_res.data["usage"]["improvements_limit"], 50)
