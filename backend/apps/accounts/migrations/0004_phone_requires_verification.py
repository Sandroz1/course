from django.db import migrations, models


def clear_unverified_phones(apps, _schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(is_phone_verified=False).exclude(phone__isnull=True).update(phone=None)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_user_auth_token_version"),
    ]

    operations = [
        migrations.RunPython(clear_unverified_phones, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.CheckConstraint(
                condition=models.Q(phone__isnull=True) | models.Q(is_phone_verified=True),
                name="phone_requires_verification",
            ),
        ),
    ]
