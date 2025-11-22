from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from .models import Wallet, Transaction

User = get_user_model()


class WalletAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username="user1", password="password123")
        self.user2 = User.objects.create_user(username="user2", password="password123")

        # Create wallets (signals usually handle this, but we didn't implement signals, so manual creation or view logic)
        # Our views create wallet on GET balance if not exists, but let's create them explicitly for tests
        Wallet.objects.create(user=self.user1)
        Wallet.objects.create(user=self.user2)

    def test_deposit(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post("/api/wallet/deposit/", {"amount": "100.00"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user1.wallet.refresh_from_db()
        self.assertEqual(self.user1.wallet.balance, Decimal("100.00"))

    def test_transfer(self):
        # Deposit first
        self.user1.wallet.balance = Decimal("200.00")
        self.user1.wallet.save()

        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            "/api/wallet/transfer/", {"receiver_username": "user2", "amount": "50.00"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user1.wallet.refresh_from_db()
        self.user2.wallet.refresh_from_db()

        self.assertEqual(self.user1.wallet.balance, Decimal("150.00"))
        self.assertEqual(self.user2.wallet.balance, Decimal("50.00"))

    def test_insufficient_funds(self):
        self.user1.wallet.balance = Decimal("10.00")
        self.user1.wallet.save()

        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            "/api/wallet/transfer/", {"receiver_username": "user2", "amount": "50.00"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transaction_history(self):
        self.user1.wallet.balance = Decimal("100.00")
        self.user1.wallet.save()

        # Perform transfer
        from .services import transfer_funds

        transfer_funds(self.user1, "user2", Decimal("20.00"))

        self.client.force_authenticate(user=self.user1)
        response = self.client.get("/api/wallet/transactions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # With pagination, results are in 'results' key
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["amount"], "20.00")
