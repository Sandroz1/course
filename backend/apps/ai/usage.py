from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone as django_timezone

from .models import AiDailyUsage


AI_DAILY_LIMIT = getattr(settings, "AI_DAILY_REQUEST_LIMIT", 15)


@dataclass(frozen=True)
class AiUsageSnapshot:
    limit: int
    used: int
    remaining: int
    reset_at: str

    def as_dict(self) -> dict:
        return {
            "limit": self.limit,
            "used": self.used,
            "remaining": self.remaining,
            "resetAt": self.reset_at,
        }


class AiDailyLimitExceeded(Exception):
    def __init__(self, usage: AiUsageSnapshot):
        self.usage = usage
        super().__init__("AI daily limit exceeded")


def utc_today():
    return datetime.now(timezone.utc).date()


def reset_at_for(usage_date):
    reset_at = datetime.combine(usage_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
    return reset_at.isoformat().replace("+00:00", "Z")


def build_usage_snapshot(requests_count: int, usage_date=None) -> AiUsageSnapshot:
    date = usage_date or utc_today()
    used = min(max(requests_count, 0), AI_DAILY_LIMIT)

    return AiUsageSnapshot(
        limit=AI_DAILY_LIMIT,
        used=used,
        remaining=max(AI_DAILY_LIMIT - used, 0),
        reset_at=reset_at_for(date),
    )


def get_ai_usage(user) -> AiUsageSnapshot:
    date = utc_today()
    usage = AiDailyUsage.objects.filter(user=user, date=date).first()
    return build_usage_snapshot(usage.requests_count if usage else 0, date)


def reserve_ai_request(user) -> AiUsageSnapshot:
    date = utc_today()

    with transaction.atomic():
        usage, _created = (
            AiDailyUsage.objects.select_for_update()
            .get_or_create(user=user, date=date, defaults={"requests_count": 0})
        )

        if usage.requests_count >= AI_DAILY_LIMIT:
            raise AiDailyLimitExceeded(build_usage_snapshot(usage.requests_count, date))

        usage.requests_count = F("requests_count") + 1
        usage.save(update_fields=["requests_count", "updated_at"])
        usage.refresh_from_db(fields=["requests_count"])

        return build_usage_snapshot(usage.requests_count, date)


def release_ai_request(user) -> AiUsageSnapshot:
    date = utc_today()

    AiDailyUsage.objects.filter(user=user, date=date, requests_count__gt=0).update(
        requests_count=F("requests_count") - 1,
        updated_at=django_timezone.now(),
    )

    return get_ai_usage(user)
