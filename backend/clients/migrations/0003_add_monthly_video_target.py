from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='monthly_video_target',
            field=models.PositiveIntegerField(default=5, help_text='Number of videos to post per month'),
        ),
    ]
