# Generated manually to update site description

from django.db import migrations


def update_site_description(apps, schema_editor):
    SiteSettings = apps.get_model('settings_app', 'SiteSettings')
    
    # Update existing site settings with new description
    settings, created = SiteSettings.objects.get_or_create(
        pk=1,
        defaults={
            'default_article_status': 'draft',
            'site_name': 'Dhivehinoos.net',
            'site_description': 'Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.',
            'allow_comments': True,
            'require_comment_approval': True,
        }
    )
    
    # Update description if settings already exist
    if not created:
        settings.site_description = 'Authentic Maldivian Dhivehi Twitter thoughts and cultural insights for the Maldivian diaspora worldwide. Connect with your roots through curated Dhivehi content.'
        settings.save()


def reverse_update_site_description(apps, schema_editor):
    SiteSettings = apps.get_model('settings_app', 'SiteSettings')
    
    # Revert to old description
    try:
        settings = SiteSettings.objects.get(pk=1)
        settings.site_description = 'AI-generated fictional content for research purposes'
        settings.save()
    except SiteSettings.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('settings_app', '0002_sitesettings_google_analytics_id'),
    ]

    operations = [
        migrations.RunPython(
            update_site_description,
            reverse_update_site_description,
        ),
    ]
