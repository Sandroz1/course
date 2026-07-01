---
name: uchicode-checker-runner
description: Enforce Uchicode checker and runner contracts. Use when working on checker models, task attempts, submissions, test cases, hidden tests, runner adapters, Piston planning, worker VM isolation, execution statuses, or checker API/UI behavior.
---

# Uchicode Checker And Runner

Read `docs/platform/learning-loop-checker-design.md`, `docs/platform/runner-design.md`, `docs/platform/runner-worker-provisioning.md`, and the current state before changing checker or runner behavior.

## Current Boundary

- Runner execution is disabled. Piston is only the preferred future target on a separate validated worker VM.
- Never execute user C++ on the production VPS, production Docker host, or inside Django.
- Keep `DisabledRunner` fail-closed until worker isolation, no-network, no-secrets, limits, cleanup, and operations gates pass.
- When execution is disabled, return controlled `checker_unavailable`, create no `Submission`, and do not change progress.
- Treat `checker_unavailable` as an API error/reason, never a persisted `Submission.status`.

## Data And Status Safety

- Never expose hidden tests, expected output, source code, stdin/stdout/stderr payloads, secrets, env, or sensitive paths through public serializers, UI, logs, DTO repr, or metadata.
- Persist only canonical submission statuses: `queued`, `compiling`, `running`, `accepted`, `wrong_answer`, `compile_error`, `runtime_error`, `time_limit`, `output_limit`, `internal_error`.
- Do not return legacy statuses: `passed`, `failed`, `compiler_error`, `timeout`, `system_error`, `cancelled`.
- Do not fake execution, lifecycle states, results, or polling. Add polling only when a real runner lifecycle exists.
- Preserve version immutability, ownership, source limits, stale-version handling, and accepted-only progress rules.

## Verification

Run Django checks, migration dry-run, and backend tests for backend changes. Add tests for fail-closed behavior, ownership, hidden-data non-exposure, canonical mappings, and no progress mutation before accepted results.
