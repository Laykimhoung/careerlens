from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.accounts.models import CompanyProfile, CandidateProfile
from .models import Job, Skill, JobSkill, SavedJob

User = get_user_model()

class JobTests(APITestCase):
    def setUp(self):
        # Create users
        self.company_user1 = User.objects.create_user(username="company1", email="c1@test.com", password="pw1", role=User.Role.COMPANY)
        self.company_profile1 = CompanyProfile.objects.create(user=self.company_user1, company_name="Company 1")

        self.company_user2 = User.objects.create_user(username="company2", email="c2@test.com", password="pw2", role=User.Role.COMPANY)
        self.company_profile2 = CompanyProfile.objects.create(user=self.company_user2, company_name="Company 2")

        self.candidate_user = User.objects.create_user(username="candidate1", email="cand1@test.com", password="pw1", role=User.Role.CANDIDATE)
        self.candidate_profile = CandidateProfile.objects.create(user=self.candidate_user)

        # Create Jobs
        self.job1_published = Job.objects.create(
            company=self.company_profile1, title="Job 1", description="Desc", status=Job.Status.PUBLISHED
        )
        self.job2_draft = Job.objects.create(
            company=self.company_profile1, title="Job 2", description="Desc", status=Job.Status.DRAFT
        )

    def test_list_jobs_as_candidate(self):
        """Candidates should only see published jobs."""
        self.client.force_authenticate(user=self.candidate_user)
        response = self.client.get(reverse('job-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see job1_published
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]['title'], "Job 1")

    def test_list_jobs_as_company(self):
        """Companies should see all published jobs PLUS their own draft jobs."""
        self.client.force_authenticate(user=self.company_user1)
        response = self.client.get(reverse('job-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)  # Published + own draft

    def test_create_job_as_company(self):
        self.client.force_authenticate(user=self.company_user1)
        data = {
            "title": "New Job",
            "description": "Awesome Job",
            "status": "PUBLISHED"
        }
        response = self.client.post(reverse('job-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Job.objects.filter(title="New Job").exists())

    def test_create_job_as_candidate(self):
        """Candidates cannot create jobs."""
        self.client.force_authenticate(user=self.candidate_user)
        data = {"title": "New Job", "description": "Awesome Job"}
        response = self.client.post(reverse('job-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_job_ownership(self):
        """Company2 cannot update Company1's job."""
        self.client.force_authenticate(user=self.company_user2)
        url = reverse('job-detail', args=[self.job1_published.id])
        data = {"title": "Hacked Title"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_save_job(self):
        self.client.force_authenticate(user=self.candidate_user)
        data = {"job_id": self.job1_published.id}
        response = self.client.post(reverse('saved-job-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SavedJob.objects.filter(candidate=self.candidate_profile, job=self.job1_published).exists())
