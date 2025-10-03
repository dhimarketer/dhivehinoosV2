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
    class Meta:
        model = Comment
        fields = ['article', 'author_name', 'content']
    
    def create(self, validated_data):
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