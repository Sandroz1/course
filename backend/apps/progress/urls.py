from django.urls import path

from .views import (
    LessonProgressView,
    ProgressOverviewView,
    StudyStateView,
    TaskProgressView,
)


urlpatterns = [
    path("", ProgressOverviewView.as_view(), name="progress-overview"),
    path("state/", StudyStateView.as_view(), name="progress-state"),
    path("lessons/", LessonProgressView.as_view(), name="progress-lessons"),
    path("tasks/", TaskProgressView.as_view(), name="progress-tasks"),
]

