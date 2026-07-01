# Runner Worker Provisioning And Validation Packet

Status: docs-only provisioning and validation packet. This is the gate before any API-integrated runner, Piston client, queue worker or production checker execution.

Current known state at the time of this packet:

- `origin/main` includes docs-only state commit `f0984a7`.
- Production runtime remains `7d10f24`.
- `CHECKER_EXECUTION_ENABLED=false`.
- No dedicated worker VM has been created or validated yet.
- Piston is a preferred future runner target only; it is not installed.

This document does not approve production execution. It does not create a VM, install Piston, add a Django endpoint, add a queue, add hidden tests, seed production task versions or enable user C++ execution.

## 1. VM Requirements

The worker must be a dedicated non-production Linux VM:

- Ubuntu 24.04 LTS by default.
- Minimum: 2 vCPU, 2 GB RAM, 30 GB disk.
- Recommended for future Piston validation: 2 vCPU, 4 GB RAM, 40 GB disk.
- Not the production VPS.
- Not the production Docker host.
- Not attached to the production private network.
- No production `.env`, deploy keys, DB/Redis credentials, backups, provider tokens or AI credentials.
- SSH access only for developer/admin operators who run validation.
- Runner/prototype execution under a non-root user such as `uchicode-runner`.
- Disposable: if isolation is suspect, rebuild the VM instead of trying to repair it in place.

The worker must not run:

- Django backend.
- PostgreSQL or Redis for production.
- Host nginx for production.
- Production Docker Compose.
- Public Piston API.
- Public checker execution traffic.

## 2. Provisioning Prerequisites

Before creating or accessing the VM, record the intended non-sensitive metadata:

```text
Provider:
Region:
VM name:
OS image:
vCPU/RAM/disk:
Operator:
Purpose: Uchicode non-production runner validation
```

Do not record provider account secrets, private keys, internal IPs or production network details in this repository.

Provisioning prerequisites:

- A separate non-production VM exists or is approved for creation.
- It has no production network peering, VPN, security-group route or firewall allow rule to production DB/Redis/private networks.
- It has no copied production `.env` or backup data.
- It has an SSH account for operators.
- It can install only the minimum OS packages required for validation.
- The validation commit is the latest approved `origin/main` at validation time, not a hard-coded old hash.

Checkout pattern for future validation:

```bash
git clone https://github.com/Sandroz1/course.git uchicode-runner-validation
cd uchicode-runner-validation
git fetch origin main
git checkout main
git pull --ff-only origin main
git rev-parse --short HEAD
```

At this packet's creation time `f0984a7` is the latest docs-only `origin/main`, and production runtime is `7d10f24`. Future validation must test the latest approved `origin/main` commit available then and record that exact hash in the validation result.

## 3. Safe Setup Commands

These commands are for the future non-production worker VM only. Do not run them on the production VPS.

Check OS and basic tooling:

```bash
cat /etc/os-release
uname -a
python3 --version
g++ --version
git --version
ip -Version
ss --version
timeout --version
```

Create and inspect the non-root runner user:

```bash
sudo adduser --disabled-password --gecos "" uchicode-runner
id uchicode-runner
groups uchicode-runner
sudo -l -U uchicode-runner || true
```

Pass criteria:

- `uchicode-runner` exists.
- It is not root.
- It is not in `sudo`, `docker`, `adm` or other privileged groups.
- It does not have broad passwordless sudo.

Fail criteria:

- Prototype or future user code must run as root.
- The runner user can administer production infrastructure.
- A Docker socket or host admin socket is available to the runner user.

## 4. No-Secrets Validation

Do not print secret values. Only print environment variable names and file paths that are safe to disclose.

Run as the future runner user:

```bash
whoami
printenv | cut -d= -f1 | sort | grep -Ei 'secret|token|password|passwd|key|credential|database|postgres|redis|django|openai|deploy|backup' || true
find "$HOME" -maxdepth 4 -type f \( -name ".env*" -o -iname "*secret*" -o -iname "*token*" -o -iname "*key*" -o -iname "*credential*" -o -iname "*backup*" \) -print
test ! -f .env
test ! -f .env.production
```

Pass criteria:

- No production-like secret environment variable names are present.
- No `.env` or `.env.production` files exist in the runner home or checkout.
- No production deploy keys, DB/Redis credentials, provider tokens, OpenAI keys or backups are present.

Fail criteria:

- Any production secret, token, backup, deploy key or credential exists on the worker.
- Any validation command prints a secret value.
- Prototype execution requires a production secret.

If a suspicious variable name appears, do not print its value. Remove it from the worker and record only the variable name and remediation in the validation result.

## 5. No DB/Redis/Private-Network Validation

Absence of credentials is not enough. The worker must also lack network path to production DB, Redis and private app networks.

Safe baseline checks:

```bash
ip addr
ip route
ss -ltnp
printenv | cut -d= -f1 | sort | grep -Ei 'postgres|database|redis|django|db_|redis_' || true
```

If production private hostnames or IPs are known to the operator, test reachability without credentials and without writing those details into this document:

