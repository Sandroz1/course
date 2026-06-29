# Runner Worker Provisioning And Security Checklist

Status: required docs-only gate before API-integrated runner work. This document is for a dedicated non-production Linux worker VM used to validate the standalone runner prototype in `tools/runner_prototype/`.

This checklist does not approve production execution. It does not add a queue, Django endpoint, hidden tests, production task versions or `CHECKER_EXECUTION_ENABLED=true`.

## Scope

The worker VM must be:

- dedicated to runner prototype validation;
- Linux-only, preferably a current LTS distribution;
- non-production;
- separate from the production VPS and Docker host;
- separate from Django, PostgreSQL, Redis, nginx and backups;
- reachable only by developers who need to run the prototype;
- disposable: it can be rebuilt without touching production data.

The worker VM must not contain:

- production `.env` files;
- database, Redis, deploy, provider or AI credentials;
- production backups;
- SSH deploy keys for the production app;
- access to production private networks;
- production `CheckerTaskVersion` rows or hidden tests.

## Required Packages

Minimum packages:

```bash
python3 --version
g++ --version
git --version
```

The prototype itself uses Python stdlib only. Do not add Python package dependencies for this stage.

Recommended OS tools for validation:

```bash
ip --version
ss --version
timeout --version
```

If a command is unavailable, install the smallest OS package that provides it. Do not install app dependencies, database clients or production tooling unless a later reviewed task requires them.

## Runner User

Create a non-root runner user for prototype execution. Example name: `uchicode-runner`.

Acceptance checks:

```bash
id
whoami
groups
sudo -l
```

Pass criteria:

- the prototype is run as the non-root runner user;
- the runner user does not have passwordless broad sudo;
- the runner user is not in `docker`, `sudo`, `adm` or other privileged groups;
- no Docker socket or host admin socket is mounted into the runner context.

Fail criteria:

- the prototype requires root;
- user code runs with root privileges;
- the worker user can administer production infrastructure.

## No Production Env Or Secrets

Do not print secret values. Only check names, paths and presence.

Run from the runner user shell:

```bash
env | sort | grep -Ei 'secret|token|password|passwd|key|credential|database|postgres|redis|django|openai|deploy|backup' || true
find "$HOME" -maxdepth 4 -type f \( -name ".env*" -o -iname "*secret*" -o -iname "*token*" -o -iname "*key*" -o -iname "*credential*" \) -print
test ! -f .env
test ! -f .env.production
```

Pass criteria:

- no production-like secret env variable names are present;
- no `.env` / `.env.production` files are present in the prototype checkout or runner home;
- no production deploy keys or backup credentials are present.

Fail criteria:

- production env files or credentials exist on the worker;
- prototype execution needs a production secret;
- logs contain secret values.

## No Production DB, Redis Or Private Network Access

The worker VM must have no route to production PostgreSQL, Redis, app containers or private service networks.

Baseline checks:

```bash
ip addr
ip route
ss -ltnp
env | grep -Ei 'postgres|database|redis|django|db_|redis_' || true
```

If production private hostnames or IPs are known, verify that TCP access fails without using credentials:

```bash
timeout 3 bash -lc '</dev/tcp/<production-db-host-or-ip>/5432' && exit 1 || true
timeout 3 bash -lc '</dev/tcp/<production-redis-host-or-ip>/6379' && exit 1 || true
timeout 3 bash -lc '</dev/tcp/<production-vps-private-ip>/22' && exit 1 || true
```

Pass criteria:

- there is no VPN, peering, security-group rule or route into production private networks;
- DB/Redis ports are unreachable from the worker;
- no production DB/Redis env names exist.

Fail criteria:

- worker can reach production DB/Redis/private app network;
- worker has production credentials even if the network path is blocked.

## No-Network Proof For Executed Code

The current Python prototype does not prove no-network isolation by itself. No-network must be enforced by the worker VM/container/firewall/sandbox layer that will later run compiled user code.

