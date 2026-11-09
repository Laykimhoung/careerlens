from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.accounts.models import CompanyProfile, CandidateProfile
from .models import JobCategory, Job, Skill, JobSkill, SavedJob

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

    def test_job_recommendations_get(self):
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse('job_recommendations')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('top_score', response.data)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(response.data['count'], 1)
        rec = response.data['results'][0]
        self.assertIn('match_score', rec)
        self.assertIn('score_breakdown', rec)
        self.assertIn('matching_skills', rec)
        self.assertIn('missing_skills', rec)
        self.assertIn('explanation', rec)
        self.assertIn('improvement_suggestions', rec)

    def test_job_recommendations_post_preferences(self):
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse('job_recommendations')
        pref_data = {
            'target_role': 'Job 1',
            'preferred_location': 'Remote',
            'preferred_employment_type': 'FULL_TIME',
            'preferred_workplace_type': 'ON_SITE',
        }
        response = self.client.post(url, pref_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['target_role'], 'Job 1')
        self.assertIn('results', response.data)

    def test_roadmap_options_get(self):
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse('roadmap_options')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('popular_roles', response.data)
        self.assertGreater(len(response.data['popular_roles']), 0)
        self.assertIn('available_jobs', response.data)
        self.assertGreaterEqual(len(response.data['available_jobs']), 1)

    def test_generate_and_get_career_roadmap(self):
        self.client.force_authenticate(user=self.candidate_user)
        gen_url = reverse('generate_roadmap')
        payload = {
            'target_role': 'Frontend Developer',
            'target_job_id': self.job1_published.id,
            'weekly_hours': 12,
        }
        gen_res = self.client.post(gen_url, payload, format='json')
        self.assertEqual(gen_res.status_code, status.HTTP_200_OK)
        self.assertIn('roadmap', gen_res.data)
        roadmap = gen_res.data['roadmap']
        self.assertEqual(len(roadmap['stages']), 5)
        self.assertEqual(roadmap['weekly_hours'], 12)

        # Retrieve active roadmap
        get_url = reverse('career_roadmap')
        get_res = self.client.get(get_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertTrue(get_res.data['has_roadmap'])
        self.assertEqual(get_res.data['roadmap']['target_role'], 'Frontend Developer')

    def test_update_milestone_and_sync_skill(self):
        self.client.force_authenticate(user=self.candidate_user)
        # First generate
        self.client.post(reverse('generate_roadmap'), {'target_role': 'Backend Developer', 'weekly_hours': 10}, format='json')

        # Update milestone
        ms_url = reverse('update_milestone')
        ms_payload = {
            'stage_id': 1,
            'milestone_id': 101,
            'status': 'completed',
            'notes': 'Completed standard exercises',
        }
        ms_res = self.client.patch(ms_url, ms_payload, format='json')
        self.assertEqual(ms_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(ms_res.data['roadmap']['completed_milestones'], 1)

        # Sync skill to profile
        sync_url = reverse('sync_skill_to_profile')
        sync_payload = {'skill_name': 'Docker', 'proficiency': 'EXPERT'}
        sync_res = self.client.post(sync_url, sync_payload, format='json')
        self.assertEqual(sync_res.status_code, status.HTTP_200_OK)
        self.assertTrue(
            self.candidate_profile.skills.filter(skill__name__iexact='Docker').exists()
        )


class JobCategoryTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin_cat_test", email="admin_cat@test.com", password="pw", role=User.Role.ADMIN
        )
        self.candidate_user = User.objects.create_user(
            username="candidate_cat_test", email="cand_cat@test.com", password="pw", role=User.Role.CANDIDATE
        )
        self.cat1 = JobCategory.objects.create(name="Cybersecurity")

    def test_list_categories(self):
        url = reverse('category-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [c['name'] for c in response.data.get('results', response.data)]
        self.assertIn("Cybersecurity", names)

    def test_create_category_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('category-list')
        response = self.client.post(url, {"name": "Cloud Architecture"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(JobCategory.objects.filter(name="Cloud Architecture").exists())

    def test_create_category_as_candidate_forbidden(self):
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse('category-list')
        response = self.client.post(url, {"name": "Forbidden Category"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_category_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('category-detail', kwargs={'pk': self.cat1.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(JobCategory.objects.filter(id=self.cat1.id).exists())