```bash
timeout 3 bash -lc '</dev/tcp/<redacted-production-db-host-or-ip>/5432' && exit 1 || true
timeout 3 bash -lc '</dev/tcp/<redacted-production-redis-host-or-ip>/6379' && exit 1 || true
timeout 3 bash -lc '</dev/tcp/<redacted-production-private-host-or-ip>/22' && exit 1 || true
```

If production network details are unavailable or should not be exposed, record this as an acceptance gate in the validation result:

```text
Production private network access proof: blocked / not applicable / blocked pending operator proof
Operator evidence location: redacted, outside repo
```

Pass criteria:

- No VPN, peering, security-group route or firewall rule connects the worker to production private networks.
- Production DB/Redis ports are unreachable from the worker.
- No production DB/Redis environment variable names exist.

Fail criteria:

- Worker can reach production DB/Redis/private app networks.
- Worker has production credentials even if the network path is blocked.
- Operator cannot prove network isolation before API-integrated runner work.

## 6. No-Network Execution Proof

The standalone Python prototype does not prove no-network isolation. No-network must be proven from the exact sandbox/execution context that will run compiled user code.

Until there is an actual sandbox command, no-network execution proof is a blocker before API-integrated runner work.

Future probe source:

```bash
cat > /tmp/uchicode-network-probe.cpp <<'CPP'
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <iostream>

int main() {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) {
        std::cout << "socket_blocked\n";
        return 0;
    }

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(80);
    inet_pton(AF_INET, "1.1.1.1", &addr.sin_addr);

    int result = connect(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));
    close(fd);
    std::cout << (result == 0 ? "network_available" : "network_blocked") << "\n";
    return result == 0 ? 2 : 0;
}
CPP
g++ -std=c++17 /tmp/uchicode-network-probe.cpp -o /tmp/uchicode-network-probe
```

The binary must be executed inside the same sandbox/network namespace intended for user code. A direct host run is not enough.

Pass criteria:

- Probe cannot connect to public internet.
- DNS is unavailable or harmlessly blocked inside the sandbox.
- Production private networks are unreachable.
- The exact sandbox invocation is documented in the validation result.

Fail criteria:

- Executed code can reach the internet.
- Executed code can reach production private networks.
- No actual sandbox command exists.
- The proof is run only on the host, not inside the intended execution context.

## 7. Prototype Test Validation

Run the standalone prototype tests on the non-production worker VM after checkout:

```bash
python3 -m unittest discover tools/runner_prototype/tests
python3 tools/runner_prototype/run_cases.py
```

Pass criteria:

- Successful compile/run returns `accepted`.
- Wrong output returns `wrong_answer`.
- Syntax error returns `compile_error`.
- Non-zero runtime failure returns `runtime_error`.
- Infinite loop returns `time_limit`.
- Excess output returns `output_limit`.
- Parent secret env is not visible to executed code.
- Temporary workspaces are cleaned after success, failure and timeout.

Fail criteria:

- Any prototype test fails.
- Any run requires production data or credentials.
- User code execution is tested on the production app host.

## 8. Resource Limit Validation

Current standalone prototype covers compile timeout, run timeout, Linux process-group kill and stdout/stderr caps. RAM/memory limits must be enforced by the future sandbox or OS configuration; the Python harness alone does not prove memory isolation.

Run:

```bash
python3 -m unittest tools.runner_prototype.tests.test_runner.RunnerPrototypeTests.test_time_limit
python3 -m unittest tools.runner_prototype.tests.test_runner.RunnerPrototypeTests.test_output_limit
ulimit -a
ps -fu "$(whoami)"
df -h
```

Pass criteria:

- Infinite loop terminates as `time_limit`.
- Excessive stdout/stderr terminates as `output_limit`.
- Output is truncated to the configured cap.
- No child process remains after timeout.
- Disk usage remains stable after repeated failed runs.
- A future sandbox-level memory/RAM limit is documented before integration.

Fail criteria:

- Infinite loop survives after timeout.
- stdout/stderr can grow without bound.
- Process cleanup requires manual kill.
- Memory limit cannot be enforced or evidenced before integration.

## 9. Temp Cleanup Validation

Each run must use a fresh disposable workspace and delete it after success, compile failure, runtime error, timeout and output limit.

Run:

```bash
python3 -m unittest tools.runner_prototype.tests.test_runner.RunnerPrototypeTests.test_cleanup_after_success_failure_and_timeout
find /tmp -maxdepth 2 -type d -name '*uchicode*' -print
```

Pass criteria:

- No per-run temp directories remain after tests.
- No production paths are mounted into execution workspaces.
- Logs/results do not expose sensitive absolute paths.

Fail criteria:

- Failed or timed-out runs leave workspaces behind.
- User code can write outside its workspace.
- Prototype output leaks sensitive host paths.

## 10. Process Kill Validation

The worker gate must prove that timeout kills the process tree, not only the direct child process.

Run:

```bash
python3 -m unittest tools.runner_prototype.tests.test_runner.RunnerPrototypeTests.test_time_limit
pgrep -af uchicode || true
ps -fu "$(whoami)"
```

Pass criteria:

