# Generated manually for performance optimization
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('articles', '0015_article_source_fragments'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['status', '-created_at'], name='article_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['slug'], name='article_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['category', 'status'], name='article_category_status_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['status', 'created_at'], name='article_status_created_at_idx'),
        ),
    ]


