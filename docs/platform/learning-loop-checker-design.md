# Learning Loop + C++ Checker MVP

Status: approved technical design. Backend checker data/API foundation, service-layer disabled runner boundary and frontend draft saving are implemented. Product sequencing is defined only in [product-roadmap.md](../product/product-roadmap.md); runner and runtime code execution remain separate future work. Runner isolation details live in [runner-design.md](runner-design.md). Checker task authoring/admin workflow lives in [checker-task-authoring.md](checker-task-authoring.md).

## 1. Purpose

The next Uchicode platform layer should close the learning loop:

`topic -> task -> draft -> submission -> result -> hint -> retry -> progress -> next step`

Today a task page provides the assignment, starter code and help, while the backend stores only coarse lesson/task progress. The MVP adds a versioned record of the learner's work and a safe path to automated checks without moving all course content into Django.

## 2. Decisions

- Use a hybrid source of truth with non-overlapping ownership.
- Keep teaching content in `site/src/data/tasks.ts` and `site/src/content/course`.
- Make the backend authoritative for checker availability, immutable task versions, execution limits and test cases.
- Store one draft attempt per user and task version; keep every submission immutable.
- Derive `course_slug` and `lesson_slug` on the server from the checker task version. Do not trust client-supplied slugs.
- For checker-enabled tasks, only the checker result may project `TaskProgress` to `solved`; the existing manual status flow remains for tasks without a checker.
- Do not run submitted code in the Django container or on the current production app host.
- Do not enable execution until a separate worker host or VM and the isolation controls in this document are available.

## 3. Non-goals

The MVP does not include:

- a LeetCode-like general-purpose judge;
- a browser IDE, terminal, file tree, autocomplete or debugger;
- multi-file, filesystem or interactive menu tasks;
- bulk migration of course content into the backend;
- sections 11/12 or other new course content;
- monetization or payments;
- teacher/classroom features;
- a large UI redesign;
- AI-generated grading or AI as the source of pass/fail truth.

## 4. Current assumptions

- Course and task content is static frontend data. A task currently has a stable `id`, `courseId`, `lessonSlug`, teaching copy and starter files.
- Django stores `LessonProgress`, `TaskProgress` and `UserStudyState`. `TaskProgress` has only `not_started`, `in_progress` and `solved`; it does not store code or result history.
- The AI assistant has its own authenticated, throttled API and usage accounting. It does not grade solutions.
- Task pages are readable by guests. Saving progress requires an authenticated user.
- Production currently runs Django, PostgreSQL, Redis and Nginx on the app deployment. There is no submission worker or sandbox runner.
- `practice/` is an internal source for starter material, not a user-facing filesystem contract.
- Checker-configured task pages use an in-browser C++ draft editor with authenticated save/restore and a hidden result-panel foundation for future real submissions. It still has no result polling, runtime execution or fake local results.

## 5. Source of truth and `task_version`

### Ownership

| Data | Source of truth |
| --- | --- |
| Title, explanation, hints, starter code, course placement | frontend static content |
| Checker enabled/disabled state | backend checker registry |
| Language, comparison mode, limits and tests | immutable backend task version |
| Draft code and submission history | backend attempts/submissions |
| Completion projection | existing backend `TaskProgress` |

This split avoids duplicating all teaching content while preventing the browser from defining the rules used to grade its own submission.

### Version rules

`task_version` is a positive integer scoped to `task_id`, starting at `1`.

- `(task_id, task_version)` is unique and immutable after the version is enabled or receives its first submission.
- Bump the version when expected behavior, tests, comparison mode, language, starter-code semantics or execution limits change materially.
- Do not bump it for spelling, layout or explanation-only edits that do not change the accepted solution.
- Historical attempts and submissions keep their original version and remain readable.
- An old draft is never overwritten. When the current version changes, the UI can copy its code into a new current-version attempt.
- New submissions against a retired version return `409 task_version_mismatch` with the current version. Existing results remain available.

`course_slug` and `lesson_slug` are immutable snapshots on the backend task version and attempt. They support history and reporting if course placement later changes. The server resolves them from `task_id`; the client does not choose them.

### Synchronization guard

Before a checker task is enabled, a release check must confirm that:

- its `task_id` exists exactly once in the frontend registry;
- backend and frontend course/lesson mapping agree;
- the visible assignment states the same input/output contract as its tests;
- every enabled version has at least one test and a supported comparison mode.

The checker must fail closed (`checker_unavailable`) when this contract is missing or inconsistent.

