# Generated migration for theme settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('settings_app', '0010_sitesettings_default_pagination_size'),
    ]

    operations = [
        migrations.AddField(
            model_name='sitesettings',
            name='active_theme',
            field=models.CharField(
                choices=[
                    ('modern', 'Modern News'),
                    ('classic', 'Classic Blog'),
                    ('minimal', 'Minimal Clean'),
                    ('newspaper', 'Newspaper Style'),
                    ('magazine', 'Magazine Layout'),
                ],
                default='modern',
                help_text='Active frontend theme/layout',
                max_length=50
            ),
        ),
        migrations.AddField(
            model_name='sitesettings',
            name='theme_config',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Custom theme configuration (colors, fonts, spacing) - stored as JSON'
            ),
        ),
    ]


