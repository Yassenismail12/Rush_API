from rest_framework import serializers
from .models import Wallet, Transaction, CustomUser


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["username", "email", "first_name", "last_name"]


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["balance", "currency"]


class TransactionSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    receiver = serializers.StringRelatedField()

    class Meta:
        model = Transaction
        fields = ["reference_id", "sender", "receiver", "amount", "status", "timestamp"]


class DepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class TransferSerializer(serializers.Serializer):
    receiver_username = serializers.CharField(max_length=150)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ["username", "password", "email", "first_name", "last_name"]

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user
