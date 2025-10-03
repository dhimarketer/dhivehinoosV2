from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin', views.ContactMessageViewSet, basename='contact-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('create/', views.create_contact_message, name='create-contact-message'),
]
