from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from .models import Message, Notification

User = get_user_model()

class MessagingTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", email="user1@test.com", password="pw1")
        self.user2 = User.objects.create_user(username="user2", email="user2@test.com", password="pw2")

        self.message1 = Message.objects.create(sender=self.user1, recipient=self.user2, text="Hello user2")
        self.notification1 = Notification.objects.create(user=self.user1, message="System alert")

    def test_list_messages(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse('message-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_send_message(self):
        self.client.force_authenticate(user=self.user2)
        url = reverse('message-list')
        data = {"recipient": self.user1.id, "text": "Hi user1"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 2)

    def test_mark_message_as_read(self):
        self.client.force_authenticate(user=self.user2)
        url = reverse('message-mark-as-read', args=[self.message1.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.message1.refresh_from_db()
        self.assertIsNotNone(self.message1.read_at)

    def test_mark_message_as_read_unauthorized(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('message-mark-as-read', args=[self.message1.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_notifications(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(reverse('notification-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_mark_notification_as_read(self):
        self.client.force_authenticate(user=self.user1)
        url = reverse('notification-mark-as-read', args=[self.notification1.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
