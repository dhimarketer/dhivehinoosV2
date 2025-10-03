from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import ContactMessage
from .serializers import ContactMessageSerializer, ContactMessageCreateSerializer


@method_decorator(csrf_exempt, name='dispatch')
class ContactMessageViewSet(ModelViewSet):
    """Admin viewset for managing contact messages"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow any for testing
    
    def get_queryset(self):
        queryset = ContactMessage.objects.all()
        read_filter = self.request.query_params.get('is_read', None)
        if read_filter is not None:
            queryset = queryset.filter(is_read=read_filter.lower() == 'true')
        return queryset


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def create_contact_message(request):
    """Public API for creating contact messages"""
    serializer = ContactMessageCreateSerializer(data=request.data)
    if serializer.is_valid():
        message = serializer.save()
        return Response(
            ContactMessageSerializer(message).data, 
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)