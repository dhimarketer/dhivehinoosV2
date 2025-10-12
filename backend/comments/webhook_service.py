"""
Webhook service for sending approved comments to external services like n8n.
"""

import requests
import json
import logging
from django.conf import settings
from django.utils import timezone
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class CommentWebhookService:
    """Service for sending approved comments to webhook endpoints"""
    
    @staticmethod
    def send_approved_comment(comment) -> bool:
        """
        Send an approved comment to the configured webhook URL.
        
        Args:
            comment: Comment instance that was just approved
            
        Returns:
            bool: True if webhook was sent successfully, False otherwise
        """
        try:
            from settings_app.models import SiteSettings
            site_settings = SiteSettings.get_settings()
            
            # Check if webhook is enabled and configured
            if not site_settings.comment_webhook_enabled:
                logger.debug("Comment webhook is disabled, skipping webhook send")
                return True
            
            if not site_settings.comment_webhook_url:
                logger.warning("Comment webhook is enabled but no URL configured")
                return False
            
            # Prepare webhook payload
            payload = CommentWebhookService._prepare_webhook_payload(comment)
            
            # Send webhook
            success = CommentWebhookService._send_webhook_request(
                site_settings.comment_webhook_url,
                payload,
                site_settings.comment_webhook_secret
            )
            
            if success:
                logger.info(f"Successfully sent approved comment {comment.id} to webhook")
            else:
                logger.error(f"Failed to send approved comment {comment.id} to webhook")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending comment webhook: {str(e)}")
            return False
    
    @staticmethod
    def _prepare_webhook_payload(comment) -> Dict[str, Any]:
        """
        Prepare the webhook payload for an approved comment.
        
        Args:
            comment: Comment instance
            
        Returns:
            dict: Webhook payload
        """
        return {
            "event_type": "comment_approved",
            "timestamp": timezone.now().isoformat(),
            "comment": {
                "id": comment.id,
                "content": comment.content,
                "author_name": comment.author_name or "Anonymous",
                "ip_address": comment.ip_address,
                "is_approved": comment.is_approved,
                "created_at": comment.created_at.isoformat(),
                "article": {
                    "id": comment.article.id,
                    "title": comment.article.title,
                    "slug": comment.article.slug,
                    "url": comment.article.article_url,
                    "status": comment.article.status,
                    "created_at": comment.article.created_at.isoformat(),
                },
                "category": {
                    "id": comment.article.category.id,
                    "name": comment.article.category.name,
                    "slug": comment.article.category.slug,
                } if comment.article.category else None,
            },
            "site": {
                "name": "Dhivehinoos.net",
                "url": "https://dhivehinoos.net",
            }
        }
    
    @staticmethod
    def _send_webhook_request(url: str, payload: Dict[str, Any], secret: Optional[str] = None) -> bool:
        """
        Send webhook request to the specified URL.
        
        Args:
            url: Webhook URL
            payload: Payload data to send
            secret: Optional secret for authentication
            
        Returns:
            bool: True if request was successful, False otherwise
        """
        try:
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Dhivehinoos-CommentWebhook/1.0',
            }
            
            # Add secret to headers if provided
            if secret:
                headers['X-Webhook-Secret'] = secret
            
            # Send POST request with timeout
            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=30,  # 30 second timeout
                verify=True  # Verify SSL certificates
            )
            
            # Check if request was successful
            if response.status_code in [200, 201, 202]:
                logger.info(f"Webhook sent successfully to {url}, status: {response.status_code}")
                return True
            else:
                logger.warning(f"Webhook request failed, status: {response.status_code}, response: {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error(f"Webhook request timeout for {url}")
            return False
        except requests.exceptions.ConnectionError:
            logger.error(f"Webhook connection error for {url}")
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Webhook request error for {url}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending webhook to {url}: {str(e)}")
            return False
    
    @staticmethod
    def test_webhook(url: str, secret: Optional[str] = None) -> Dict[str, Any]:
        """
        Test webhook endpoint with a sample payload.
        
        Args:
            url: Webhook URL to test
            secret: Optional secret for authentication
            
        Returns:
            dict: Test result with success status and details
        """
        test_payload = {
            "event_type": "webhook_test",
            "timestamp": timezone.now().isoformat(),
            "message": "This is a test webhook from Dhivehinoos.net",
            "test_data": {
                "comment_id": "test_123",
                "content": "This is a test comment for webhook testing",
                "author_name": "Test User",
                "article_title": "Test Article",
            },
            "site": {
                "name": "Dhivehinoos.net",
                "url": "https://dhivehinoos.net",
            }
        }
        
        try:
            success = CommentWebhookService._send_webhook_request(url, test_payload, secret)
            
            return {
                "success": success,
                "message": "Webhook test completed",
                "url": url,
                "timestamp": timezone.now().isoformat(),
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Webhook test failed: {str(e)}",
                "url": url,
                "timestamp": timezone.now().isoformat(),
            }
