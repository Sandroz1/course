from django.urls import path

from .views import (
    CheckerAvailabilityView,
    SubmissionCreateView,
    SubmissionDetailView,
    TaskAttemptDraftView,
    TaskAttemptListView,
)


urlpatterns = [
    path(
        "tasks/<slug:task_id>/availability/",
        CheckerAvailabilityView.as_view(),
        name="checker-task-availability",
    ),
    path(
        "tasks/<slug:task_id>/attempt/",
        TaskAttemptDraftView.as_view(),
        name="checker-task-attempt",
    ),
    path(
        "tasks/<slug:task_id>/attempts/",
        TaskAttemptListView.as_view(),
        name="checker-task-attempts",
    ),
    path(
        "attempts/<uuid:attempt_id>/submissions/",
        SubmissionCreateView.as_view(),
        name="checker-submission-create",
    ),
    path(
        "submissions/<uuid:submission_id>/",
        SubmissionDetailView.as_view(),
        name="checker-submission-detail",
    ),
]
