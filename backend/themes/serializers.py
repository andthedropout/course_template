from rest_framework import serializers
from .models import Theme, ThemeSetting


class ThemeSerializer(serializers.ModelSerializer):
    """Serializer for Theme model with all frontend-needed fields"""
    
    class Meta:
        model = Theme
        fields = [
            'id',
            'name', 
            'display_name',
            'description',
            'css_vars',
            'is_system_theme',
            'is_active',
            'version',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_system_theme']

    def validate_css_vars(self, value):
        """Validate CSS variables structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("css_vars must be a JSON object")
        
        # Check for required sections
        required_sections = ['theme', 'light', 'dark']
        for section in required_sections:
            if section not in value:
                raise serializers.ValidationError(f"css_vars must contain '{section}' section")
        
        # Validate required color variables in light/dark modes
        color_vars = ['background', 'foreground', 'primary', 'secondary']
        for mode in ['light', 'dark']:
            mode_vars = value.get(mode, {})
            missing_vars = [var for var in color_vars if var not in mode_vars]
            if missing_vars:
                raise serializers.ValidationError(
                    f"'{mode}' mode missing required variables: {', '.join(missing_vars)}"
                )
        
        return value


class ThemeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for theme lists (without full css_vars)"""
    
    class Meta:
        model = Theme
        fields = [
            'id',
            'name',
            'display_name', 
            'description',
            'is_system_theme',
            'version'
        ]


class ThemeSettingSerializer(serializers.ModelSerializer):
    """Serializer for ThemeSetting with nested theme data"""
    
    current_theme = ThemeSerializer(read_only=True)
    fallback_theme = ThemeSerializer(read_only=True)
    current_theme_id = serializers.IntegerField(write_only=True, required=False)
    fallback_theme_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = ThemeSetting
        fields = [
            'id',
            'current_theme',
            'fallback_theme', 
            'current_theme_id',
            'fallback_theme_id',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']

    def validate_current_theme_id(self, value):
        """Validate current theme exists and is active"""
        if value:
            try:
                theme = Theme.objects.get(id=value, is_active=True)
            except Theme.DoesNotExist:
                raise serializers.ValidationError("Current theme must exist and be active")
        return value

    def validate_fallback_theme_id(self, value):
        """Validate fallback theme exists and is active"""
        if value:
            try:
                theme = Theme.objects.get(id=value, is_active=True)
            except Theme.DoesNotExist:
                raise serializers.ValidationError("Fallback theme must exist and be active")
        return value

    def validate(self, data):
        """Validate theme setting constraints"""
        current_theme_id = data.get('current_theme_id')
        fallback_theme_id = data.get('fallback_theme_id')
        
        # If both provided, ensure they're different
        if current_theme_id and fallback_theme_id:
            if current_theme_id == fallback_theme_id:
                raise serializers.ValidationError("Current and fallback themes must be different")
        
        return data


class ThemeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new themes from theme customizer"""
    
    class Meta:
        model = Theme
        fields = [
            'name',
            'display_name',
            'description', 
            'css_vars',
            'version'
        ]
    
    def validate_name(self, value):
        """Validate theme name is unique and follows naming rules"""
        if Theme.objects.filter(name=value).exists():
            raise serializers.ValidationError("Theme with this name already exists")
        return value

    def create(self, validated_data):
        """Create new theme with user-created flag"""
        validated_data['is_system_theme'] = False
        validated_data['is_active'] = True
        
        # Set created_by if user available in context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
            
        return super().create(validated_data) 