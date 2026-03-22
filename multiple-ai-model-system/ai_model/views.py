from django.shortcuts import render

# Create your views here.

from .serializers import AIModelSerializer,AIModelLimitedSerializer
from rest_framework import viewsets
from .models import AIModelInfo, ChatSession
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

class AImodelView(viewsets.ModelViewSet):
    queryset = AIModelInfo.objects.all()
    serializer_class = AIModelSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['model_id', 'model_type', 'provider']
    # permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = self.queryset

        
        if not (self.request.user and self.request.user.is_staff):
            queryset = queryset.filter(is_active=True).only(
                'id',
                'name',
                'model_id',
                'created_at',
                'description',
                'base_url',
                'provider',
                'model_type',
            )

        model_type = self.request.query_params.get('model_type')

        if model_type == 'text_to_video':
            queryset = queryset.filter(
                Q(model_type='text_to_video')
                | Q(model_type='text_or_image_to_video')
            )

        elif model_type == 'image_to_video':
            queryset = queryset.filter(
                Q(model_type='image_to_video')
                | Q(model_type='text_or_image_to_video')
            )

        return queryset

    def get_serializer_class(self):
        if self.request.user and self.request.user.is_staff:
            return AIModelSerializer
        return AIModelLimitedSerializer

from .serializers import ChatSessionSerializer



# session management 

class CustomPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True
        return False
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.user==request.user
class ChatSessionView(viewsets.ModelViewSet):
    queryset=ChatSession.objects.all().prefetch_related('messages')
    serializer_class=ChatSessionSerializer
    permission_classes=[CustomPermission]

    def get_queryset(self):
        user=self.request.user
        queryset = self.queryset

        if not user.is_staff:
            queryset = queryset.filter(user=user)
        
        # Filter by session_type if provided
        session_type = self.request.query_params.get('session_type', None)
        if session_type and session_type != 'all':
            # Map simplified filter types to backend session_type values
            type_mapping = {
                'chat': ['chat'],
                'image': ['text_to_image', 'image_editor', 'image_tool'],
                'video': ['image_to_video', 'text_to_video', 'text_or_image_to_video', 'video_upscaler', 'video_effect'],
                'audio': ['text_to_speech'],
                '3d': ['image_to_3d'],
            }
            
            if session_type in type_mapping:
                queryset = queryset.filter(session_type__in=type_mapping[session_type])
            else:
                # Direct match for specific types
                queryset = queryset.filter(session_type=session_type)
        
        # Filter by search query
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(messages__content__icontains=search)
            ).distinct()
        
        return queryset.order_by('-created_at')
    
    def validate_session_type(self,attrs):
        session_type=attrs.get('session_type',None)
        if not session_type:
            raise ValueError({"error":"Session type required"})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # text = serializer.validated_data.get('text', True)
        # is_text = text if isinstance(text, bool) else bool(text)
        session_type=serializer.validated_data.get('session_type',None)
        print(session_type)
        # model = AIModelInfo.objects.filter(
        #     session_type=session_type,
        #     is_active=True
        # ).order_by('-created_at').first()

        model=serializer.validated_data.get('model',None)
        
        # if not model:
        #     model = AIModelInfo.objects.filter(is_active=True).order_by('-created_at').first()

        if not model:
            return Response({"error": f"No {session_type} active AI models available."}, status=400)
        # Check for previous empty session
        previous_session = ChatSession.objects.filter(user=request.user).order_by('-created_at').first()
        if previous_session and not previous_session.messages.exists():
            # Reuse previous session
            previous_session.model = model 
            previous_session.session_type=session_type
            previous_session.save()
            data = self.get_serializer(previous_session).data
            return Response(data, status=200)

        # Otherwise, create a new session
       
        
        serializer.save(model=model, user=request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)
    # def perform_create(self, serializer):
    #     # model_id = serializer.validated_data.get('model_id', 'gpt-3.5-turbo')
    #     text= serializer.validated_data.get('text', True)
    #     model_id=AIModelInfo.objects.filter(images_generating_models=not text,is_active=True).order_by('created_at').first()
    #     model=AIModelInfo.objects.filter(model_id=model_id).first()
    #     serializer.save(model=model,user=self.request.user)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def extract_document_text(request):
    """
    Extract text from an uploaded document (PDF, DOCX, etc.).
    
    Accepts:
        - file: uploaded file (multipart)
        OR
        - data: base64-encoded document (JSON body)
        - filename: original filename for format detection (JSON body)
    
    Returns:
        {"text": "...", "error": null, "pages": N}
    """
    from .document_extract import extract_text_from_base64, extract_text_from_bytes

    # Handle multipart file upload
    if request.FILES:
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"text": "", "error": "No file provided", "pages": 0}, status=400)
        
        raw_bytes = uploaded_file.read()
        mime_type = uploaded_file.content_type or ""
        filename = uploaded_file.name or ""
        
        result = extract_text_from_bytes(raw_bytes, mime_type, filename)
        return Response(result)

    # Handle base64 string in JSON body
    data_uri = request.data.get('data', '')
    filename = request.data.get('filename', '')
    
    if not data_uri:
        return Response({"text": "", "error": "No document data provided", "pages": 0}, status=400)
    
    result = extract_text_from_base64(data_uri, filename)
    return Response(result)
