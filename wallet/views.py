from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.core.exceptions import ValidationError
from .models import Wallet, Transaction
from .serializers import (
    WalletSerializer,
    DepositSerializer,
    TransferSerializer,
    TransactionSerializer,
    UserRegistrationSerializer,
)
from .services import deposit_funds, transfer_funds


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create wallet for new user
            Wallet.objects.create(user=user)
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WalletBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class DepositView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DepositSerializer(data=request.data)
        if serializer.is_valid():
            amount = serializer.validated_data["amount"]
            try:
                wallet = deposit_funds(request.user, amount)
                return Response(
                    {"message": "Deposit successful", "new_balance": wallet.balance},
                    status=status.HTTP_200_OK,
                )
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransferView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TransferSerializer(data=request.data)
        if serializer.is_valid():
            receiver_username = serializer.validated_data["receiver_username"]
            amount = serializer.validated_data["amount"]
            try:
                sender_wallet = transfer_funds(request.user, receiver_username, amount)
                return Response(
                    {
                        "message": "Transfer successful",
                        "new_balance": sender_wallet.balance,
                    },
                    status=status.HTTP_200_OK,
                )
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransactionHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, "wallet"):
            return Transaction.objects.none()

        wallet = user.wallet
        queryset = Transaction.objects.filter(
            sender=wallet
        ) | Transaction.objects.filter(receiver=wallet)

        # Filtering
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by("-timestamp")
