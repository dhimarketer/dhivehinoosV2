# Generated manually to add is_archived field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contact', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactmessage',
            name='is_archived',
            field=models.BooleanField(default=False),
        ),
    ]