- Timeout returns `time_limit`.
- No child or helper process remains.
- Cleanup does not require manual intervention.

Fail criteria:

- Any compiled binary survives after timeout.
- Any orphan process remains.
- Operator must manually kill processes after validation.

## 11. Logging Rules

Allowed logs:

- Synthetic case name.
- Result status.
- Exit code.
- Compile/run duration.
- Timeout/output-limit flags.
- Bounded sanitized stderr/stdout summary for synthetic tests.
- Non-secret environment check result.
- Non-sensitive VM metadata from the validation result template.

Forbidden logs:

- Production secrets or env values.
- Production DB/Redis host credentials.
- Private keys or deploy keys.
- Hidden test input/output.
- Full submitted source in production-like logs.
- Uncapped compiler/runtime output.
- Production backup contents.
- Provider tokens.
- Sensitive absolute paths.

If a log contains forbidden data, treat validation as failed, remove the data from the worker/logs where safe, and do not copy it into the repository.

## 12. Piston Target Rules

Piston is the preferred future runner service target after this worker VM gate passes.

Rules:

- Piston must run only on the dedicated non-production worker VM during validation.
- Piston must not be installed on the production VPS.
- Piston must not be embedded into Django.
- Piston API must not be public.
- Piston must not connect to production DB, Redis, backups, deploy keys or `.env` files.
- Backend may later access Piston only through a reviewed runner adapter/client after validation gates pass.

This packet does not install Piston and does not approve API integration.

## 13. Rollback And Disable Procedure

For standalone VM validation:

1. Stop prototype or Piston validation processes.
2. Delete temporary workspaces if any remain.
3. Rebuild or delete the non-production worker VM if isolation is suspect.
4. Keep production unchanged.
5. Keep `CHECKER_EXECUTION_ENABLED=false`.

For future API-integrated runner:

1. Set `CHECKER_EXECUTION_ENABLED=false`.
2. Verify availability returns a fail-closed unavailable reason.
3. Stop runner intake.
4. Leave drafts and attempts intact.
5. Inspect runner logs outside the app container.
6. Do not delete production volumes.

## 14. Validation Result Template

Create a future validation report using this template. Do not include secrets, private keys, DB URLs, Redis URLs, provider tokens or private network details.

```text
# Runner Worker Validation Result

Date:
Operator:
Validated commit:

VM:
  Provider:
  Region:
  OS:
  vCPU/RAM/disk:
  Runner user:

Package versions:
  python3:
  g++:
  git:
  kernel:

Production separation:
  Production runtime remains:
  CHECKER_EXECUTION_ENABLED remains:
  Production task versions/hidden tests:
  API integration started: no
  Piston installed: no / yes, worker VM only

Commands run:
  - cat /etc/os-release
  - python3 -m unittest discover tools/runner_prototype/tests
  - python3 tools/runner_prototype/run_cases.py
  - no-secrets name-only env checks
  - no DB/Redis/private-network checks
  - no-network execution proof from sandbox context
  - temp cleanup checks
  - process kill checks
  - resource limit checks

Gate results:
  VM dedicated/non-production:
  Non-root runner user:
  No production env/secrets:
  No DB/Redis/private-network access:
  No-network proof for executed code:
  Prototype tests:
  Temp cleanup:
  Process kill:
  Output limit:
  Time limit:
  RAM/memory limit evidence:
  Logging rules:

Blockers:
  - none / list blockers here

Decision:
  APPROVED_FOR_API_INTEGRATION_PLANNING / BLOCKED
```

## 15. Acceptance Criteria

You may proceed to API-integrated runner planning only when all are true:

- Dedicated non-production worker VM is selected and documented.
- Latest approved `origin/main` commit is selected for validation and recorded.
- Prototype runs as non-root.
- No production env, secrets, deploy keys, DB credentials or backups are present.
- Worker cannot reach production DB, Redis or private app networks.
- Executed-code no-network proof passes from the actual sandbox context.
- Piston target, if installed later, is private to the worker VM and not on the production VPS.
- Temp cleanup passes after success, failure and timeout.
- Process kill/time-limit/output-limit tests pass.
- RAM/memory limit is configured and evidenced by the worker sandbox or OS before integration.
- Logs follow the allowed/forbidden rules.
- `CHECKER_EXECUTION_ENABLED` remains false in production.
- Production task versions and hidden tests remain absent during validation.

Do not proceed when any are true:

- Worker is the production VPS or production Docker host.
- Prototype needs root or production credentials.
- No-network cannot be proven.
- User code can reach production networks.
- Tests fail or leave orphaned processes/files.
- Production task versions or hidden tests are required for validation.
- Section 11/12 work is being mixed into runner work.

## 16. Blocked Before API Integration

These remain blocked until this packet is executed successfully on a dedicated worker VM:

- Piston installation.
- `PistonRunnerClient`.
- Queue worker.
- Real execution behind the checker API.
- Network calls from Django to a runner service.
- Creating production `CheckerTaskVersion` rows or hidden tests.
- Enabling `CHECKER_EXECUTION_ENABLED`.
- Public checker launch.
- Section 11/12 content work.
