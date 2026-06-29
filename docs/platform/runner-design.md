# Runner Design And Threat Model

Status: design-only. No runner implementation, worker provisioning, queue, Docker/VPS change or user C++ execution has been added.

This document defines the safety gate before Uchicode can execute submitted C++ code. It extends the checker contract in [learning-loop-checker-design.md](learning-loop-checker-design.md).

## Goals

- Execute simple deterministic C++ submissions for checker-enabled tasks.
- Keep the Django app, database, Redis, production secrets and production host isolated from untrusted code.
- Make execution fail closed when the runner, queue or sandbox is unavailable.
- Keep rollback simple: one feature flag must disable execution without losing saved drafts.

## Non-Goals

- Do not run user code in the Django container.
- Do not run user code on the current production app host.
- Do not add browser IDE, AI grading, production hidden tests or new course sections in the runner stage.
- Do not use AI to decide accepted/wrong answer. Pass/fail must remain deterministic.

## Architecture Decision

The runner must live outside the production app host boundary:

```text
Browser
  -> Django checker API
  -> queue / runner dispatch contract
  -> isolated runner worker host or VM
  -> disposable sandbox per submission
```

The app host may create submissions and read terminal results. It must not compile or execute submitted code.

Required boundaries:

- Separate worker host/VM or an equivalent isolation layer approved by a security review.
- No route from the sandbox to PostgreSQL, Redis, app containers or production private networks.
- No production secrets mounted or inherited by the runner process.
- No network access from the sandbox unless a later reviewed task explicitly requires it.
- Temporary filesystem per submission, deleted after execution.

## Threat Model

| Risk | Required control |
| --- | --- |
| Infinite loops or fork bombs | Wall-clock timeout, process-group kill and strict process limits. |
| CPU or memory exhaustion | CPU quota, memory limit and worker concurrency limit. |
| Huge output | stdout/stderr byte limit and terminal `output_limit` status. |
| Filesystem escape | Disposable working directory, no host mounts except a minimal read-only toolchain if required. |
| Secret leakage | Empty allowlisted environment; no app `.env`, tokens, keys or credentials. |
| Network abuse | Network disabled by default at sandbox level. |
| Compiler/runtime exploit | Worker isolated from app host; runner patching and image rebuild are operational tasks. |
| Hidden test leakage | Hidden test input/output never returned to frontend, AI prompts, analytics or public logs. |
| Stuck queue | Backpressure, queue depth limit, stale job cleanup and `checker_unavailable` fallback. |
| Wrong progress state | Only terminal `accepted` may mark checker-enabled task progress solved. |

## Submission State Contract

The checker API may expose these states only after execution is enabled:

```text
queued
compiling
running
accepted
wrong_answer
compile_error
runtime_error
time_limit
output_limit
internal_error
checker_unavailable
```

Rules:

- While `CHECKER_EXECUTION_ENABLED=false`, `POST submission` returns `503 checker_unavailable` and does not create a `Submission`.
- Non-terminal states (`queued`, `compiling`, `running`) must not be returned unless a real queue/runner exists.
- Terminal result fields are immutable after finalization.
- Runner logs may store sanitized diagnostics only. They must not store hidden input/output or full source in analytics.

## Queue And Dispatch Contract

Before implementation, choose and document one queue mechanism. Minimum contract:

- Django creates a submission only after execution is enabled and the task version is current.
- Dispatch payload includes submission id, task id, task version, source snapshot id/content, visible/hidden test references and limits.
- Worker reports state transitions with idempotent updates.
- Duplicate worker callbacks cannot create duplicate terminal results.
- Lost or stale jobs are marked `checker_unavailable` or `internal_error` by a controlled cleanup task.
- Queue depth and worker availability must be observable before production enablement.

## Resource Limits

Initial limits must be conservative and task-specific where needed:

- Source size: keep current backend source limit.
- Compile timeout: small fixed limit for beginner tasks.
- Runtime timeout: small fixed limit per test case.
- Output limit: fixed stdout/stderr byte cap.
- Memory limit: fixed cap per process.
- Concurrency: low worker-level cap until production behavior is measured.

Exact numeric values belong in the implementation/config PR and must be documented before production enablement.

## Feature Flags And Disable Switch

Required controls:

- `CHECKER_EXECUTION_ENABLED=false` disables all execution and keeps draft saving available.
- A runner availability check can force `available=false`, `reason=runner_unavailable`.
- A production operator can disable execution without redeploying if the chosen config path supports it; otherwise rollback instructions must be explicit.
- If disabled, existing drafts stay intact and progress is not changed.

## Observability

Minimum metrics/logs:

- queue depth;
- runner alive/ready state;
- submission count by terminal status;
- compile/runtime timeout counts;
- worker error count;
- average queue wait and execution time;
- last successful runner heartbeat.

Logs must identify submission id, task id and terminal status. Logs must not include hidden tests, full source code, secrets or production env values.

## Rollback Runbook

If execution causes instability:

1. Disable `CHECKER_EXECUTION_ENABLED`.
2. Verify availability returns `runner_unavailable` or equivalent fail-closed state.
3. Confirm new submissions no longer start execution.
4. Keep existing drafts and attempts.
5. Inspect runner/queue logs outside the app container.
6. If needed, rollback the app using the deploy runbook without deleting volumes.

## Prototype Readiness Checklist

The isolated prototype may start only after this checklist is true:

- Worker host/VM isolation approach is selected.
- No-network/no-secrets policy is testable.
- Timeout, memory and output limits are defined.
- Temp directory cleanup is testable.
- Process-group kill is testable.
- Queue/status contract is agreed.
- Rollback/disable switch is documented.
- Prototype is explicitly non-production and does not touch production data.

## Production Enablement Gate

Before enabling for users:

- backend tests cover queue unavailable, stale task version, ownership and progress guard;
- runner tests cover compile success, wrong answer, compile error, runtime error, timeout, output limit and cleanup;
- production backup is completed;
- feature flag starts disabled;
- only 1-2 simple tasks are enabled first;
- health checks, logs and rollback path are verified.
