from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Check and create media directories if they do not exist'

    def handle(self, *args, **options):
        """Check and create media directories"""
        
        # Define required media directories
        media_dirs = [
            'media',
            'media/articles',
            'media/ads', 
            'media/reusable_images',
            'static',
            'database',
            'logs'
        ]
        
        self.stdout.write("Checking media directories...")
        
        for dir_path in media_dirs:
            full_path = os.path.join(settings.BASE_DIR, dir_path)
            
            if os.path.exists(full_path):
                self.stdout.write(
                    self.style.SUCCESS(f"✓ {dir_path} exists")
                )
                
                # Check if it's writable
                if os.access(full_path, os.W_OK):
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ {dir_path} is writable")
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠ {dir_path} is not writable")
                    )
            else:
                self.stdout.write(
                    self.style.WARNING(f"✗ {dir_path} does not exist")
                )
                
                # Try to create it
                try:
                    os.makedirs(full_path, exist_ok=True)
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Created {dir_path}")
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"  ✗ Failed to create {dir_path}: {e}")
                    )
        
        # Check specific reusable images directory
        reusable_images_path = os.path.join(settings.MEDIA_ROOT, 'reusable_images')
        if os.path.exists(reusable_images_path):
            files = os.listdir(reusable_images_path)
            self.stdout.write(
                self.style.SUCCESS(f"✓ Reusable images directory has {len(files)} files")
            )
            
            # List first few files
            for i, file in enumerate(files[:5]):
                self.stdout.write(f"  - {file}")
            if len(files) > 5:
                self.stdout.write(f"  ... and {len(files) - 5} more files")
        else:
            self.stdout.write(
                self.style.ERROR("✗ Reusable images directory does not exist")
            )
        
        self.stdout.write(
            self.style.SUCCESS("Media directory check completed")
        )
