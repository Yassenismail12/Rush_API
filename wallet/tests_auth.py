from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = "/api/wallet/register/"
        self.token_url = "/api/wallet/token/"

    def test_registration(self):
        data = {
            "username": "newuser",
            "password": "password123",
            "email": "newuser@example.com",
            "first_name": "New",
            "last_name": "User",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newuser").exists())
        # Check if wallet was created
        user = User.objects.get(username="newuser")
        self.assertTrue(hasattr(user, "wallet"))

    def test_login_jwt(self):
        User.objects.create_user(username="testuser", password="password123")
        data = {"username": "testuser", "password": "password123"}
        response = self.client.post(self.token_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_protected_view_without_token(self):
        response = self.client.get("/api/wallet/balance/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_view_with_token(self):
        user = User.objects.create_user(username="testuser", password="password123")
        # Create wallet manually as signal/view logic handles it usually
        from .models import Wallet

        Wallet.objects.create(user=user)

        # Get token
        response = self.client.post(
            self.token_url, {"username": "testuser", "password": "password123"}
        )
        access_token = response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + access_token)
        response = self.client.get("/api/wallet/balance/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