## 6. Learning Loop 2.0

1. The learner opens a topic and sees the recommended next task.
2. The task page loads checker availability and the learner's current draft.
3. A guest can read the task; sign-in is required to save or submit.
4. The learner edits one `main.cpp` draft and receives a clear saved/error state.
5. Submit atomically snapshots the latest source and creates an immutable submission.
6. The UI shows queued, compiling and running states without pretending the task is complete.
7. The result distinguishes compiler, runtime, timeout and wrong-answer failures.
8. Public failures show bounded useful details. Hidden tests show only counts and a non-revealing hint.
9. The learner edits the same draft and submits again; previous submissions remain in history.
10. Only an accepted checker result changes `TaskProgress` to `solved`.
11. The profile and next-step logic can use the accepted result to continue the course.

AI explanation is a later phase. It may explain a sanitized compiler/result summary, but it must not receive hidden test data or decide whether a task passed.

## 7. Data model

These model names are implemented in `backend/apps/checker`. Execution-related fields and transitions below remain the target contract for the future runner stage.

### `CheckerTaskVersion`

- `task_id`
- `version`
- `course_slug`
- `lesson_slug`
- `language` (`cpp17` for MVP)
- `comparison_mode` (`exact`, `trimmed_lines` or `tokens`)
- `is_enabled`
- `compile_timeout_ms`, `run_timeout_ms`, `memory_limit_kb`, `output_limit_bytes`
- `created_at`, `retired_at`

Constraint: unique `(task_id, version)`. Enabled versions are immutable; create a new version instead of editing one in place.

### `TaskAttempt`

- `id` (UUID)
- `user`
- `task_version` (foreign key to `CheckerTaskVersion`)
- `task_id`, `task_version_number`, `course_slug`, `lesson_slug` snapshots
- `status`: `draft`, `in_progress`, `accepted`, `archived`
- `code_snapshot`
- `note`
- `result_summary` (bounded JSON summary of the latest submission)
- `created_at`, `updated_at`

MVP constraint: one non-archived attempt per `(user, task_id, task_version_number)`. Many immutable submissions belong to that attempt.

### `Submission`

- `id` (UUID)
- `attempt`
- `language`
- `source_code` (immutable snapshot, size-limited)
- `status`: persisted runner vocabulary is `queued`, `compiling`, `running`, `accepted`, `wrong_answer`, `compile_error`, `runtime_error`, `time_limit`, `output_limit`, `internal_error`
- `checker_unavailable` is an API error/reason for fail-closed execution and must not be persisted as a `Submission.status`.
- `compiler_output`, `runtime_output` (sanitized and truncated)
- `passed_tests`, `failed_tests`, `total_tests`
- `execution_time_ms`, `memory_used_kb`
- `created_at`, `started_at`, `finished_at`

Terminal status transitions are immutable. A queue retry may claim the same submission idempotently but must not create a second result.

### `TestCase`

- `id`
- `task_version` (foreign key)
- `input`
- `expected_output`
- `is_hidden`
- `weight`
- `explanation`
- `position`

Test cases are immutable with their task version. Hidden inputs and expected outputs are never returned by public APIs, logs or AI prompts. Because the repository is public, production hidden tests must live in the backend database and backups, not in tracked fixtures.

## 8. Public API design

Use the project's existing snake_case JSON convention.

### Availability

`GET /api/checker/tasks/{task_id}/availability/`

Public, cacheable response:

```json
{
  "task_id": "00-03-input-age",
  "available": true,
  "task_version": 1,
  "language": "cpp17",
  "limits": {
    "source_bytes": 65536,
    "run_timeout_ms": 2000
  },
  "public_tests": [
    {"input": "18\n", "expected_output": "18\n", "explanation": "Выведено считанное значение."}
  ]
}
```

Unavailable tasks return `200` with `available: false` and a stable reason such as `not_supported` or `temporarily_disabled`. They do not expose hidden-test metadata.

### Save draft

`PUT /api/checker/tasks/{task_id}/attempt/`

Authenticated and idempotent for the current task version:

```json
{
  "task_version": 1,
  "source_code": "#include <iostream>\n...",
  "note": ""
}
```

Response: the user's attempt id, status, version and timestamps. The current UI uses explicit draft save and shows `saving`, `saved` or `save_error` without clearing local editing. Debounced autosave is optional later work, not current behavior.

### Attempt history

`GET /api/checker/tasks/{task_id}/attempts/`

