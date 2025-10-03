from django.core.management.base import BaseCommand
import os
import stat
from django.conf import settings


class Command(BaseCommand):
    help = 'Create media directories with proper permissions'

    def handle(self, *args, **options):
        media_root = settings.MEDIA_ROOT
        articles_dir = os.path.join(media_root, 'articles')
        ads_dir = os.path.join(media_root, 'ads')
        
        # Create directories
        os.makedirs(articles_dir, exist_ok=True)
        os.makedirs(ads_dir, exist_ok=True)
        
        # Try to set permissions (777 for full access)
        try:
            os.chmod(articles_dir, 0o777)
            os.chmod(ads_dir, 0o777)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created and set permissions for media directories: {articles_dir}, {ads_dir}'
                )
            )
        except PermissionError:
            # If we can't change permissions, at least ensure directories exist
            self.stdout.write(
                self.style.WARNING(
                    f'Created media directories but could not set permissions: {articles_dir}, {ads_dir}'
                )
            )
            # Try to make them writable by changing ownership if possible
            try:
                import pwd
                django_user = pwd.getpwnam('django')
                os.chown(articles_dir, django_user.pw_uid, django_user.pw_gid)
                os.chown(ads_dir, django_user.pw_uid, django_user.pw_gid)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully changed ownership of media directories to django user'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Could not change ownership: {e}'
                    )
                )
