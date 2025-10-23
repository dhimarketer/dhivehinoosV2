from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from articles.models import ReusableImage
import os
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Clean up corrupted image files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--remove',
            action='store_true',
            help='Actually remove corrupted images (use with caution)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        remove = options['remove']
        
        if not dry_run and not remove:
            self.stdout.write(
                self.style.WARNING(
                    'Please specify --dry-run to see what would be deleted, '
                    'or --remove to actually delete corrupted images.'
                )
            )
            return

        corrupted_images = []
        
        # Check all reusable images
        for reusable_image in ReusableImage.objects.all():
            if reusable_image.image_file and reusable_image.image_file.name:
                try:
                    # Check if file exists
                    if not reusable_image.image_file.storage.exists(reusable_image.image_file.name):
                        corrupted_images.append({
                            'type': 'missing',
                            'image': reusable_image,
                            'path': reusable_image.image_file.name
                        })
                        continue
                    
                    # Try to open and verify the image
                    file_path = reusable_image.image_file.path
                    with Image.open(file_path) as img:
                        img.verify()  # This will raise an exception if corrupted
                        
                except Exception as e:
                    corrupted_images.append({
                        'type': 'corrupted',
                        'image': reusable_image,
                        'path': reusable_image.image_file.name,
                        'error': str(e)
                    })

        if not corrupted_images:
            self.stdout.write(
                self.style.SUCCESS('No corrupted images found!')
            )
            return

        self.stdout.write(
            self.style.WARNING(f'Found {len(corrupted_images)} corrupted/missing images:')
        )
        
        for item in corrupted_images:
            image = item['image']
            path = item['path']
            error_type = item['type']
            
            if error_type == 'missing':
                self.stdout.write(f'  ❌ Missing: {path} (ID: {image.id}, Entity: {image.entity_name})')
            else:
                error_msg = item.get('error', 'Unknown error')
                self.stdout.write(f'  ⚠️  Corrupted: {path} (ID: {image.id}, Entity: {image.entity_name}) - {error_msg}')

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nDry run complete. Found {len(corrupted_images)} corrupted/missing images.'
                )
            )
            return

        if remove:
            self.stdout.write(
                self.style.WARNING('\nRemoving corrupted images...')
            )
            
            removed_count = 0
            for item in corrupted_images:
                image = item['image']
                path = item['path']
                
                try:
                    # Remove from database
                    image.delete()
                    removed_count += 1
                    self.stdout.write(f'  ✅ Removed: {path}')
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'  ❌ Failed to remove {path}: {e}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'\nRemoved {removed_count} corrupted images.')
            )
