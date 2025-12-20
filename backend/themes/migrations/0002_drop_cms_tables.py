# Generated manually to drop CMS tables after removing pages, sections, and settings apps

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('themes', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                DROP TABLE IF EXISTS pages_page CASCADE;
                DROP TABLE IF EXISTS sections_section CASCADE;
                DROP TABLE IF EXISTS settings_setting CASCADE;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