Authenticated, owner-only, paginated. Returns attempt/version summaries and submission ids; it does not return hidden test data.

### Submit

`POST /api/checker/attempts/{attempt_id}/submissions/`

Authenticated, owner-only. The body includes the current source so draft update and immutable submission creation happen atomically:

```json
{
  "task_version": 1,
  "source_code": "#include <iostream>\n..."
}
```

Require an `Idempotency-Key` header. Return `202 Accepted`, submission id, `queued` status and a short `Retry-After` value. Reject a second active submission for the same attempt.

### Result

`GET /api/checker/submissions/{submission_id}/`

Authenticated, owner-only. While active, return the current status. A terminal result may include compiler output and public failures. For hidden tests return only passed/failed counts and a generic explanation category.

### Errors and permissions

- `400`: invalid language, status or malformed source payload.
- `401`: sign-in required.
- `403`: checker access is disabled for this account or cohort.
- `404`: unknown or non-owned task/attempt/submission without leaking another user's object existence.
- `409`: stale task version, active submission already exists or invalid state transition.
- `413`: source exceeds the configured limit.
- `429`: scoped submission or polling limit exceeded; include `Retry-After`.
- `503`: checker/queue unavailable; keep the draft safe and do not mark progress solved.

Suggested initial guardrails are configurable rather than product promises: debounced draft writes, at most one active submission per user, a low scoped submit rate (for example 6/minute) and a higher result-poll rate. Set daily quotas only after observing real usage.

## 9. UI states

The task page keeps its current assignment/help structure and adds one single-file code input. This is not a browser IDE.

| State | Required UI behavior |
| --- | --- |
| `no_attempt` | Show starter code and one action to begin. |
| `saving` / `draft_saved` | Stable inline save state; no layout jump. |
| `save_error` | Keep local code, explain retry, never clear the editor. |
| `ready_to_submit` | Submit enabled only for authenticated users and a current version. |
| `submitting` / `queued` | Disable repeated submit; allow continued reading. |
| `compiling` / `running` | Show the actual phase, not a fake percentage. |
| `accepted` | Show tests passed and the next learning action. |
| `wrong_answer` | Show public mismatch details and retry action. |
| `compile_error` | Show bounded compiler output with readable code formatting. |
| `runtime_error` / `time_limit` / `output_limit` | Explain the failure class without exposing infrastructure. |
| `stale_version` | Preserve old code and offer copying it into the current version. |
| `checker_unavailable` / `internal_error` | Keep draft editing available and avoid changing progress. |

Theme changes must not change editor/result typography metrics. Mobile keeps the editor and result inside the content width; long code/output scrolls inside its own block.

## 10. Checker MVP architecture

```text
Task page
  -> Django API: validate ownership/version/rate limit
  -> PostgreSQL: persist attempt and queued submission
  -> durable queue: submission id only
  -> trusted runner controller on a separate worker host/VM
  -> fresh untrusted sandbox for compile and execution
  -> bounded result returned by the trusted controller
  -> Django stores result and updates TaskProgress on pass
  -> task page polls and renders result
```

The database is the submission source of truth; the queue is delivery infrastructure. Queue delivery must be idempotent and safe for at-least-once processing. The concrete broker/worker library is deliberately not selected here.

The trusted controller may access only the queue/result interface needed for jobs. The untrusted sandbox receives source, compiler/runtime limits and test data, but no database, Redis, Docker socket, application network, secrets or environment file.

## 11. Runner isolation and security

Running user code in the backend container would expose the application process, filesystem, environment, database network and production availability. A container on the same production host still shares the host kernel, so the MVP execution gate is a separate disposable worker host or VM with no route to production data networks.

Compile and run use separate fresh sandboxes and profiles. Initial limits for simple tasks should be conservative and configurable: source up to 64 KiB, compile timeout around 10 seconds, runtime timeout around 2 seconds per test, total job timeout around 20 seconds, memory around 128 MiB, bounded CPU, PID limit, 64 KiB combined output and a small ephemeral workspace.

