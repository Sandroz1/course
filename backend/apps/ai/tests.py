from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from .models import AiDailyUsage, AiGlobalDailyUsage
from .usage import (
    AI_DAILY_LIMIT,
    AiDailyLimitExceeded,
    AiGlobalDailyLimitExceeded,
    record_ai_token_usage,
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
        self.assertEqual(AiGlobalDailyUsage.objects.get(date=utc_today()).requests_count, 0)

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

    @override_settings(AI_GLOBAL_DAILY_REQUEST_LIMIT=2)
    def test_reserve_request_raises_when_global_daily_limit_is_reached(self):
        other_user = User.objects.create_user(username="other-ai-user", password="StrongPass123!")

        reserve_ai_request(self.user)
        reserve_ai_request(other_user)

        with self.assertRaises(AiGlobalDailyLimitExceeded) as context:
            reserve_ai_request(self.user)

        self.assertEqual(context.exception.usage.limit, 2)
        self.assertEqual(context.exception.usage.used, 2)
        self.assertEqual(context.exception.usage.remaining, 0)
        self.assertEqual(AiGlobalDailyUsage.objects.get(date=utc_today()).requests_count, 2)

    def test_record_ai_token_usage_updates_user_and_global_counters(self):
        reserve_ai_request(self.user)

        usage = record_ai_token_usage(
            self.user,
            prompt_tokens=3,
            completion_tokens=5,
            total_tokens=8,
        )
        user_usage = AiDailyUsage.objects.get(user=self.user, date=utc_today())
        global_usage = AiGlobalDailyUsage.objects.get(date=utc_today())

        self.assertEqual(usage.total_tokens, 8)
        self.assertEqual(usage.as_dict()["tokens"]["prompt"], 3)
        self.assertEqual(user_usage.prompt_tokens_count, 3)
        self.assertEqual(user_usage.completion_tokens_count, 5)
        self.assertEqual(user_usage.total_tokens_count, 8)
        self.assertEqual(global_usage.prompt_tokens_count, 3)
        self.assertEqual(global_usage.completion_tokens_count, 5)
        self.assertEqual(global_usage.total_tokens_count, 8)
