from django.urls import path
from . import views

urlpatterns = [
    path('admin/', views.site_settings_view, name='site-settings-admin'),
    path('admin/get/', views.admin_settings_view, name='site-settings-admin-get'),
    path('test/', views.test_settings_view, name='site-settings-test'),
    path('public/', views.public_settings_view, name='site-settings-public'),
]
