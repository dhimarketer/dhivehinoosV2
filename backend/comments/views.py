from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import ListAPIView
from rest_framework.authentication import SessionAuthentication
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging
from articles.models import Article
from .models import Comment, Vote

logger = logging.getLogger(__name__)


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
    permission_classes = [permissions.IsAdminUser]  # ✅ FIXED: Require admin authentication
    authentication_classes = [NoCSRFSessionAuthentication]  # ✅ Use custom auth without CSRF
    
    def get_queryset(self):
        queryset = Comment.objects.all()
        approved_filter = self.request.query_params.get('is_approved', None)
        if approved_filter is not None:
            queryset = queryset.filter(is_approved=approved_filter.lower() == 'true')
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list to add pagination support"""
        queryset = self.get_queryset()
        
        # Get pagination parameters
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Calculate pagination
        total_count = queryset.count()
        total_pages = (total_count + page_size - 1) // page_size
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        # Get paginated results
        paginated_queryset = queryset[start_index:end_index]
        
        # Serialize the data
        serializer = self.get_serializer(paginated_queryset, many=True)
        
        # Return paginated response
        return Response({
            'results': serializer.data,
            'count': total_count,
            'current_page': page,
            'page_size': page_size,
            'total_pages': total_pages,
            'next': f"?page={page + 1}&page_size={page_size}" if page < total_pages else None,
            'previous': f"?page={page - 1}&page_size={page_size}" if page > 1 else None,
            'has_next': page < total_pages,
            'has_previous': page > 1
        })


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
    # Check if comments are allowed (with caching)
    from settings_app.models import SiteSettings
    from django.core.cache import cache
    
    # Cache the settings check for 5 minutes to avoid repeated DB queries
    cache_key = 'site_settings_allow_comments'
    allow_comments = cache.get(cache_key)
    
    if allow_comments is None:
        settings = SiteSettings.get_settings()
        allow_comments = settings.allow_comments
        cache.set(cache_key, allow_comments, 300)  # Cache for 5 minutes
    
    if not allow_comments:
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
            article = vote.article
            article_moved_to_draft = False
            
            # Check if this is a downvote and if article should be moved to draft
            if vote.vote_type == 'down':
                # Count total downvotes for this article
                downvote_count = article.votes.filter(vote_type='down').count()
                
                # If article has 3 or more downvotes and is currently published, move to draft
                if downvote_count >= 3 and article.status == 'published':
                    article.status = 'draft'
                    article.save(update_fields=['status'])
                    article_moved_to_draft = True
                    logger.info(
                        f"Article '{article.title}' (ID: {article.id}) moved to draft "
                        f"due to {downvote_count} downvotes"
                    )
                    
                    # Clear all published articles cache to ensure article disappears from front page
                    from django.core.cache import cache
                    try:
                        # Try to clear all cache keys that start with 'published_articles_'
                        # This handles all pagination, category, and search variations
                        cache_cleared = False
                        if hasattr(cache, '_cache') and hasattr(cache._cache, 'get_client'):
                            try:
                                # Using Redis directly for pattern deletion
                                redis_client = cache._cache.get_client()
                                # Try using scan_iter for better performance (doesn't block)
                                if hasattr(redis_client, 'scan_iter'):
                                    keys_to_delete = list(redis_client.scan_iter(match='published_articles_*'))
                                    if keys_to_delete:
                                        # Delete in batches to avoid blocking
                                        batch_size = 100
                                        for i in range(0, len(keys_to_delete), batch_size):
                                            batch = keys_to_delete[i:i + batch_size]
                                            redis_client.delete(*batch)
                                        logger.info(f"Cleared {len(keys_to_delete)} published articles cache keys using scan_iter")
                                        cache_cleared = True
                                # Fallback to keys() if scan_iter not available
                                elif hasattr(redis_client, 'keys'):
                                    pattern = 'published_articles_*'
                                    keys_to_delete = redis_client.keys(pattern)
                                    if keys_to_delete:
                                        redis_client.delete(*keys_to_delete)
                                        logger.info(f"Cleared {len(keys_to_delete)} published articles cache keys using keys()")
                                        cache_cleared = True
                            except Exception as redis_error:
                                logger.warning(f"Redis pattern deletion failed: {str(redis_error)}, using fallback")
                        
                        # Fallback: clear common cache keys manually
                        if not cache_cleared:
                            from settings_app.models import SiteSettings
                            settings = SiteSettings.get_settings()
                            rows = settings.story_cards_rows
                            columns = settings.story_cards_columns
                            cleared_count = 0
                            # Clear first 20 pages for all categories and search variations
                            for page in range(1, 21):
                                # Clear 'all' category
                                key = f'published_articles_{page}_all__{rows}x{columns}'
                                if cache.delete(key):
                                    cleared_count += 1
                                # Clear with empty search
                                key = f'published_articles_{page}_all_{rows}x{columns}'
                                if cache.delete(key):
                                    cleared_count += 1
                                # Clear article's category if it exists
                                if article.category:
                                    key = f'published_articles_{page}_{article.category.slug}__{rows}x{columns}'
                                    if cache.delete(key):
                                        cleared_count += 1
                                    key = f'published_articles_{page}_{article.category.slug}_{rows}x{columns}'
                                    if cache.delete(key):
                                        cleared_count += 1
                            logger.info(f"Cleared {cleared_count} published articles cache keys (fallback method)")
                    except Exception as cache_error:
                        logger.error(f"Failed to clear cache when article moved to draft: {str(cache_error)}")
                    
                    # Also invalidate article detail cache
                    try:
                        from articles.cache_utils import invalidate_article_cache
                        invalidate_article_cache(article_id=article.id)
                    except Exception as invalidation_error:
                        logger.error(f"Failed to invalidate article cache: {str(invalidation_error)}")
            
            # Return response with flag indicating if article was moved to draft
            response_data = VoteSerializer(vote).data
            response_data['article_moved_to_draft'] = article_moved_to_draft
            if article_moved_to_draft:
                response_data['article_id'] = article.id
                response_data['article_slug'] = article.slug
            
            return Response(
                response_data, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error creating vote: {str(e)}")
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
    
    # Count votes from this IP
    votes_from_ip = Vote.objects.filter(article=article, ip_address=ip_address)
    vote_count = votes_from_ip.count()
    last_vote = votes_from_ip.order_by('-created_at').first()
    
    return Response({
        'has_voted': vote_count > 0,
        'vote_count': vote_count,
        'vote_type': last_vote.vote_type if last_vote else None,
        'vote_score': article.vote_score
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@authentication_classes([NoCSRFSessionAuthentication])
def test_comment_webhook(request):
    """Test the comment webhook configuration"""
    try:
        # Check if user is staff
        if not request.user.is_staff:
            return Response({
                'success': False,
                'message': 'Only admin users can test webhook settings',
            }, status=status.HTTP_403_FORBIDDEN)
        
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