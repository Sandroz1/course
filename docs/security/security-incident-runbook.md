# Security incident runbook: env or secret leak

Use this when a real `.env*` file, private key, database dump or credential may have reached git, CI logs, chat, an artifact, or a shared machine.

## Rules

- Treat the value as compromised until rotation is complete.
- Do not paste, print, screenshot or copy secret values into tickets, chat, commit messages or logs.
- Do not push, deploy, rotate credentials, rewrite history or force-push without owner coordination.
- Do not delete local evidence before the impacted paths, commits and systems are recorded by filename and commit id only.

## Immediate triage

1. Stop new deploys from the affected branch until the owner confirms scope.
2. Check whether current git index tracks real env files by filename only:

```powershell
git ls-files | Where-Object { ($_ -match '(^|/)\\.env($|\\.)') -and ($_ -notmatch '\\.example$') }
```

3. Check whether history mentions env paths by filename only:

```powershell
git log --all --name-status --pretty=format:'COMMIT %h %s' -- '.env' '.env.*' 'backend/.env' 'backend/.env.*' 'site/.env' 'site/.env.*'
```

4. If a real env file is tracked in the current index, remove it from git without deleting the local file:

```powershell
git rm --cached --ignore-unmatch -- .env .env.production backend/.env site/.env
```

Adjust the path list to the actual tracked files.

## Rotate secrets

Rotate every credential that may have been exposed, even if the leak was short-lived:

- `DJANGO_SECRET_KEY`;
- database credentials and `DATABASE_URL`;
- `POSTGRES_PASSWORD`;
- Redis password or `REDIS_URL` if credentials are used;
- AI provider keys such as `QWEN_API_KEY`;
- SMS provider keys, logins and passwords;
- deploy keys, SSH keys, API tokens and webhook secrets;
- any credentials copied into CI, VPS env files or local screenshots.

For each provider, create a new credential, update the runtime config, verify the app, then revoke the old credential.

## Update VPS env and redeploy

Do this only from the deploy runbook and only after backup/coordination:

1. Run the production backup first.
2. Update the VPS env file in place on the server.
3. Validate config without printing values.
4. Redeploy.
5. Check health endpoints.
6. Confirm old credentials are revoked.
7. Review application and provider logs for suspicious use.

Do not enable long HSTS or change cookie semantics during incident cleanup unless that is a separate reviewed change. `CSRF_COOKIE_HTTPONLY` must not be enabled blindly because frontend CSRF flow can depend on reading the token.

## Clean git history

History cleanup is a separate coordinated operation:

1. Backup the repository and confirm every collaborator is aware.
2. Rotate secrets before rewriting history.
3. Use `git filter-repo` or BFG to remove the leaked paths or blobs.
4. Re-run secret scanning on the rewritten history.
5. Force-push only after coordination.
6. Tell every collaborator to re-clone or hard-reset from the rewritten remote.
7. Invalidate old forks, caches, CI artifacts and release archives where possible.

History cleanup does not replace rotation. Assume any pushed secret was copied.
