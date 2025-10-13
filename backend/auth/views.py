from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
import json
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    """
    Login endpoint for admin users
    """
    logger.info(f"Login attempt from {request.META.get('REMOTE_ADDR')}")
    
    try:
        # Parse JSON data
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            logger.error("Invalid JSON in login request")
            return Response(
                {'error': 'Invalid JSON data'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        username = data.get('username')
        password = data.get('password')
        
        logger.info(f"Login attempt for user: {username}")
        
        if not username or not password:
            logger.warning("Missing username or password")
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Authenticate user
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            logger.info(f"User {username} authenticated successfully")
            if user.is_staff:
                # Login the user
                login(request, user)
                
                # Get CSRF token for the session
                csrf_token = get_token(request)
                
                response_data = {
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser,
                    },
                    'csrf_token': csrf_token
                }
                
                logger.info(f"User {username} logged in successfully")
                return Response(response_data)
            else:
                logger.warning(f"Non-staff user {username} attempted login")
                return Response(
                    {'error': 'Only admin users can access this system'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            logger.warning(f"Authentication failed for user: {username}")
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {'error': 'Login failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def get_csrf_token(request):
    """
    Get CSRF token for frontend
    """
    csrf_token = get_token(request)
    return Response({'csrf_token': csrf_token})

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def logout_view(request):
    """
    Logout endpoint
    """
    try:
        logout(request)
        return Response({'message': 'Logout successful'})
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({'message': 'Logout completed'})  # Always return success for logout

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_view(request):
    """
    Get current user information
    """
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser,
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def create_admin_user(request):
    """
    Create admin user for testing (only in development)
    """
    if not request.get_host().startswith('localhost') and not request.get_host().startswith('127.0.0.1'):
        return Response(
            {'error': 'This endpoint is only available in development'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        data = json.loads(request.body)
        username = data.get('username', 'admin')
        password = data.get('password', 'admin123')
        email = data.get('email', 'admin@dhivehinoos.net')
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'User already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create superuser
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        
        return Response({
            'message': 'Admin user created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        })
        
    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON data'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to create user: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )