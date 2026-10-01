from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.accounts.models import CompanyProfile, CandidateProfile
from apps.jobs.models import Job
from .models import Application

User = get_user_model()

class ApplicationTests(APITestCase):
    def setUp(self):
        # Create users
        self.company_user1 = User.objects.create_user(username="company1", email="c1@test.com", password="pw1", role=User.Role.COMPANY)
        self.company_profile1 = CompanyProfile.objects.create(user=self.company_user1, company_name="Company 1")

        self.company_user2 = User.objects.create_user(username="company2", email="c2@test.com", password="pw2", role=User.Role.COMPANY)
        self.company_profile2 = CompanyProfile.objects.create(user=self.company_user2, company_name="Company 2")

        self.candidate_user1 = User.objects.create_user(username="candidate1", email="cand1@test.com", password="pw1", role=User.Role.CANDIDATE)
        self.candidate_profile1 = CandidateProfile.objects.create(user=self.candidate_user1)

        self.candidate_user2 = User.objects.create_user(username="candidate2", email="cand2@test.com", password="pw2", role=User.Role.CANDIDATE)
        self.candidate_profile2 = CandidateProfile.objects.create(user=self.candidate_user2)

        # Create Jobs
        self.job1_published = Job.objects.create(
            company=self.company_profile1, title="Job 1", description="Desc", status=Job.Status.PUBLISHED
        )
        self.job2_draft = Job.objects.create(
            company=self.company_profile1, title="Job 2", description="Desc", status=Job.Status.DRAFT
        )

        # Create Applications
        self.application1 = Application.objects.create(
            candidate=self.candidate_profile1, job=self.job1_published, status=Application.Status.APPLIED
        )

    def test_list_applications_as_candidate(self):
        self.client.force_authenticate(user=self.candidate_user1)
        response = self.client.get(reverse('application-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        self.client.force_authenticate(user=self.candidate_user2)
        response = self.client.get(reverse('application-list'))
        self.assertEqual(len(response.data), 0)

    def test_list_applications_as_company(self):
        self.client.force_authenticate(user=self.company_user1)
        response = self.client.get(reverse('application-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        self.client.force_authenticate(user=self.company_user2)
        response = self.client.get(reverse('application-list'))
        self.assertEqual(len(response.data), 0)

    def test_apply_to_job(self):
        self.client.force_authenticate(user=self.candidate_user2)
        data = {"job_id": self.job1_published.id, "cover_letter": "I want this job!"}
        response = self.client.post(reverse('application-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Application.objects.count(), 2)

    def test_apply_to_draft_job_fails(self):
        self.client.force_authenticate(user=self.candidate_user2)
        data = {"job_id": self.job2_draft.id}
        response = self.client.post(reverse('application-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_application_status(self):
        self.client.force_authenticate(user=self.company_user1)
        url = reverse('application-detail', args=[self.application1.id])
        data = {"status": "REVIEWING"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application1.refresh_from_db()
        self.assertEqual(self.application1.status, "REVIEWING")

    def test_unauthorized_update_application_status(self):
        self.client.force_authenticate(user=self.company_user2)
        url = reverse('application-detail', args=[self.application1.id])
        data = {"status": "REJECTED"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
