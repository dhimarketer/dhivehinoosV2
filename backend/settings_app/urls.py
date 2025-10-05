from django.urls import path
from . import views

urlpatterns = [
    path('admin/', views.site_settings_view, name='site-settings-admin'),
    path('public/', views.public_settings_view, name='site-settings-public'),
]
