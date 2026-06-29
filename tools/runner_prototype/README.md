# Isolated Runner Prototype

Standalone C++ runner prototype for the Uchicode checker.

## Scope

- Non-production only.
- Target environment: dedicated Linux worker VM.
- No backend API integration.
- No frontend UI integration.
- No production `CheckerTaskVersion` rows or hidden tests.
- No production secrets, env files, database, Redis, deploy keys or backups.
- No `CHECKER_EXECUTION_ENABLED=true`.

The prototype uses Python stdlib only. It accepts synthetic local C++ snippets, creates a temporary workspace, writes `main.cpp`, compiles with `g++ -std=c++17`, runs the binary with optional stdin, captures bounded stdout/stderr and returns a JSON-like result.

## Run

Run on the non-production Linux worker VM or an equivalent non-production Linux environment with `python` and `g++`:

```bash
python -m unittest discover tools/runner_prototype/tests
python tools/runner_prototype/run_cases.py
```

On Windows or Linux without `g++`, the tests report that the environment is unsupported. That is a smoke result only, not an isolation proof.

## Result Shape

Each run returns:

- `status`
- `exit_code`
- `stdout`
- `stderr`
- `compile_time_ms`
- `run_time_ms`
- `timed_out`
- `output_truncated`
- `error_message`
- safe `metadata`

Supported statuses:

- `accepted`
- `wrong_answer`
- `compile_error`
- `runtime_error`
- `time_limit`
- `output_limit`
- `internal_error`

## Proven By This Harness

- Fresh temporary workspace per run.
- Workspace cleanup in `finally`.
- Fixed `g++ -std=c++17` compile command.
- Compile timeout.
- Runtime timeout.
- Process-group kill on Linux.
- Bounded stdout/stderr.
- Safe allowlisted environment instead of inherited developer/production env.
- Synthetic success, wrong answer, compile error, runtime error, timeout, output limit and env-leak tests.

## Not Proven By This Harness

- No-network isolation.
- VM/container/firewall isolation.
- Production runner provisioning.
- Queue/dispatch behavior.
- Backend status migration or compatibility mapping.
- Hidden-test storage and delivery.
- Production observability and rollback.

No-network proof must be done at the dedicated worker VM/container/firewall layer before API-integrated runner work or production enablement. The current backend checker status enum still differs from the canonical runner public statuses; that mismatch remains a required cleanup before backend API integration.
