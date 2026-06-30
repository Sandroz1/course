# Runner Design And Threat Model

Status: reviewed and approved for isolated prototype planning only. No runner implementation, worker provisioning, queue, Docker/VPS change or user C++ execution has been added.

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

Concrete prototype target:

- A dedicated non-production worker VM.
- Not the current production VPS.
- Not the Django container.
- Not the Docker host that runs production PostgreSQL, Redis, backend or nginx.
- No production `.env`, database credentials, deploy keys, backups or provider tokens.
- No public user traffic; prototype access is developer-only.
- Synthetic/local test cases only; no production hidden tests.

Required boundaries:

- Separate worker VM for the prototype. Any "equivalent isolation" option is a future security decision, not approved by this review.
- No route from the sandbox to PostgreSQL, Redis, app containers or production private networks.
- No production secrets mounted or inherited by the runner process.
- No network access from the sandbox unless a later reviewed task explicitly requires it.
- Temporary filesystem per submission, deleted after execution.

## Threat Model

| Risk | Required control | Remaining risk | Prototype status |
| --- | --- | --- | --- |
| Malicious C++ code | Dedicated worker VM, non-root execution, no production network, no secrets, no host mounts. | VM escape remains a class risk, so prototype stays non-production. | Non-blocker for isolated prototype. |
| Infinite loop or fork/process abuse | Wall-clock timeout, PID/process limits and process-tree kill. | Limit configuration can be wrong. Prototype must include abuse tests. | Non-blocker after tests. |
| CPU abuse | CPU quota and low worker concurrency. | Host-level contention is possible if limits are misconfigured. | Non-blocker for non-production VM. |
| Memory abuse | Hard memory/swap limits per run. | OOM behavior must be observed in prototype. | Non-blocker after tests. |
| Disk/temp abuse | Bounded disposable workspace, file-size limits and cleanup verification. | Cleanup bugs can fill disk. Prototype must include failed-cleanup test. | Non-blocker after tests. |
| stdout/stderr output spam | Byte cap, stop reading at limit and terminal `output_limit`. | Truncation must not hide infrastructure errors. | Non-blocker after tests. |
| Network access | Sandbox network disabled by default. | VM host networking must also be checked. | Non-blocker after no-network proof. |
| Secret/env leak | Empty allowlisted environment and no mounted production files. | Developer mistakes can copy env files. Prototype VM must not receive production env. | Non-blocker with VM setup rule. |
| Filesystem access | No host paths, no Docker socket, isolated temp directory. | Toolchain files may need read-only access. | Non-blocker if read-only and minimal. |
| Compiler/runtime exploit | Fixed patched toolchain image and worker isolation from app host. | Compiler vulnerabilities remain possible. | Non-blocker for prototype, review before production. |
| Stuck jobs | Lease/heartbeat, timeout cleanup and terminal `internal_error` or `checker_unavailable`. | Queue implementation can still wedge. | Must be tested before backend integration. |
| Queue flood / DoS | Auth, throttles, one active job per user, global queue/concurrency caps and fail-closed backpressure. | Requires real queue implementation to prove. | Not in isolated prototype scope. |
| Log leakage | Sanitized logs; no hidden tests, full source, secrets or env values. | Debug logging can regress. | Non-blocker with log review. |
| Runner unavailable | Health/heartbeat check and `checker_unavailable` fallback. | Availability signal can be stale. | Must be tested before API integration. |
| Failed cleanup | Cleanup after success, failure and forced kill. | Orphan files/processes can remain. | Must be tested in prototype. |
| Worker compromise | Worker has no production secrets, DB access or app network route. | Worker rebuild/rotation procedure still needed. | Non-blocker for non-production prototype, blocker for production. |
| Wrong progress state | Only terminal `accepted` can update checker-enabled `TaskProgress`. | Status mapping bugs can mark solved incorrectly. | Blocker before API integration. |

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
- The checker foundation normalizes historical model names such as `passed`, `failed`, `compiler_error`, `timeout` and `system_error` to the canonical public statuses above before API-integrated runner work. Do not reintroduce competing status vocabularies in the frontend.

## Queue And Dispatch Contract

Before implementation, choose and document one queue mechanism. Minimum contract:

- Django validates auth, ownership, current task version and source size before persistence.
- If execution is disabled or the runner/queue is unavailable, return `503 checker_unavailable` before creating a `Submission`.
- If execution is enabled and queue handoff is available, Django creates the immutable `Submission` with `queued` and performs durable queue handoff.
- Dispatch payload includes submission id, task id, task version, source snapshot id/content, visible/hidden test references and limits.
- Worker moves status to `compiling` only when compile starts and to `running` only when test execution starts.
- Worker reports terminal states with idempotent updates.
- Frontend receives results by polling `GET /api/checker/submissions/{submission_id}/`; polling must respect throttles and `Retry-After`.
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
6. For stuck jobs, mark stale active submissions terminal with a safe system status and stop worker intake.
7. For high load, lower worker concurrency or disable execution before scaling.
8. If needed, rollback the app using the deploy runbook without deleting volumes.

Operational rules:

- Health check must cover queue reachability, worker heartbeat and sandbox self-test status.
- Logs to inspect: Django checker API, queue/dispatch worker, runner controller and sandbox lifecycle logs.
- `docker compose down -v` remains forbidden because it can delete production volumes and data.
- Production app host must not execute C++ because it holds the web process boundary, database/Redis network access and production operational availability.

## Prototype Readiness Checklist

The isolated prototype may start only after this checklist is true:

- Dedicated non-production worker VM is selected.
- No-network/no-secrets policy is testable.
- Timeout, memory and output limits are defined.
- Temp directory cleanup is testable.
- Process-group kill is testable.
- Queue/status contract is agreed.
- Rollback/disable switch is documented.
- Prototype is explicitly non-production and does not touch production data.
- Prototype does not enable `CHECKER_EXECUTION_ENABLED`.
- Prototype does not create production `CheckerTaskVersion` rows or hidden tests.

## Production Enablement Gate

Before enabling for users:

- backend tests cover queue unavailable, stale task version, ownership and progress guard;
- runner tests cover compile success, wrong answer, compile error, runtime error, time limit, output limit and cleanup;
- production backup is completed;
- feature flag starts disabled;
- only 1-2 simple tasks are enabled first;
- health checks, logs and rollback path are verified.
