# Checker Task Authoring

Status: admin/content readiness guide. This document describes how to prepare checker task data before execution exists.

## Current Boundary

- Runtime execution is disabled: `CHECKER_EXECUTION_ENABLED=false`.
- Piston, worker VM validation, queueing and polling are not started.
- Frontend result UI has a hidden foundation only; it renders real submission data when it exists and must not show fake results while execution is disabled.
- Do not create production task versions or hidden tests until the worker VM/Piston gates pass.
- Public task content still lives in `site/src/data/tasks.ts` and `site/src/content/course`.

## Admin Workflow

Use Django admin for checker definitions:

1. Create `CheckerTaskVersion`.
2. Add `TestCase` rows inline under that version.
3. Keep the version disabled while drafting.
4. Enable only after the visible task text, starter code and public tests match.

`task_id` must match exactly one frontend task id. `course_slug` and `lesson_slug` are backend snapshots used for history and reporting; do not accept these values from the browser.

The admin readiness label is only a preparation hint:

- `missing tests` means no tests exist.
- `hidden-only draft` means there are tests, but none are public.
- `draft ready` means at least one public test exists.
- `enabled` means the version is locked by the checker model rules.

## Test Case Rules

- `position` defines deterministic order and must be unique within a task version.
- Public tests can be returned by availability API and must not reveal a final solution.
- Hidden tests must not be stored in frontend fixtures, docs, analytics, logs or AI prompts.
- Hidden test input and expected output must not be returned by public serializers/API.
- Enabled or used task versions and their tests are immutable. Create a new task version for behavior changes.

## Readiness Checklist

Before enabling a non-production checker task version:

- Frontend task id exists exactly once.
- Visible assignment states the same input/output contract as the tests.
- At least one public test demonstrates the expected format.
- Hidden tests, if any, add useful coverage without relying on private frontend data.
- Comparison mode is appropriate for the task.
- Source, time, memory and output limits are conservative.
- Submit still fails closed while execution is disabled.

Before production checker data:

- Dedicated worker VM validation has passed.
- No-network/no-secrets proofs are recorded.
- Piston/API integration has been reviewed and remains private to the worker boundary.
- Rollback/disable switch is documented and tested.

## Not Allowed In This Stage

- No user C++ execution.
- No Piston install/client.
- No queue worker.
- No polling or fake results.
- No production hidden tests.
- No production task version seed.
- No section 11/12 content.
