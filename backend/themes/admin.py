from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.utils.safestring import mark_safe
from django.contrib import messages
from django.http import HttpResponseRedirect
from .models import Theme, ThemeSetting
import json
import os
from pathlib import Path


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = [
        'display_name',
        'name',
        'is_system_theme',
        'is_active',
        'version',
        'created_at',
        'preview_colors'
    ]
    list_filter = [
        'is_system_theme',
        'is_active',
        'created_at',
        'version'
    ]
    search_fields = [
        'name',
        'display_name',
        'description'
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'preview_colors',
        'css_vars_preview'
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'display_name', 'description', 'version')
        }),
        ('Theme Data', {
            'fields': ('css_vars', 'css_vars_preview'),
            'classes': ('collapse',),
        }),
        ('Settings', {
            'fields': ('is_system_theme', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    actions = ['make_active', 'make_inactive', 'duplicate_theme']

    def preview_colors(self, obj):
        """Display a preview of the theme's main colors"""
        if not obj.css_vars or 'light' not in obj.css_vars:
            return "No preview available"

        light_vars = obj.css_vars['light']
        colors = []

        # Get main colors for preview
        color_vars = ['background', 'primary', 'secondary', 'accent']
        for var in color_vars:
            if var in light_vars:
                color_value = light_vars[var]
                # Convert oklch to approximate hex for display
                colors.append(f'<div style="display:inline-block; width:20px; height:20px; background:{color_value}; border:1px solid #ddd; margin-right:5px; border-radius:3px;" title="{var}: {color_value}"></div>')

        return mark_safe(''.join(colors)) if colors else "No colors found"

    preview_colors.short_description = "Color Preview"

    def css_vars_preview(self, obj):
        """Display a formatted preview of CSS variables"""
        if not obj.css_vars:
            return "No CSS variables"

        # Show basic structure info
        sections = list(obj.css_vars.keys())
        light_vars = len(obj.css_vars.get('light', {}))
        dark_vars = len(obj.css_vars.get('dark', {}))
        theme_vars = len(obj.css_vars.get('theme', {}))

        preview = f"""
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            <strong>Sections:</strong> {', '.join(sections)}<br>
            <strong>Light mode variables:</strong> {light_vars}<br>
            <strong>Dark mode variables:</strong> {dark_vars}<br>
            <strong>Theme variables:</strong> {theme_vars}
        </div>
        """
        return mark_safe(preview)

    css_vars_preview.short_description = "CSS Variables Summary"

    def save_model(self, request, obj, form, change):
        """Set created_by when creating new theme"""
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def make_active(self, request, queryset):
        """Action to activate selected themes"""
        count = queryset.update(is_active=True)
        self.message_user(request, f"{count} theme(s) marked as active.")
    make_active.short_description = "Mark selected themes as active"

    def make_inactive(self, request, queryset):
        """Action to deactivate selected themes"""
        count = queryset.update(is_active=False)
        self.message_user(request, f"{count} theme(s) marked as inactive.")
    make_inactive.short_description = "Mark selected themes as inactive"

    def duplicate_theme(self, request, queryset):
        """Action to duplicate selected themes"""
        duplicated = 0
        for theme in queryset:
            # Create a copy with modified name
            theme.pk = None  # This will create a new instance
            theme.name = f"{theme.name}-copy"
            theme.display_name = f"{theme.display_name} (Copy)"
            theme.is_system_theme = False
            theme.created_by = request.user
            theme.save()
            duplicated += 1

        self.message_user(request, f"{duplicated} theme(s) duplicated.")
    duplicate_theme.short_description = "Duplicate selected themes"

    def get_urls(self):
        """Add custom URL for importing themes"""
        urls = super().get_urls()
        custom_urls = [
            path('import-themes/', self.admin_site.admin_view(self.import_themes_view), name='themes_theme_import'),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        """Add import button to the changelist view"""
        extra_context = extra_context or {}
        extra_context['import_themes_url'] = reverse('admin:themes_theme_import')
        return super().changelist_view(request, extra_context)

    def import_themes_view(self, request):
        """Custom view to import themes from design-system directory"""
        try:
            # Path to design-system themes directory
            themes_dir = Path(__file__).parent.parent.parent / 'design-system' / 'themes'

            if not themes_dir.exists():
                messages.error(request, f"Themes directory not found: {themes_dir}")
                return HttpResponseRedirect(reverse('admin:themes_theme_changelist'))

            imported_count = 0
            updated_count = 0

            # Loop through all JSON files in themes directory
            for json_file in themes_dir.glob('*.json'):
                try:
                    with open(json_file, 'r') as f:
                        theme_data = json.load(f)

                    # Extract theme name from filename (remove .json)
                    theme_name = json_file.stem

                    # Convert cssVars to css_vars for consistency
                    css_vars = theme_data.get('cssVars', theme_data.get('css_vars', {}))

                    # Check if theme already exists
                    theme, created = Theme.objects.get_or_create(
                        name=theme_name,
                        defaults={
                            'display_name': theme_data.get('display_name', theme_data.get('name', theme_name.replace('-', ' ').title())),
                            'description': theme_data.get('description', f'Imported theme: {theme_name}'),
                            'css_vars': css_vars,
                            'is_system_theme': True,
                            'is_active': True,
                            'version': theme_data.get('version', '1.0.0'),
                            'created_by': request.user
                        }
                    )

                    if created:
                        imported_count += 1
                    else:
                        # Update existing theme with new data
                        theme.css_vars = css_vars
                        theme.display_name = theme_data.get('display_name', theme_data.get('name', theme_name.replace('-', ' ').title()))
                        theme.description = theme_data.get('description', f'Updated theme: {theme_name}')
                        theme.version = theme_data.get('version', '1.0.0')
                        theme.save()
                        updated_count += 1

                except (json.JSONDecodeError, KeyError) as e:
                    messages.warning(request, f"Failed to import {json_file.name}: {str(e)}")
                    continue

            if imported_count > 0:
                messages.success(request, f"Successfully imported {imported_count} new theme(s)")
            if updated_count > 0:
                messages.success(request, f"Successfully updated {updated_count} existing theme(s)")
            if imported_count == 0 and updated_count == 0:
                messages.info(request, "No themes were imported or updated")

        except Exception as e:
            messages.error(request, f"Error importing themes: {str(e)}")

        return HttpResponseRedirect(reverse('admin:themes_theme_changelist'))


@admin.register(ThemeSetting)
class ThemeSettingAdmin(admin.ModelAdmin):
    list_display = [
        'current_theme', 
        'fallback_theme', 
        'updated_at', 
        'updated_by'
    ]
    readonly_fields = [
        'updated_at', 
        'updated_by'
    ]
    
    fieldsets = (
        ('Theme Selection', {
            'fields': ('current_theme', 'fallback_theme'),
            'description': 'Select the active theme and fallback theme for the site.'
        }),
        ('Metadata', {
            'fields': ('updated_by', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_form(self, request, obj=None, **kwargs):
        """Customize the form to only show active themes"""
        form = super().get_form(request, obj, **kwargs)
        
        # Filter to only show active themes
        active_themes = Theme.objects.filter(is_active=True)
        form.base_fields['current_theme'].queryset = active_themes
        form.base_fields['fallback_theme'].queryset = active_themes
        
        return form

    def save_model(self, request, obj, form, change):
        """Set updated_by when saving theme setting"""
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        """Only allow one ThemeSetting instance"""
        return not ThemeSetting.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of theme settings"""
        return False
