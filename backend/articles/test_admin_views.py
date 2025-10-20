from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.conf import settings
import os

from .models import Article, Category, ReusableImage


class AdminArticleChangeViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_superuser(
            username='admin', email='admin@example.com', password='adminpass'
        )
        assert self.client.login(username='admin', password='adminpass')

        self.category = Category.objects.create(
            name='News', slug='news'
        )

        # Ensure media directories exist
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'articles'), exist_ok=True)
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'reusable_images'), exist_ok=True)

    def get_change_url(self, obj):
        return reverse('admin:articles_article_change', args=[obj.pk])

    def test_change_view_with_missing_external_media_path(self):
        # Article.image points to a media path that does not exist on disk
        article = Article.objects.create(
            title='A1', slug='a1', content='x', category=self.category,
            image='/media/reusable_images/does_not_exist.jpg', status='draft'
        )
        resp = self.client.get(self.get_change_url(article))
        self.assertEqual(resp.status_code, 200)

    def test_change_view_with_missing_image_file_field(self):
        # Article.image_file references a file that is missing on disk
        # Create DB object with a name, but don't create the file
        article = Article.objects.create(
            title='A2', slug='a2', content='x', category=self.category, status='draft'
        )
        # Assign a non-existent file path
        article.image_file.name = 'articles/missing_on_disk.jpg'
        article.save(update_fields=['image_file'])
        resp = self.client.get(self.get_change_url(article))
        self.assertEqual(resp.status_code, 200)

    def test_change_view_with_corrupt_image_file(self):
        # Create a corrupt file on disk and point image_file to it
        corrupt_path = os.path.join(settings.MEDIA_ROOT, 'articles', 'corrupt.jpg')
        with open(corrupt_path, 'wb') as f:
            f.write(b'not a real image')

        article = Article.objects.create(
            title='A3', slug='a3', content='x', category=self.category, status='draft'
        )
        article.image_file.name = 'articles/corrupt.jpg'
        article.save(update_fields=['image_file'])

        resp = self.client.get(self.get_change_url(article))
        self.assertEqual(resp.status_code, 200)

    def test_change_view_with_reused_image_missing_on_disk(self):
        # ReusableImage with a file name that doesn't exist
        ri = ReusableImage.objects.create(
            entity_name='Person X', entity_type='other', image_file='reusable_images/missing_ri.jpg',
            slug='person-x', display_name='Person X', is_active=True
        )
        article = Article.objects.create(
            title='A4', slug='a4', content='x', category=self.category, status='draft',
            reused_image=ri
        )
        resp = self.client.get(self.get_change_url(article))
        self.assertEqual(resp.status_code, 200)


