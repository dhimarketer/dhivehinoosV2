from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin', views.ContactMessageViewSet, basename='contact-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('create/', views.create_contact_message, name='create-contact-message'),
    path('admin/<int:message_id>/archive/', views.archive_contact_message, name='archive-contact-message'),
    path('admin/<int:message_id>/unarchive/', views.unarchive_contact_message, name='unarchive-contact-message'),
    path('admin/<int:message_id>/delete/', views.delete_contact_message, name='delete-contact-message'),
]
