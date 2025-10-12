from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'admin', views.CommentViewSet, basename='comment-admin')

urlpatterns = [
    path('', include(router.urls)),
    path('article/<slug:slug>/', views.ArticleCommentsListView.as_view(), name='article-comments'),
    path('create/', views.create_comment, name='create-comment'),
    path('vote/', views.create_vote, name='create-vote'),
    path('vote-status/<int:article_id>/', views.article_vote_status, name='article-vote-status'),
    path('admin/<int:comment_id>/approve/', views.approve_comment, name='approve-comment'),
    path('admin/<int:comment_id>/reject/', views.reject_comment, name='reject-comment'),
    path('test-webhook/', views.test_comment_webhook, name='test-comment-webhook'),
]
