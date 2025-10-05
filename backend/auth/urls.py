from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth-login'),
    path('logout/', views.logout_view, name='auth-logout'),
    path('user/', views.user_view, name='auth-user'),
    path('create-admin/', views.create_admin_user, name='auth-create-admin'),
]
