from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ai", "0002_aiglobaldailyusage"),
    ]

    operations = [
        migrations.AddField(
            model_name="aidailyusage",
            name="completion_tokens_count",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="aidailyusage",
            name="prompt_tokens_count",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="aidailyusage",
            name="total_tokens_count",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="aiglobaldailyusage",
            name="completion_tokens_count",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="aiglobaldailyusage",
            name="prompt_tokens_count",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="aiglobaldailyusage",
            name="total_tokens_count",
            field=models.PositiveBigIntegerField(default=0),
        ),
    ]
