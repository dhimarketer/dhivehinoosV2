from rest_framework import serializers
from .models import Comment, Vote


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'author_name', 'content', 'is_approved',
            'created_at'
        ]
        read_only_fields = ['created_at']


class CommentCreateSerializer(serializers.ModelSerializer):
    article_slug = serializers.CharField(write_only=True, required=False)
    article = serializers.PrimaryKeyRelatedField(read_only=True, required=False)
    
    class Meta:
        model = Comment
        fields = ['article', 'article_slug', 'author_name', 'content']
    
    def validate(self, data):
        # Ensure either article or article_slug is provided
        if not data.get('article') and not data.get('article_slug'):
            raise serializers.ValidationError('Either article or article_slug must be provided')
        return data
    
    def create(self, validated_data):
        # Handle article_slug if provided
        article_slug = validated_data.pop('article_slug', None)
        if article_slug:
            from articles.models import Article
            try:
                article = Article.objects.get(slug=article_slug, status='published')
                validated_data['article'] = article
            except Article.DoesNotExist:
                raise serializers.ValidationError({'article_slug': 'Article not found or not published'})
        
        # Get IP address from request
        request = self.context.get('request')
        ip_address = self.get_client_ip(request)
        
        # Create comment with IP address
        comment = Comment.objects.create(
            **validated_data,
            ip_address=ip_address
        )
        return comment
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'article', 'vote_type', 'created_at']
        read_only_fields = ['created_at']


class VoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['article', 'vote_type']
    
    def create(self, validated_data):
        # Get IP address from request
        request = self.context.get('request')
        ip_address = self.get_client_ip(request)
        
        # Create vote with IP address
        vote = Vote.objects.create(
            **validated_data,
            ip_address=ip_address
        )
        return vote
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip