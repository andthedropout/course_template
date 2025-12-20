from django.views.generic import TemplateView
from django.conf import settings
from django.http import JsonResponse
import json
import os
import glob
import uuid
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import mimetypes

class IndexView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["debug"] = settings.DEBUG

        # In production, use hardcoded filenames since Vite is configured without hashes
        # WhiteNoise handles cache busting via STATICFILES_STORAGE with hashed URLs
        if not settings.DEBUG:
            context["main_js"] = "index.js"
            context["main_css"] = "index.css"

        return context 

def list_available_backgrounds(request):
    backgrounds_path = os.path.join(os.path.dirname(settings.BASE_DIR), 'public', 'images', 'backgrounds')
    
    available_backgrounds = []
    
    if os.path.exists(backgrounds_path):
        svg_files = glob.glob(os.path.join(backgrounds_path, '*.svg'))
        for file_path in svg_files:
            filename = os.path.basename(file_path)
            name_without_ext = os.path.splitext(filename)[0]
            
            label = name_without_ext.replace('_', ' ').replace('-', ' ').title()
            
            available_backgrounds.append({
                'value': name_without_ext,
                'label': label
            })
    
    available_backgrounds.sort(key=lambda x: x['label'])
    
    return JsonResponse({
        'animated_backgrounds': available_backgrounds
    })

@method_decorator(csrf_exempt, name='dispatch')  
class ImageUploadView(APIView):
    """Handle image uploads with auto-generated names"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate file size (5MB limit)
        if image_file.size > 5 * 1024 * 1024:  # 5MB in bytes
            return Response({'error': 'File size exceeds 5MB limit'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        content_type = image_file.content_type
        if not content_type or not content_type.startswith('image/'):
            return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique filename
        file_extension = image_file.name.split('.')[-1].lower() if '.' in image_file.name else 'jpg'
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # Ensure uploads directory exists in both locations
        uploads_dir = os.path.join(settings.BASE_DIR.parent, 'public', 'uploads')
        collected_uploads_dir = os.path.join(settings.BASE_DIR.parent, 'public_collected', 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        os.makedirs(collected_uploads_dir, exist_ok=True)
        
        # Save file to both locations for immediate availability
        file_path = os.path.join(uploads_dir, unique_filename)
        collected_file_path = os.path.join(collected_uploads_dir, unique_filename)
        try:
            # Save to source location
            with open(file_path, 'wb+') as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)
            
            # Copy to collected static files for immediate serving
            with open(collected_file_path, 'wb+') as destination:
                image_file.seek(0)  # Reset file pointer
                for chunk in image_file.chunks():
                    destination.write(chunk)
            
            # Return the URL that will be accessible via static files
            file_url = f"/static/uploads/{unique_filename}"
            
            return Response({
                'success': True,
                'url': file_url,
                'filename': unique_filename,
                'size': image_file.size
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Failed to save file: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)