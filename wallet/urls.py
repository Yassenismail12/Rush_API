from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    WalletBalanceView,
    UserProfileView,
    DepositView,
    TransferView,
    TransactionHistoryView,
    UserRegistrationView,
)

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", UserProfileView.as_view(), name="wallet-profile"),
    path("balance/", WalletBalanceView.as_view(), name="wallet-balance"),
    path("deposit/", DepositView.as_view(), name="wallet-deposit"),
    path("transfer/", TransferView.as_view(), name="wallet-transfer"),
    path("transactions/", TransactionHistoryView.as_view(), name="wallet-transactions"),
]