| Risk | Required mitigation |
| --- | --- |
| Malicious code / sandbox escape | Separate worker host/VM; non-root user; drop all capabilities; `no-new-privileges`; seccomp; minimal patched image; never privileged. Consider gVisor/another stronger sandbox before wider rollout. |
| Infinite loop / fork bomb | Wall-clock watchdog, CPU quota, PID limit, per-test and total-job timeout, forced kill and cleanup. |
| Memory or disk abuse | Hard memory/swap limits, bounded tmpfs workspace, file-size limits, no persistent or host mounts. |
| Output spam | Stop reading at the byte limit, terminate the process, store only a truncated marker. |
| File/host access | Read-only root filesystem, isolated tmpfs working directory, no host paths, devices or Docker socket. |
| Network access | Sandbox network mode `none`; no DNS, host networking or service network. |
| Secret leakage | Empty allowlisted environment, no app secrets, no production credentials, no inherited worker environment. |
| Compiler abuse | Fixed server-owned compiler command and image; no user flags, packages or arbitrary file names; separate compile profile. |
| Submission flooding | Authentication, scoped throttles, one active job per user, global queue/concurrency caps and backpressure. |
| Hidden-test disclosure | Never return hidden input/expected output; sanitize logs; do not send hidden data to AI or analytics. |
| Stuck/orphaned jobs | Lease/heartbeat, idempotent claim, terminal system error, periodic cleanup and alerting. |

Docker supports explicit CPU/memory constraints, seccomp, `no-new-privileges`, capability dropping and `network_mode: none`; none of these controls alone makes an app-host container an acceptable untrusted-code boundary.

## 12. First checker tasks

These are candidates, pending a visible input/output contract review before enablement.

| Task | Why it fits | Tests | Main risk |
| --- | --- | --- | --- |
| `00-02-print-hello` | Single file, deterministic output, no input. | Public: empty input -> `Hello`; `trimmed_lines`. Hidden tests add no value. | Overly strict newline/space comparison. |
| `00-03-input-age` | Basic stdin/stdout and integer parsing. | Public: `18` -> `18`; hidden: `0`, `1`, `100`; `tokens`. | Current visible copy must explicitly require output. |
| `00-04-if-age` | Small boundary-condition task. | Public: `17` -> `Нельзя`, `18` -> `Можно`; hidden: `0`, `19`, `100`; `tokens`. | Exact accepted words and UTF-8 output must be stated visibly. |
| `00-05-for-loop` | Deterministic sequence and no interaction. | Public: empty input -> tokens `1` through `10`; hidden tests add no value. | Spaces versus newlines should not cause false negatives. |

Do not start with `00-01-minimal-program`: compile success cannot prove the requested structure and could create a misleading pass. Also exclude function-harness tasks, menus, multi-file projects, filesystem access, complex OOP tasks and tasks that grade internal implementation instead of observable behavior.

## 13. Technical rollout and measurement

Implemented and deployed in product foundation phase 1:

1. Design and ownership boundaries.
2. Backend task-version, attempt, submission and test-case foundation.
3. Availability, owner-only draft/history API and fail-closed submission contract.
4. Single-file draft UI with guest/auth and save/error states.

Remaining technical order after the runner design/security gate:

1. Review [runner-design.md](runner-design.md), then provision the separate worker boundary, durable queue and sandbox validation suite.
2. Connect accepted results to `TaskProgress` transactionally.
3. Enable submissions only for reviewed simple tasks and a small user cohort.
4. Add sanitized AI error explanation only after deterministic results are stable.
5. Expand coverage only after security, reliability and learning metrics pass review.

Minimal events: `checker_task_viewed`, `attempt_saved`, `submission_created`, `submission_finished`, `task_passed`. Never include source code, test input/output or compiler logs in analytics.

Primary learning signals are first-submission rate, eventual pass rate after retry and median time from first submission to pass. Guardrails are system-error rate, p95 queue wait, timeout/output-limit rate and throttle rate. Do not set numerical product targets until a baseline exists.

## 14. Acceptance criteria

This design is implementation-ready when:

- ownership between static content and backend checker data is unambiguous;
- version immutability and stale-draft behavior are accepted;
- models, statuses, permissions, errors and API shapes are agreed;
- hidden tests cannot leave the backend/runner boundary;
- the separate worker-host requirement and resource limits are accepted;
- the four initial tasks have reviewed visible I/O contracts and test cases;
- progress changes only after a deterministic accepted result;
- rollout has feature flags, observability, backpressure and rollback to checker-unavailable;
- implementation is split into independently reviewable phases.

## References

- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
- [Docker seccomp profiles](https://docs.docker.com/engine/security/seccomp/)
- [Docker none network driver](https://docs.docker.com/engine/network/drivers/none/)
- [Docker Compose service security options](https://docs.docker.com/reference/compose-file/services/)
- [gVisor security model](https://gvisor.dev/security/)
