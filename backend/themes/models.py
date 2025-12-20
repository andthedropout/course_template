from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
import json


class Theme(models.Model):
    """
    Model to store theme data (CSS variables, fonts, etc.)
    Replaces the current JSON file-based theme system
    """
    # Identity & Metadata
    name = models.CharField(
        max_length=100, 
        unique=True, 
        db_index=True,
        validators=[
            RegexValidator(
                regex=r'^[a-z0-9-]+$',
                message='Theme name must contain only lowercase letters, numbers, and hyphens.'
            )
        ],
        help_text="Unique theme identifier (e.g., 'modern-minimal')"
    )
    display_name = models.CharField(
        max_length=200,
        help_text="Human-readable theme name (e.g., 'Modern Minimal')"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of the theme's style and purpose"
    )
    
    # Theme Data - stores the complete cssVars structure
    css_vars = models.JSONField(
        help_text="Complete CSS variables structure including theme, light, and dark modes"
    )
    
    # Classification & Status
    is_system_theme = models.BooleanField(
        default=False,
        help_text="True for themes imported from JSON files, False for user-created themes"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this theme is available for selection"
    )
    
    # Metadata
    version = models.CharField(
        max_length=20, 
        default='1.0.0',
        help_text="Theme version for tracking updates"
    )
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        help_text="User who created this theme (if applicable)"
    )
    
    # Future enhancement - commented out until Pillow is installed
    # preview_image = models.ImageField(
    #     upload_to='theme_previews/', 
    #     null=True, 
    #     blank=True,
    #     help_text="Preview image showing theme appearance"
    # )

    class Meta:
        verbose_name = "Theme"
        verbose_name_plural = "Themes"
        ordering = ['display_name']

    def __str__(self):
        return self.display_name

    def clean(self):
        """Validate the css_vars structure"""
        super().clean()
        
        if not isinstance(self.css_vars, dict):
            raise ValidationError("css_vars must be a valid JSON object")
        
        # Check for required top-level keys
        required_keys = ['theme', 'light', 'dark']
        for key in required_keys:
            if key not in self.css_vars:
                raise ValidationError(f"css_vars must contain '{key}' section")
        
        # Validate that light and dark sections have color variables
        color_vars = ['background', 'foreground', 'primary', 'secondary']
        for mode in ['light', 'dark']:
            mode_vars = self.css_vars.get(mode, {})
            missing_vars = [var for var in color_vars if var not in mode_vars]
            if missing_vars:
                raise ValidationError(
                    f"'{mode}' mode missing required variables: {', '.join(missing_vars)}"
                )

    def get_css_var(self, variable_name, mode='light'):
        """Helper method to get a specific CSS variable"""
        return self.css_vars.get(mode, {}).get(variable_name)
    
    def get_font_family(self, font_type='sans'):
        """Helper method to get font family from theme or fallback to mode"""
        font_key = f'font-{font_type}'
        
        # Try theme section first
        theme_font = self.css_vars.get('theme', {}).get(font_key)
        if theme_font:
            return theme_font
            
        # Fallback to light mode
        return self.css_vars.get('light', {}).get(font_key)


class ThemeSetting(models.Model):
    """
    Singleton model to store the current active theme setting
    Only one instance should exist at any time
    """
    current_theme = models.ForeignKey(
        Theme, 
        on_delete=models.PROTECT,
        related_name='active_for_settings',
        help_text="The currently active theme for the site"
    )
    fallback_theme = models.ForeignKey(
        Theme, 
        on_delete=models.PROTECT,
        related_name='fallback_for_settings',
        help_text="Fallback theme if current theme becomes unavailable"
    )
    
    # Tracking
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        help_text="User who last updated the theme setting"
    )

    class Meta:
        verbose_name = "Theme Setting"
        verbose_name_plural = "Theme Settings"

    def __str__(self):
        return f"Active: {self.current_theme.display_name}"

    def clean(self):
        """Validate theme setting constraints"""
        super().clean()
        
        # Ensure both themes are active
        if self.current_theme and not self.current_theme.is_active:
            raise ValidationError("Current theme must be active")
        
        if self.fallback_theme and not self.fallback_theme.is_active:
            raise ValidationError("Fallback theme must be active")
        
        # Ensure current and fallback are different
        if self.current_theme and self.fallback_theme:
            if self.current_theme.id == self.fallback_theme.id:
                raise ValidationError("Current and fallback themes must be different")

    def save(self, *args, **kwargs):
        """Enforce singleton pattern"""
        if not self.pk and ThemeSetting.objects.exists():
            raise ValidationError('Only one ThemeSetting instance is allowed')
        super().save(*args, **kwargs)

    @classmethod
    def get_current_theme(cls):
        """Get the current active theme, creating default if none exists"""
        try:
            setting = cls.objects.first()
            if setting:
                return setting.current_theme
        except cls.DoesNotExist:
            pass
        
        # Return first available theme as fallback
        return Theme.objects.filter(is_active=True).first()

    @classmethod
    def get_fallback_theme(cls):
        """Get the fallback theme"""
        try:
            setting = cls.objects.first()
            if setting:
                return setting.fallback_theme
        except cls.DoesNotExist:
            pass
        
        # Return first available theme as fallback
        return Theme.objects.filter(is_active=True).first()
