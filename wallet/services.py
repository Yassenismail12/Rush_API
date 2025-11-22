from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Wallet, Transaction, CustomUser
from decimal import Decimal

def deposit_funds(user, amount):
    """
    Deposits funds into the user's wallet.
    """
    if amount <= 0:
        raise ValidationError("Deposit amount must be positive.")

    with transaction.atomic():
        # Lock the wallet row to prevent concurrent updates
        wallet = Wallet.objects.select_for_update().get(user=user)
        wallet.balance += Decimal(amount)
        wallet.save()

        Transaction.objects.create(
            receiver=wallet,
            amount=amount,
            status='SUCCESS'
        )
        return wallet

def transfer_funds(sender_user, receiver_username, amount):
    """
    Transfers funds from sender to receiver securely handling concurrency.
    """
    if amount <= 0:
        raise ValidationError("Transfer amount must be positive.")

    with transaction.atomic():
        # Lock the sender's wallet
        # select_for_update() locks the row until the end of the transaction block.
        # This prevents other transactions from reading/writing this row.
        sender_wallet = Wallet.objects.select_for_update().get(user=sender_user)

        if sender_wallet.balance < amount:
            raise ValidationError("Insufficient funds.")

        try:
            receiver_user = CustomUser.objects.get(username=receiver_username)
            # Lock the receiver's wallet as well to ensure consistency
            receiver_wallet = Wallet.objects.select_for_update().get(user=receiver_user)
        except CustomUser.DoesNotExist:
            raise ValidationError("Receiver not found.")
        except Wallet.DoesNotExist:
            raise ValidationError("Receiver wallet not found.")

        if sender_wallet.user == receiver_wallet.user:
             raise ValidationError("Cannot transfer to self.")

        # Perform the transfer
        sender_wallet.balance -= Decimal(amount)
        sender_wallet.save()

        receiver_wallet.balance += Decimal(amount)
        receiver_wallet.save()

        # Create transaction record
        Transaction.objects.create(
            sender=sender_wallet,
            receiver=receiver_wallet,
            amount=amount,
            status='SUCCESS'
        )
        
        return sender_wallet