Before API-integrated runner work, execute a network probe from the exact sandbox context used for the compiled binary. Example probe:

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
# Run the binary inside the same sandbox/network namespace planned for user code.
```

Pass criteria:

- the probe cannot connect to the public internet;
- DNS is unavailable or harmlessly blocked inside the sandbox;
- production private networks are unreachable;
- the proof command is documented with the exact sandbox invocation.

Fail criteria:

- executed code can reach the internet;
- executed code can reach production private networks;
- no-network cannot be tested from the actual execution context.

## Temp Workspace And Filesystem Rules

Each run must use a fresh disposable workspace and delete it after success, compile failure, runtime error, timeout and output limit.

Validation:

```bash
python3 -m unittest tools.runner_prototype.tests.test_runner.RunnerPrototypeTests.test_cleanup_after_success_failure_and_timeout
```

Pass criteria:

- no per-run temp directories remain after tests;
- no production paths are mounted into execution workspaces;
- logs/results do not expose sensitive absolute paths.

Fail criteria:

- failed or timed-out runs leave workspaces behind;
- user code can write outside its workspace;
- prototype output leaks sensitive host paths.

## Process Kill And Resource Limits

The worker gate must demonstrate runtime controls before API integration. Current prototype tests cover:

- compile timeout;
- runtime timeout;
- Linux process-group kill;
- stdout/stderr output cap.

RAM/memory limits must be enforced and evidenced by the worker sandbox or OS configuration. The standalone Python prototype does not prove memory isolation by itself.

Validation:

```bash
python3 -m unittest tools.runner_prototype.tests.test_runner.RunnerPrototypeTests.test_time_limit
python3 -m unittest tools.runner_prototype.tests.test_runner.RunnerPrototypeTests.test_output_limit
python3 tools/runner_prototype/run_cases.py
```

Recommended operator checks:

```bash
ulimit -a
ps -fu "$(whoami)"
df -h
```

Pass criteria:

- infinite loop returns `time_limit`;
- excessive output returns `output_limit`;
- output is truncated to the configured cap;
- no child process remains after timeout;
- VM disk does not grow after repeated failed runs.

Fail criteria:

- infinite loop survives after timeout;
- stdout/stderr can grow without bound;
- process cleanup requires manual kill.

## Logging Rules

Allowed logs:

- synthetic case name;
- result status;
- exit code;
- compile/run duration;
- timeout/output-limit flags;
- bounded sanitized stderr/stdout summary for synthetic tests;
- non-secret environment check result.

Forbidden logs:

- production secrets or env values;
- production DB/Redis host credentials;
- hidden tests;
- full submitted source in production-like logs;
- uncapped compiler/runtime output;
- production backup paths, deploy keys or provider tokens.

## Health Checks

Worker readiness checks:

```bash
python3 --version
g++ --version
python3 -m unittest discover tools/runner_prototype/tests
python3 tools/runner_prototype/run_cases.py
```

Operational checks before later API integration:

- runner process can report ready/unready;
- failed health makes checker fail closed;
- disabling execution does not delete drafts or attempts;
- logs are available without exposing source, hidden tests or secrets.

## Rollback And Disable Procedure

For prototype:

1. Stop running prototype processes.
2. Delete temporary workspaces if any remain.
3. Rebuild or delete the non-production worker VM if isolation is suspect.
4. Keep production unchanged.

For future API-integrated runner:

1. Set `CHECKER_EXECUTION_ENABLED=false`.
2. Verify availability returns a fail-closed unavailable reason.
3. Stop runner intake.
4. Leave drafts and attempts intact.
5. Inspect runner logs outside the app container.
6. Do not delete production volumes.

## Acceptance Criteria

You may proceed to API-integrated runner planning only when all are true:

- dedicated non-production worker VM is selected and documented;
- prototype runs as non-root;
- no production env, secrets, deploy keys, DB credentials or backups are present;
- worker cannot reach production DB, Redis or private app networks;
- executed code no-network proof passes from the actual sandbox context;
- temp cleanup passes after success, failure and timeout;
- process kill/time-limit/output-limit tests pass;
- RAM/memory limit is configured and evidenced by the worker sandbox or OS before integration;
- logs follow the allowed/forbidden rules;
- backend status enum mismatch has a concrete cleanup plan before integration;
- `CHECKER_EXECUTION_ENABLED` remains false in production.

Do not proceed when any are true:

- worker is the production VPS or production Docker host;
- prototype needs root or production credentials;
- no-network cannot be proven;
- user code can reach production networks;
- tests fail or leave orphaned processes/files;
- production task versions or hidden tests are required for validation;
- section 11/12 work is being mixed into runner work.
