# MongoDB doesn't support RemoveIndex - skip this migration
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0003_add_monthly_video_target'),
    ]

    operations = []
