from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from articles.models import Article
from .models import Comment, Vote
from .serializers import (
    CommentSerializer, CommentCreateSerializer,
    VoteSerializer, VoteCreateSerializer
)


@method_decorator(csrf_exempt, name='dispatch')
class CommentViewSet(ModelViewSet):
    """Admin viewset for managing comments"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
    
    def get_queryset(self):
        queryset = Comment.objects.all()
        approved_filter = self.request.query_params.get('is_approved', None)
        if approved_filter is not None:
            queryset = queryset.filter(is_approved=approved_filter.lower() == 'true')
        return queryset


class ArticleCommentsListView(ListAPIView):
    """Public API for listing approved comments for an article"""
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        article_slug = self.kwargs['slug']
        article = get_object_or_404(Article, slug=article_slug, status='published')
        return Comment.objects.filter(article=article, is_approved=True)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def create_comment(request):
    """Public API for creating comments"""
    # Check if comments are allowed
    from settings_app.models import SiteSettings
    settings = SiteSettings.get_settings()
    if not settings.allow_comments:
        return Response(
            {'error': 'Comments are currently disabled'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = CommentCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        comment = serializer.save()
        return Response(
            CommentSerializer(comment).data, 
            status=status.HTTP_201_CREATED
        )
    
    # Return detailed validation errors
    return Response({
        'error': 'Validation failed',
        'details': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def create_vote(request):
    """Public API for creating votes"""
    serializer = VoteCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        try:
            vote = serializer.save()
            return Response(
                VoteSerializer(vote).data, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def article_vote_status(request, article_id):
    """Get vote status for an article from current IP"""
    article = get_object_or_404(Article, id=article_id)
    
    # Get client IP
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(',')[0]
    else:
        ip_address = request.META.get('REMOTE_ADDR')
    
    # Check if user has voted
    vote = Vote.objects.filter(article=article, ip_address=ip_address).first()
    
    return Response({
        'has_voted': vote is not None,
        'vote_type': vote.vote_type if vote else None,
        'vote_score': article.vote_score
    })