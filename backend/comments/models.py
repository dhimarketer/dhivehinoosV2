from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


class Comment(models.Model):
    article = models.ForeignKey('articles.Article', on_delete=models.CASCADE, related_name='comments')
    author_name = models.CharField(max_length=100, blank=True)
    content = models.TextField()
    ip_address = models.GenericIPAddressField()
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
    
    def __str__(self):
        return f"Comment by {self.author_name or 'Anonymous'} on {self.article.title}"
    
    def save(self, *args, **kwargs):
        # Track if this is a new comment and the original approval status
        is_new_comment = not self.pk
        original_approved_status = self.is_approved
        
        # Auto-approve if user has commented before from same IP
        if is_new_comment:
            existing_comment = Comment.objects.filter(
                ip_address=self.ip_address,
                is_approved=True
            ).exists()
            if existing_comment:
                self.is_approved = True
        
        # Save the comment
        super().save(*args, **kwargs)
        
        # Send webhook if comment was just approved (either auto-approved or manually approved)
        # Check if the comment is now approved and wasn't approved before (or is newly created)
        if self.is_approved and (is_new_comment or not original_approved_status):
            try:
                # Send webhook asynchronously to prevent blocking comment creation
                import threading
                import logging
                from .webhook_service import CommentWebhookService
                
                def send_webhook_async():
                    try:
                        # Add a small delay to ensure comment is fully saved
                        import time
                        import logging
                        logger = logging.getLogger(__name__)
                        time.sleep(0.1)
                        
                        # Send webhook with error handling
                        success = CommentWebhookService.send_approved_comment(self)
                        if success:
                            logger.info(f"Webhook sent successfully for approved comment {self.id}")
                        else:
                            logger.warning(f"Webhook failed for approved comment {self.id}")
                            
                    except Exception as e:
                        logger = logging.getLogger(__name__)
                        logger.error(f"Failed to send webhook for approved comment {self.id}: {str(e)}")
                
                # Start webhook in background thread with daemon=True to prevent blocking shutdown
                webhook_thread = threading.Thread(target=send_webhook_async, daemon=True)
                webhook_thread.start()
                
                # Log that webhook was initiated
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Webhook initiated for approved comment {self.id}")
                
            except Exception as e:
                # Log error but don't fail the save operation
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to start webhook thread for approved comment {self.id}: {str(e)}")


class Vote(models.Model):
    VOTE_CHOICES = [
        ('up', 'Upvote'),
        ('down', 'Downvote'),
    ]
    
    article = models.ForeignKey('articles.Article', on_delete=models.CASCADE, related_name='votes')
    ip_address = models.GenericIPAddressField()
    vote_type = models.CharField(max_length=10, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['article', 'ip_address']
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'
    
    def __str__(self):
        return f"{self.vote_type} vote from {self.ip_address} on {self.article.title}"
    
    def clean(self):
        # Check if user has already voted on this article
        existing_vote = Vote.objects.filter(
            article=self.article,
            ip_address=self.ip_address
        ).exclude(pk=self.pk).exists()
        
        if existing_vote:
            raise ValidationError('You have already voted on this article.')
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)