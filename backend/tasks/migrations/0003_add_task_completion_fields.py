from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='drive_link',
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name='task',
            name='completion_notes',
            field=models.TextField(blank=True),
        ),
    ]
