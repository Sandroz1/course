from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone as django_timezone

from .models import AiDailyUsage, AiGlobalDailyUsage


AI_DAILY_LIMIT = getattr(settings, "AI_DAILY_REQUEST_LIMIT", 15)
AI_GLOBAL_DAILY_LIMIT_DEFAULT = 1000


@dataclass(frozen=True)
class AiUsageSnapshot:
    limit: int
    used: int
    remaining: int
    reset_at: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    def as_dict(self) -> dict:
        return {
            "limit": self.limit,
            "used": self.used,
            "remaining": self.remaining,
            "resetAt": self.reset_at,
            "tokens": {
                "prompt": self.prompt_tokens,
                "completion": self.completion_tokens,
                "total": self.total_tokens,
            },
        }


class AiDailyLimitExceeded(Exception):
    def __init__(self, usage: AiUsageSnapshot):
        self.usage = usage
        super().__init__("AI daily limit exceeded")


class AiGlobalDailyLimitExceeded(Exception):
    def __init__(self, usage: AiUsageSnapshot):
        self.usage = usage
        super().__init__("AI global daily limit exceeded")


def get_ai_global_daily_limit() -> int:
    return max(int(getattr(settings, "AI_GLOBAL_DAILY_REQUEST_LIMIT", AI_GLOBAL_DAILY_LIMIT_DEFAULT)), 0)


def get_ai_daily_limit() -> int:
    return max(int(getattr(settings, "AI_DAILY_REQUEST_LIMIT", AI_DAILY_LIMIT)), 0)


def utc_today():
    return datetime.now(timezone.utc).date()


def reset_at_for(usage_date):
    reset_at = datetime.combine(usage_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
    return reset_at.isoformat().replace("+00:00", "Z")


def build_usage_snapshot(
    requests_count: int,
    usage_date=None,
    limit: int | None = None,
    prompt_tokens_count: int = 0,
    completion_tokens_count: int = 0,
    total_tokens_count: int = 0,
) -> AiUsageSnapshot:
    date = usage_date or utc_today()
    request_limit = get_ai_daily_limit() if limit is None else limit
    used = min(max(requests_count, 0), request_limit)

    return AiUsageSnapshot(
        limit=request_limit,
        used=used,
        remaining=max(request_limit - used, 0),
        reset_at=reset_at_for(date),
        prompt_tokens=max(prompt_tokens_count, 0),
        completion_tokens=max(completion_tokens_count, 0),
        total_tokens=max(total_tokens_count, 0),
    )


def get_ai_usage(user) -> AiUsageSnapshot:
    date = utc_today()
    usage = AiDailyUsage.objects.filter(user=user, date=date).first()
    if not usage:
        return build_usage_snapshot(0, date)

    return build_usage_snapshot(
        usage.requests_count,
        date,
        prompt_tokens_count=usage.prompt_tokens_count,
        completion_tokens_count=usage.completion_tokens_count,
        total_tokens_count=usage.total_tokens_count,
    )


def reserve_ai_request(user) -> AiUsageSnapshot:
    date = utc_today()
    daily_limit = get_ai_daily_limit()
    global_limit = get_ai_global_daily_limit()

    with transaction.atomic():
        global_usage = None
        if global_limit > 0:
            global_usage, _global_created = (
                AiGlobalDailyUsage.objects.select_for_update()
                .get_or_create(date=date, defaults={"requests_count": 0})
            )

            if global_usage.requests_count >= global_limit:
                raise AiGlobalDailyLimitExceeded(
                    build_usage_snapshot(global_usage.requests_count, date, global_limit)
                )

        usage, _created = (
            AiDailyUsage.objects.select_for_update()
            .get_or_create(user=user, date=date, defaults={"requests_count": 0})
        )

        if usage.requests_count >= daily_limit:
            raise AiDailyLimitExceeded(build_usage_snapshot(usage.requests_count, date))

        usage.requests_count = F("requests_count") + 1
        usage.save(update_fields=["requests_count", "updated_at"])

        if global_usage:
            global_usage.requests_count = F("requests_count") + 1
            global_usage.save(update_fields=["requests_count", "updated_at"])

        usage.refresh_from_db(fields=["requests_count"])

        return build_usage_snapshot(usage.requests_count, date)


def release_ai_request(user) -> AiUsageSnapshot:
    date = utc_today()

    released_count = AiDailyUsage.objects.filter(user=user, date=date, requests_count__gt=0).update(
        requests_count=F("requests_count") - 1,
        updated_at=django_timezone.now(),
    )

    if released_count:
        AiGlobalDailyUsage.objects.filter(date=date, requests_count__gt=0).update(
            requests_count=F("requests_count") - 1,
            updated_at=django_timezone.now(),
        )

    return get_ai_usage(user)


def record_ai_token_usage(
    user,
    *,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    total_tokens: int = 0,
) -> AiUsageSnapshot:
    prompt_tokens = max(int(prompt_tokens or 0), 0)
    completion_tokens = max(int(completion_tokens or 0), 0)
    total_tokens = max(int(total_tokens or 0), prompt_tokens + completion_tokens)

    if not any([prompt_tokens, completion_tokens, total_tokens]):
        return get_ai_usage(user)

    date = utc_today()

    with transaction.atomic():
        usage, _created = (
            AiDailyUsage.objects.select_for_update()
            .get_or_create(user=user, date=date, defaults={"requests_count": 0})
        )
        global_usage, _global_created = (
            AiGlobalDailyUsage.objects.select_for_update()
            .get_or_create(date=date, defaults={"requests_count": 0})
        )

        for item in (usage, global_usage):
            item.prompt_tokens_count = F("prompt_tokens_count") + prompt_tokens
            item.completion_tokens_count = F("completion_tokens_count") + completion_tokens
            item.total_tokens_count = F("total_tokens_count") + total_tokens
            item.save(
                update_fields=[
                    "prompt_tokens_count",
                    "completion_tokens_count",
                    "total_tokens_count",
                    "updated_at",
                ]
            )

        usage.refresh_from_db(
            fields=[
                "requests_count",
                "prompt_tokens_count",
                "completion_tokens_count",
                "total_tokens_count",
            ]
        )

    return build_usage_snapshot(
        usage.requests_count,
        date,
        prompt_tokens_count=usage.prompt_tokens_count,
        completion_tokens_count=usage.completion_tokens_count,
        total_tokens_count=usage.total_tokens_count,
    )
