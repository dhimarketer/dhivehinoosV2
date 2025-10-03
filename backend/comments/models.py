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
        # Auto-approve if user has commented before from same IP
        if not self.pk:  # Only for new comments
            existing_comment = Comment.objects.filter(
                ip_address=self.ip_address,
                is_approved=True
            ).exists()
            if existing_comment:
                self.is_approved = True
        super().save(*args, **kwargs)


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