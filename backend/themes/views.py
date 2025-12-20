from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from .models import Theme, ThemeSetting
from .serializers import (
    ThemeSerializer, 
    ThemeListSerializer,
    ThemeSettingSerializer,
    ThemeCreateSerializer
)
from .services import OpenRouterService

logger = logging.getLogger(__name__)


class ThemeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Theme CRUD operations
    """
    queryset = Theme.objects.filter(is_active=True).order_by('display_name')
    serializer_class = ThemeSerializer
    lookup_field = 'name'  # Allow lookup by name instead of ID
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve', 'current', 'current_setting']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ThemeListSerializer
        elif self.action == 'create':
            return ThemeCreateSerializer
        return ThemeSerializer

    def list(self, request):
        """List all active themes with lightweight data"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })

    def retrieve(self, request, name=None):
        """Get specific theme by name with full CSS variables"""
        theme = get_object_or_404(Theme, name=name, is_active=True)
        serializer = self.get_serializer(theme)
        return Response(serializer.data)

    def create(self, request):
        """Create new theme (from theme customizer)"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            theme = serializer.save()
            # Return full theme data
            response_serializer = ThemeSerializer(theme)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='available')
    def available(self, request):
        """Check if backend themes are available (lightweight endpoint)"""
        has_themes = ThemeSetting.get_current_theme() is not None
        return Response({'available': has_themes})

    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        """Get the current active theme, or fallback instruction if not configured"""
        current_theme = ThemeSetting.get_current_theme()
        if current_theme:
            serializer = ThemeSerializer(current_theme)
            return Response(serializer.data)
        else:
            # No themes configured - tell frontend to use JSON fallback
            import os
            fallback_theme = os.getenv('VITE_FRONTEND_THEME', 'vercel')
            return Response({
                'fallback': True,
                'theme_name': fallback_theme,
                'message': 'No backend themes configured, use frontend theme JSON'
            })

    @action(detail=False, methods=['get'], url_path='current-setting')
    def current_setting(self, request):
        """Get the current theme setting with both current and fallback themes"""
        setting = ThemeSetting.objects.first()
        if setting:
            serializer = ThemeSettingSerializer(setting)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'No theme setting configured'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='set-current')
    def set_current(self, request):
        """Set the current active theme (admin only)"""
        theme_name = request.data.get('theme_name')
        if not theme_name:
            return Response(
                {'error': 'theme_name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            theme = Theme.objects.get(name=theme_name, is_active=True)
        except Theme.DoesNotExist:
            return Response(
                {'error': 'Theme not found or inactive'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        with transaction.atomic():
            setting, created = ThemeSetting.objects.get_or_create(
                defaults={'current_theme': theme, 'fallback_theme': theme}
            )
            
            if not created:
                setting.current_theme = theme
                setting.updated_by = request.user if request.user.is_authenticated else None
                setting.save()
        
        serializer = ThemeSettingSerializer(setting)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, name=None):
        """Duplicate an existing theme with a new name"""
        original_theme = get_object_or_404(Theme, name=name, is_active=True)
        
        new_name = request.data.get('new_name')
        new_display_name = request.data.get('new_display_name')
        
        if not new_name:
            return Response(
                {'error': 'new_name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Theme.objects.filter(name=new_name).exists():
            return Response(
                {'error': 'Theme with this name already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create duplicated theme
        duplicated_theme = Theme.objects.create(
            name=new_name,
            display_name=new_display_name or f"{original_theme.display_name} (Copy)",
            description=f"Copy of {original_theme.display_name}",
            css_vars=original_theme.css_vars,
            is_system_theme=False,
            is_active=True,
            version='1.0.0',
            created_by=request.user if request.user.is_authenticated else None
        )
        
        serializer = ThemeSerializer(duplicated_theme)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """Generate a new theme using AI"""
        user_prompt = request.data.get('prompt')
        theme_mentions = request.data.get('theme_mentions', [])
        
        print(f"DEBUG: Received request data: {request.data}")
        print(f"DEBUG: User prompt: '{user_prompt}'")
        print(f"DEBUG: Theme mentions: {theme_mentions}")
        logger.info(f"Received request data: {request.data}")
        logger.info(f"User prompt: '{user_prompt}'")
        logger.info(f"Theme mentions: {theme_mentions}")
        
        if not user_prompt:
            return Response(
                {'error': 'prompt is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Resolve theme mentions to actual theme data
            referenced_themes = {}
            
            for mention in theme_mentions:
                if mention == 'current':
                    # Get current theme setting
                    try:
                        current_setting = ThemeSetting.objects.first()
                        print(f"DEBUG: current_setting: {current_setting}")
                        if current_setting and current_setting.current_theme:
                            print(f"DEBUG: current_theme found: {current_setting.current_theme.name}")
                            referenced_themes['current'] = {
                                'name': current_setting.current_theme.name,
                                'display_name': current_setting.current_theme.display_name,
                                'css_vars': current_setting.current_theme.css_vars
                            }
                        else:
                            print(f"DEBUG: No current theme setting found")
                    except Exception as e:
                        print(f"DEBUG: Exception getting current theme: {e}")
                        pass  # No current theme set
                else:
                    # Get specific theme by name
                    try:
                        theme = Theme.objects.get(name=mention, is_active=True)
                        referenced_themes[mention] = {
                            'name': theme.name,
                            'display_name': theme.display_name,
                            'css_vars': theme.css_vars
                        }
                    except Theme.DoesNotExist:
                        pass  # Theme not found, AI will handle this
            
            # Generate theme data using OpenRouter AI
            logger.info(f"Generating theme with prompt: {user_prompt}")
            print(f"DEBUG: Theme mentions from request: {theme_mentions}")
            print(f"DEBUG: Resolved referenced themes: {list(referenced_themes.keys()) if referenced_themes else 'None'}")
            if referenced_themes:
                for theme_name, theme_data in referenced_themes.items():
                    print(f"DEBUG: Theme {theme_name} data keys: {list(theme_data.keys())}")
                    print(f"DEBUG: Theme {theme_name} has css_vars: {'css_vars' in theme_data}")
            else:
                print("DEBUG: NO REFERENCED THEMES RESOLVED!")
            
            logger.info(f"Theme mentions from request: {theme_mentions}")
            logger.info(f"Resolved referenced themes: {list(referenced_themes.keys()) if referenced_themes else 'None'}")
            if referenced_themes:
                for theme_name, theme_data in referenced_themes.items():
                    logger.info(f"Theme {theme_name} data keys: {list(theme_data.keys())}")
            
            service = OpenRouterService()
            theme_data = service.generate_theme(user_prompt, referenced_themes)
            
            # Handle versioning for modified themes
            base_name = theme_data['name']
            final_name = self._generate_unique_theme_name(base_name, referenced_themes)
            
            # Create theme in database (but DON'T automatically apply it)
            with transaction.atomic():
                theme = Theme.objects.create(
                    name=final_name,
                    display_name=theme_data['display_name'],
                    description=theme_data['description'],
                    css_vars=theme_data['css_vars'],
                    is_system_theme=False,
                    is_active=True,
                    version=theme_data.get('version', '1.0.0'),
                    created_by=request.user if request.user.is_authenticated else None
                )
                
                # NOTE: We do NOT automatically set this as the current theme
                # The frontend will show a preview and let the user decide
            
            logger.info(f"Successfully created AI theme: {theme.name}")
            
            # Return the full theme object
            serializer = ThemeSerializer(theme)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Theme generation failed: {str(e)}")
            return Response(
                {'error': f'Theme generation failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_unique_theme_name(self, base_name: str, referenced_themes: dict) -> str:
        """Generate a unique theme name, adding version suffixes if based on existing themes"""
        # If this is a modification of an existing theme, create versioned name
        if referenced_themes:
            # Use the first referenced theme as base for naming
            first_ref = list(referenced_themes.values())[0]
            base_theme_name = first_ref['name']
            
            # Find the highest version number for this base theme
            existing_versions = Theme.objects.filter(
                name__startswith=f"{base_theme_name}-v",
                is_active=True
            ).values_list('name', flat=True)
            
            # Extract version numbers
            version_numbers = []
            for version_name in existing_versions:
                try:
                    version_part = version_name.split(f"{base_theme_name}-v")[1]
                    version_numbers.append(int(version_part))
                except (IndexError, ValueError):
                    pass
            
            # Generate next version number
            next_version = max(version_numbers, default=1) + 1
            return f"{base_theme_name}-v{next_version}"
        
        # For new themes, ensure uniqueness by adding number suffix if needed
        if not Theme.objects.filter(name=base_name, is_active=True).exists():
            return base_name
        
        counter = 2
        while Theme.objects.filter(name=f"{base_name}-{counter}", is_active=True).exists():
            counter += 1
        
        return f"{base_name}-{counter}"


class ThemeSettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ThemeSetting management (singleton)
    """
    queryset = ThemeSetting.objects.all()
    serializer_class = ThemeSettingSerializer
    permission_classes = [IsAuthenticated]  # Admin only
    
    def list(self, request):
        """Get the current theme setting"""
        setting = ThemeSetting.objects.first()
        if setting:
            serializer = self.get_serializer(setting)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'No theme setting configured'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def create(self, request):
        """Create theme setting (only if none exists)"""
        if ThemeSetting.objects.exists():
            return Response(
                {'error': 'Theme setting already exists. Use PUT to update.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            setting = serializer.save(updated_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        """Update theme setting"""
        setting = ThemeSetting.objects.first()
        if not setting:
            return Response(
                {'error': 'No theme setting found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            # Update theme references if provided
            if 'current_theme_id' in request.data:
                setting.current_theme_id = request.data['current_theme_id']
            if 'fallback_theme_id' in request.data:
                setting.fallback_theme_id = request.data['fallback_theme_id']
            
            setting.updated_by = request.user
            setting.save()
            
            # Return updated data
            response_serializer = ThemeSettingSerializer(setting)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
