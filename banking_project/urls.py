"""
URL configuration for banking_project project.
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from wallet.views import LoginPageView, RegisterPageView, ProfilePageView

urlpatterns = [
    path("", RedirectView.as_view(url="/login/", permanent=False), name="frontend-home"),
    path("login/", LoginPageView.as_view(), name="frontend-login"),
    path("register/", RegisterPageView.as_view(), name="frontend-register"),
    path("dashboard/", ProfilePageView.as_view(), name="frontend-dashboard"),
    path("profile/", ProfilePageView.as_view(), name="frontend-profile"),
    path("admin/", admin.site.urls),
    path("api/wallet/", include("wallet.urls")),
    # API Schema and Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
