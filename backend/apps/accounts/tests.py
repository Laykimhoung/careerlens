from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import CandidateProfile, CompanyProfile

User = get_user_model()

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('token_obtain_pair')
        
    def test_register_candidate(self):
        data = {
            "username": "candidate1",
            "email": "candidate1@example.com",
            "password": "StrongPassword123!",
            "first_name": "John",
            "last_name": "Doe",
            "role": User.Role.CANDIDATE
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="candidate1").exists())
        user = User.objects.get(username="candidate1")
        self.assertTrue(CandidateProfile.objects.filter(user=user).exists())
        self.assertFalse(CompanyProfile.objects.filter(user=user).exists())

    def test_register_company(self):
        data = {
            "username": "company1",
            "email": "company1@example.com",
            "password": "StrongPassword123!",
            "role": User.Role.COMPANY
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="company1")
        self.assertTrue(CompanyProfile.objects.filter(user=user).exists())
        self.assertEqual(CompanyProfile.objects.get(user=user).company_name, "company1")

    def test_login_success(self):
        user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="StrongPassword123!",
            role=User.Role.CANDIDATE
        )
        CandidateProfile.objects.create(user=user)

        data = {
            "username": "testuser",
            "password": "StrongPassword123!"
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_failure(self):
        data = {
            "username": "wronguser",
            "password": "wrongpassword"
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(APITestCase):
    def setUp(self):
        self.candidate_user = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password123",
            role=User.Role.CANDIDATE
        )
        self.candidate_profile = CandidateProfile.objects.create(user=self.candidate_user)

        self.company_user = User.objects.create_user(
            username="company",
            email="company@example.com",
            password="password123",
            role=User.Role.COMPANY
        )
        self.company_profile = CompanyProfile.objects.create(user=self.company_user, company_name="Test Company")

    def test_current_user_endpoint(self):
        self.client.force_authenticate(user=self.candidate_user)
        response = self.client.get(reverse('current_user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], "candidate")

    def test_update_candidate_profile(self):
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse('candidate-detail', args=[self.candidate_profile.id])
        data = {"university": "Harvard"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.candidate_profile.refresh_from_db()
        self.assertEqual(self.candidate_profile.university, "Harvard")

    def test_unauthorized_profile_update(self):
        self.client.force_authenticate(user=self.company_user)
        url = reverse('candidate-detail', args=[self.candidate_profile.id])
        data = {"university": "MIT"}
        response = self.client.patch(url, data, format='json')
        # company user cannot edit candidate profile
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_gemini_key_get_and_delete(self):
        self.client.force_authenticate(user=self.candidate_user)
        url = reverse('gemini_key')
        get_res = self.client.get(url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertFalse(get_res.data['has_key'])
        self.assertEqual(get_res.data['status'], 'not_configured')

        # Set key directly and test get preview + delete
        self.candidate_profile.gemini_api_key = "AIzaSyFakeTestKey12345"
        self.candidate_profile.save()

        get_res2 = self.client.get(url)
        self.assertEqual(get_res2.status_code, status.HTTP_200_OK)
        self.assertTrue(get_res2.data['has_key'])
        self.assertIn("...", get_res2.data['key_preview'])

        del_res = self.client.delete(url)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertEqual(del_res.data['status'], 'disconnected')
        self.candidate_profile.refresh_from_db()
        self.assertEqual(self.candidate_profile.gemini_api_key, "")
