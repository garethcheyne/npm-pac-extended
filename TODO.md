# PAC Extended - Roadmap

## Completed ✅

### Audit Features
- [x] `audit` - Compare environments (master vs targets)
- [x] `audit --all` - Compare against all numbered environments
- [x] `audit --deep` - Include table column comparison
- [x] HTML reports with Power Platform branding

### User & Security Features
- [x] `user-audit` - Audit user permissions and roles
- [x] `user-audit --all` - Audit all numbered environments
- [x] Team membership tracking (Owner, Access, AAD Security, AAD Office groups)
- [x] Show team names per user (not just count)
- [x] Hide disabled users toggle in HTML reports
- [x] `role-cleanup` - Remove direct role assignments

### Solution Management
- [x] `solution-delete` - Delete solutions from environments
- [x] `solution-purge` - Deep delete unmanaged solutions (components first)
- [x] `--all` flag for multi-environment operations
- [x] `--dry-run` for previewing changes

### Developer Experience
- [x] TypeScript migration with strict mode
- [x] 101 unit tests with Jest
- [x] Official Microsoft Power Platform logo in reports
- [x] Numbered environment support (ENV_TEST_URL_01, etc.)

## In Progress 🚧

### PCF Features
- [ ] `pcf-start` - Start test harness for local development
- [ ] `pcf-watch` - Watch mode, rebuild on changes
- [ ] `pcf-version` - Bump ControlManifest version
- [ ] `pcf-add-react` - Add React framework to component
- [ ] `pcf-clean` - Clean build artifacts
- [ ] `pcf-package` - Package PCF into solution for deployment

## Backlog 📋

### Solution Features
- [ ] `solution-diff` - Compare local vs environment
- [ ] `solution-backup` - Export with timestamp
- [ ] `solution-rollback` - Import previous version
- [ ] `solution-validate` - Check for common issues
- [ ] `solution-watch` - Auto-deploy on changes

### Plugin Features
- [ ] `plugin-build` - Build plugin project
- [ ] `plugin-register` - Register plugin steps
- [ ] `plugin-deploy` - Deploy plugin assembly

### Environment Features
- [ ] `env-create` - Create new environment
- [ ] `env-copy` - Copy environment
- [ ] `env-delete` - Delete environment

### Data Features
- [ ] `data-export` - Export data
- [ ] `data-import` - Import data

### General
- [ ] Config profiles (switch between projects)
- [ ] Verbose/debug logging option
- [ ] CI/CD integration examples
- [ ] GitHub Actions workflow templates

## Not Planned ❌

- `user-purge` - Delete disabled users (too dangerous, use Power Platform Admin Center instead)
