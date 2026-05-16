from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import AiDailyUsage
from .usage import (
    AI_DAILY_LIMIT,
    AiDailyLimitExceeded,
    release_ai_request,
    reserve_ai_request,
    utc_today,
)


User = get_user_model()


class AiUsageCounterTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ai-user", password="StrongPass123!")

    def test_reserve_and_release_request_restores_usage(self):
        reserved_usage = reserve_ai_request(self.user)

        self.assertEqual(reserved_usage.used, 1)
        self.assertEqual(reserved_usage.remaining, AI_DAILY_LIMIT - 1)

        released_usage = release_ai_request(self.user)

        self.assertEqual(released_usage.used, 0)
        self.assertEqual(released_usage.remaining, AI_DAILY_LIMIT)
        self.assertEqual(
            AiDailyUsage.objects.get(user=self.user, date=utc_today()).requests_count,
            0,
        )

    def test_release_request_does_not_create_negative_usage(self):
        usage = release_ai_request(self.user)

        self.assertEqual(usage.used, 0)
        self.assertEqual(usage.remaining, AI_DAILY_LIMIT)
        self.assertFalse(AiDailyUsage.objects.filter(user=self.user, date=utc_today()).exists())

    def test_reserve_request_raises_when_daily_limit_is_reached(self):
        for _index in range(AI_DAILY_LIMIT):
            reserve_ai_request(self.user)

        with self.assertRaises(AiDailyLimitExceeded) as context:
            reserve_ai_request(self.user)

        self.assertEqual(context.exception.usage.used, AI_DAILY_LIMIT)
        self.assertEqual(context.exception.usage.remaining, 0)
