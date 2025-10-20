"""
Management command to check and debug reusable images
"""
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
import os
from articles.models import ReusableImage, Article


class Command(BaseCommand):
    help = 'Check and debug reusable images'

    def add_arguments(self, parser):
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Clean up orphaned image files',
        )
        parser.add_argument(
            '--check-articles',
            action='store_true',
            help='Check articles that reference reusable images',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Checking reusable images...'))
        
        # Check database records
        reusable_count = ReusableImage.objects.count()
        self.stdout.write(f'ReusableImage records in database: {reusable_count}')
        
        if reusable_count > 0:
            self.stdout.write('\nSample records:')
            for img in ReusableImage.objects.all()[:5]:
                self.stdout.write(f'- {img.entity_name}: {img.image_file.name}')
        
        # Check media directory
        media_path = 'reusable_images/'
        if default_storage.exists(media_path):
            files = default_storage.listdir(media_path)[1]  # Get files only
            self.stdout.write(f'\nFiles in media/reusable_images/: {len(files)}')
            
            if files:
                self.stdout.write('Sample files:')
                for file in files[:5]:
                    self.stdout.write(f'- {file}')
        else:
            self.stdout.write('\nNo reusable_images directory found')
        
        # Check articles with reusable images
        if options['check_articles']:
            reused_articles = Article.objects.filter(image_source='reused')
            self.stdout.write(f'\nArticles with image_source=reused: {reused_articles.count()}')
            
            for article in reused_articles[:3]:
                self.stdout.write(f'- {article.title}: reused_image={article.reused_image}')
        
        # Cleanup orphaned files
        if options['cleanup']:
            self.stdout.write('\nCleaning up orphaned files...')
            if default_storage.exists(media_path):
                files = default_storage.listdir(media_path)[1]
                orphaned_count = 0
                
                for file in files:
                    file_path = os.path.join(media_path, file)
                    # Check if any ReusableImage references this file
                    if not ReusableImage.objects.filter(image_file=file_path).exists():
                        try:
                            default_storage.delete(file_path)
                            orphaned_count += 1
                            self.stdout.write(f'Deleted orphaned file: {file}')
                        except Exception as e:
                            self.stdout.write(f'Error deleting {file}: {e}')
                
                self.stdout.write(f'Cleaned up {orphaned_count} orphaned files')
        
        self.stdout.write(self.style.SUCCESS('Done!'))
