# Codex Agent Skills

Codex skills provide reusable agent instructions. They are not Python/npm dependencies and are not shipped with the Uchicode application.

## External Skills

External skills are installed globally for the local Codex environment and are not committed to this repository.

| Skill | Source | Purpose | Install command | Risk note |
| --- | --- | --- | --- | --- |
| `find-skills` | `vercel-labs/skills` | Discover and inspect future skills. | `npx.cmd skills add vercel-labs/skills --skill find-skills -g --agent codex -y` | CLI assessment: no alerts; review every discovered skill before installation. |
| `accessibility` | `addyosmani/web-quality-skills` | WCAG 2.2 accessibility review for the React UI. | `npx.cmd skills add addyosmani/web-quality-skills --skill accessibility -g --agent codex -y` | Guidance-only; automated checks do not replace keyboard/screen-reader QA. |
| `django-expert` | `vintasoftware/django-ai-plugins` | Django/DRF models, APIs, tests, ORM, and migration guidance. | `npx.cmd skills add vintasoftware/django-ai-plugins --skill django-expert -g --agent codex -y` | General advice remains subordinate to Uchicode architecture and deploy rules. |

The CLI installs Codex global skills under the user profile (`~/.codex/skills` or its managed shared `~/.agents/skills` copy). Check current locations with:

```powershell
npx.cmd skills list -g --json
npx.cmd skills check
```

React performance, browser testing, and security are already covered by the configured Vercel/build-web-apps, Playwright/browser, and Codex Security capabilities. Extra external duplicates were intentionally not installed. No sufficiently focused, reputable Docker/deploy skill was added; Uchicode's production runbooks and local deploy skill are safer for this repository.

## Project Skills

Codex project skills live in `.agents/skills/`, the project-local path recognized by the current Skills CLI for Codex:

- `uchicode-project-guardrails`: architecture, scope, Git, checks, and production boundaries for all repository work.
- `uchicode-checker-runner`: checker data, statuses, hidden-data protection, DisabledRunner, Piston, and worker safety.
- `uchicode-frontend-quality`: React/TypeScript, accessibility, responsive UI, themes, editor, and honest checker UX.
- `uchicode-deploy-safety`: backup, deploy, migrations, health, smoke tests, and rollback.

These files are committed so every contributor receives the same Uchicode-specific guardrails.

## Maintenance

```powershell
npx.cmd skills check
npx.cmd skills update -g
npx.cmd skills list --json
```

Before adding a third-party skill:

1. Search with `npx.cmd skills find <topic>`.
2. Prefer official framework/tool authors or established engineering organizations.
3. Read the skill and any scripts; reject broad production, secret, or destructive access.
4. Avoid overlap with installed skills and repository-specific instructions.
5. Install external skills globally with `-g --agent codex`; do not commit downloaded third-party files.
6. Run `npx.cmd skills check` and record the source and risk in this document.

Create a project skill only for stable Uchicode-specific knowledge. Keep its `SKILL.md` concise, include `name` and triggering `description` frontmatter, place it under `.agents/skills/<name>/`, and validate it before commit.
