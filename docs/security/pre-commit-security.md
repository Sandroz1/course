# Pre-commit security checks

Use this before committing changes that touch env files, deploy docs, Docker, backend settings, CI, backups or auth/security code.

## Do not commit

- Real `.env*` files.
- Private keys: `*.pem`, `*.key`, `*.p8`, `*.p12`, `*.pfx`, `*.ppk`, `id_rsa*`, `id_ed25519*`.
- Local databases: `db.sqlite3`, `*.sqlite`, `*.sqlite3`, `*.db`.
- Dumps and backups: `*.sql`, `*.dump`, `*.bak`, `*.backup`, `*.tar`, `*.tar.gz`, `*.tgz`, `backup/`, `backups/`.
- Provider credentials: Django, database, Redis, AI, SMS, deploy, GitHub or VPS tokens.

Only placeholder templates such as `.env.example` and `.env.production.example` may be committed.

## Filename checks

Run from repository root:

```powershell
git status -sb
git diff --cached --name-only
git ls-files | Where-Object { ($_ -match '(^|/)\\.env($|\\.)') -and ($_ -notmatch '\\.example$') }
git diff --cached --name-only | Where-Object { $_ -match '(^|/)\\.env($|\\.)|\\.pem$|\\.key$|\\.p8$|\\.p12$|\\.pfx$|\\.ppk$|id_rsa|id_ed25519|\\.sqlite3?$|\\.db$|\\.sql$|\\.dump$|\\.bak$|\\.backup$|\\.tar(\\.gz)?$|\\.tgz$|(^|/)backups?/' }
git diff --check
```

The env/key/database/backup commands should return no real secret files.

## Content checks

Use a scanner that redacts values. Recommended options:

```powershell
gitleaks detect --redact --source .
```

If `gitleaks` is unavailable, inspect only staged file names and changed lines locally. Do not paste suspicious lines into chat or docs. For suspicious staged files, unstage them first:

```powershell
git restore --staged -- <path>
```

Then move real secrets to a local ignored env file and keep only placeholders in committed examples.

## Example file rules

- Use names like `change-me-placeholder`, `example`, `localhost`, `/api`, or empty values.
- Do not include production domains unless the value is public and intentional.
- Do not include working provider keys, database URLs, passwords or private tokens.
- Frontend env must contain only safe `VITE_*` values because they can be bundled into browser code.

## If a secret was staged or committed

1. Stop and do not push.
2. Remove the file from the index with `git rm --cached -- <path>` if the local file must stay.
3. Replace committed content with placeholders.
4. Follow [security-incident-runbook.md](security-incident-runbook.md) if the secret was committed, pushed, shared, logged or exposed outside the local machine.
