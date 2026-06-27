# DEPLOY

Короткий entrypoint. Полные production-команды находятся в [deploy/docs/README.md](deploy/docs/README.md); не поддерживать их копию здесь.

## Safety Gate

- Deploy выполнять только по явному запросу и только из проверенного pushed commit.
- Перед update или rollback сделать `/opt/uchicode/backup.sh`; при ошибке backup остановиться.
- Проверить чистый local/VPS tree, fast-forward pull и совпадение выбранного hash.
- Не менять secrets, production env, volumes или history в обычном deploy.
- Не выполнять `docker compose down -v`.
- Frontend входит в nginx image, поэтому runtime frontend changes требуют rebuild.

## Runbooks

- Первый VPS deploy: [deploy/docs/02_DEPLOY_FROM_ZERO.md](deploy/docs/02_DEPLOY_FROM_ZERO.md).
- Update, rollback, hotfix: [deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md](deploy/docs/03_UPDATE_ROLLBACK_HOTFIX.md).
- Troubleshooting: [deploy/docs/04_TROUBLESHOOTING.md](deploy/docs/04_TROUBLESHOOTING.md).
- Production security/access: [deploy/docs/05_SECURITY_SECRETS_ACCESS.md](deploy/docs/05_SECURITY_SECRETS_ACCESS.md).
- Backup/restore: [deploy/docs/06_BACKUP_RESTORE.md](deploy/docs/06_BACKUP_RESTORE.md).
- Commands cheatsheet: [deploy/docs/07_COMMANDS_CHEATSHEET.md](deploy/docs/07_COMMANDS_CHEATSHEET.md).
- Post-deploy checks: [deploy/docs/09_POST_DEPLOY_CHECKLIST.md](deploy/docs/09_POST_DEPLOY_CHECKLIST.md), [SMOKE_TESTS.md](SMOKE_TESTS.md).

Перед deploy сверить current production state с фактическим VPS; документация без server check не является доказательством текущего `HEAD`.
