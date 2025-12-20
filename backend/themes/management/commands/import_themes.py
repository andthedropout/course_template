import json
import os
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from themes.models import Theme, ThemeSetting


class Command(BaseCommand):
    help = 'Import theme JSON files from design-system/themes/ into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Overwrite existing themes with same name',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without actually importing',
        )
        parser.add_argument(
            '--theme',
            type=str,
            help='Import only a specific theme by name (without .json extension)',
        )

    def handle(self, *args, **options):
        # Path to themes directory
        base_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
        themes_dir = base_dir / 'design-system' / 'themes'
        
        if not themes_dir.exists():
            raise CommandError(f'Themes directory not found: {themes_dir}')

        # Get all JSON files or specific theme
        if options['theme']:
            json_files = [themes_dir / f"{options['theme']}.json"]
            if not json_files[0].exists():
                raise CommandError(f'Theme file not found: {json_files[0]}')
        else:
            json_files = list(themes_dir.glob('*.json'))

        if not json_files:
            raise CommandError('No theme JSON files found')

        self.stdout.write(f'Found {len(json_files)} theme file(s) to process')

        imported_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        with transaction.atomic():
            for json_file in json_files:
                try:
                    result = self.import_theme_file(json_file, options)
                    if result == 'imported':
                        imported_count += 1
                    elif result == 'updated':
                        updated_count += 1
                    elif result == 'skipped':
                        skipped_count += 1
                except Exception as e:
                    error_msg = f'{json_file.name}: {str(e)}'
                    errors.append(error_msg)
                    self.stdout.write(
                        self.style.ERROR(f'Error importing {json_file.name}: {e}')
                    )

            if options['dry_run']:
                # Rollback transaction for dry run
                transaction.set_rollback(True)
                self.stdout.write(
                    self.style.WARNING('DRY RUN - No changes were made to the database')
                )

        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'Import Summary:'))
        self.stdout.write(f'  Imported: {imported_count}')
        self.stdout.write(f'  Updated: {updated_count}')
        self.stdout.write(f'  Skipped: {skipped_count}')
        self.stdout.write(f'  Errors: {len(errors)}')

        if errors:
            self.stdout.write('\nErrors:')
            for error in errors:
                self.stdout.write(f'  {error}')

        # Create default theme setting if none exists
        if not options['dry_run'] and (imported_count > 0 or updated_count > 0):
            self.create_default_theme_setting()

    def import_theme_file(self, json_file, options):
        """Import a single theme JSON file"""
        self.stdout.write(f'Processing {json_file.name}...')

        # Load and parse JSON
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                theme_data = json.load(f)
        except json.JSONDecodeError as e:
            raise CommandError(f'Invalid JSON in {json_file.name}: {e}')

        # Validate required fields and handle variations
        if 'name' not in theme_data and 'theme_name' not in theme_data:
            raise CommandError(f'Missing required field "name" or "theme_name" in {json_file.name}')
        
        if 'display_name' not in theme_data:
            raise CommandError(f'Missing required field "display_name" in {json_file.name}')
            
        if 'cssVars' not in theme_data:
            raise CommandError(f'Missing required field "cssVars" in {json_file.name}')

        # Get theme name (handle both 'name' and 'theme_name' variations)
        theme_name = theme_data.get('name') or theme_data.get('theme_name')
        existing_theme = Theme.objects.filter(name=theme_name).first()

        if existing_theme:
            if not options['overwrite']:
                self.stdout.write(
                    self.style.WARNING(f'  Theme "{theme_name}" already exists, skipping')
                )
                return 'skipped'
            else:
                if options['dry_run']:
                    self.stdout.write(
                        self.style.SUCCESS(f'  Would update existing theme "{theme_name}"')
                    )
                    return 'updated'
                
                # Update existing theme
                existing_theme.display_name = theme_data['display_name']
                existing_theme.description = theme_data.get('description', '')
                existing_theme.css_vars = theme_data['cssVars']
                existing_theme.is_system_theme = True
                existing_theme.is_active = True
                existing_theme.save()
                
                self.stdout.write(
                    self.style.SUCCESS(f'  Updated theme "{theme_name}"')
                )
                return 'updated'
        else:
            if options['dry_run']:
                self.stdout.write(
                    self.style.SUCCESS(f'  Would import new theme "{theme_name}"')
                )
                return 'imported'
            
            # Create new theme
            theme = Theme(
                name=theme_name,
                display_name=theme_data['display_name'],
                description=theme_data.get('description', ''),
                css_vars=theme_data['cssVars'],
                is_system_theme=True,
                is_active=True,
                version='1.0.0'
            )
            
            # Validate the theme
            theme.full_clean()
            theme.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'  Imported theme "{theme_name}"')
            )
            return 'imported'

    def create_default_theme_setting(self):
        """Create default theme setting if none exists"""
        if ThemeSetting.objects.exists():
            return

        # Find a good default theme (prefer modern-minimal, fallback to first available)
        default_theme = (
            Theme.objects.filter(name='modern-minimal', is_active=True).first() or
            Theme.objects.filter(is_active=True).first()
        )
        
        if default_theme:
            # Use the same theme for both current and fallback
            # (user can change this later in admin)
            ThemeSetting.objects.create(
                current_theme=default_theme,
                fallback_theme=default_theme
            )
            self.stdout.write(
                self.style.SUCCESS(f'Created default theme setting with "{default_theme.display_name}"')
            ) 