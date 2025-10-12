from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView
from rest_framework.authentication import SessionAuthentication
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from articles.models import Article
from .models import Comment, Vote


class NoCSRFSessionAuthentication(SessionAuthentication):
    """
    Custom authentication class that doesn't enforce CSRF tokens
    """
    def enforce_csrf(self, request):
        return  # Skip CSRF enforcement
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


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([NoCSRFSessionAuthentication])
def approve_comment(request, comment_id):
    """Approve a comment"""
    try:
        comment = Comment.objects.get(id=comment_id)
        
        # Check if comment is already approved
        if comment.is_approved:
            return Response({
                'message': 'Comment is already approved',
                'comment': CommentSerializer(comment).data
            })
        
        # Approve the comment (webhook will be sent automatically via save method)
        comment.is_approved = True
        comment.save()
        
        return Response({
            'message': 'Comment approved successfully',
            'comment': CommentSerializer(comment).data
        })
    except Comment.DoesNotExist:
        return Response(
            {'error': 'Comment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to approve comment', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([NoCSRFSessionAuthentication])
def reject_comment(request, comment_id):
    """Reject/unapprove a comment"""
    try:
        comment = Comment.objects.get(id=comment_id)
        comment.is_approved = False
        comment.save()
        return Response({
            'message': 'Comment rejected successfully',
            'comment': CommentSerializer(comment).data
        })
    except Comment.DoesNotExist:
        return Response(
            {'error': 'Comment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to reject comment', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
@authentication_classes([NoCSRFSessionAuthentication])
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
@authentication_classes([NoCSRFSessionAuthentication])
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


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([NoCSRFSessionAuthentication])
def test_comment_webhook(request):
    """Test the comment webhook configuration"""
    try:
        from .webhook_service import CommentWebhookService
        from settings_app.models import SiteSettings
        
        site_settings = SiteSettings.get_settings()
        
        if not site_settings.comment_webhook_enabled:
            return Response({
                'success': False,
                'message': 'Comment webhook is disabled',
                'settings': {
                    'webhook_enabled': site_settings.comment_webhook_enabled,
                    'webhook_url': site_settings.comment_webhook_url,
                }
            })
        
        if not site_settings.comment_webhook_url:
            return Response({
                'success': False,
                'message': 'Comment webhook URL is not configured',
                'settings': {
                    'webhook_enabled': site_settings.comment_webhook_enabled,
                    'webhook_url': site_settings.comment_webhook_url,
                }
            })
        
        # Test the webhook
        result = CommentWebhookService.test_webhook(
            site_settings.comment_webhook_url,
            site_settings.comment_webhook_secret
        )
        
        return Response(result)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Webhook test failed: {str(e)}',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)