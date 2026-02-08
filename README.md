# PAC Extended

A simplified wrapper for the Power Platform CLI (PAC) that makes deployments easier.

## Installation

```bash
# Install globally
npm install -g pac-extended

# Or as a project dependency
npm install pac-extended --save-dev
```

## Quick Start

```bash
# Initialize your project (creates .env file)
pac-ext init

# Authenticate to your environment
pac-ext auth

# Clone your solution
pac-ext solution-clone

# Make changes, then deploy
pac-ext deploy
```

## Adding to Your Project

After installing, add these scripts to your project's `package.json`:

```json
{
  "scripts": {
    "pac:init": "pac-ext init",
    "pac:auth": "pac-ext auth",
    "pac:deploy": "pac-ext deploy",
    "pac:deploy:test": "pac-ext deploy --env test",
    "pac:deploy:prod": "pac-ext deploy --env prod",
    "pac:status": "pac-ext status",
    "pac:help": "pac-ext help"
  }
}
```

Then use: `npm run pac:deploy`

## Commands

| Command | Description |
|---------|-------------|
| `pac-ext init` | Initialize project, create .env configuration |
| `pac-ext auth` | Authenticate to default environment |
| `pac-ext auth-list` | List auth profiles |
| `pac-ext auth-clear` | Clear all auth profiles |
| `pac-ext env-list` | List available environments |
| `pac-ext env-select` | Select active environment |
| `pac-ext solution-list` | List solutions in current environment |
| `pac-ext solution-clone` | Clone solution from environment |
| `pac-ext solution-export` | Export solution as zip |
| `pac-ext solution-import` | Import solution zip |
| `pac-ext solution-unpack` | Unpack solution zip to source |
| `pac-ext solution-pack` | Pack source to solution zip |
| `pac-ext deploy` | Bump version, pack, and deploy |
| `pac-ext deploy --env test` | Deploy to test environment |
| `pac-ext deploy --env prod` | Deploy as managed to production |
| `pac-ext publish` | Publish all customizations |
| `pac-ext version-bump` | Bump solution version |
| `pac-ext pcf-init` | Initialize new PCF component |
| `pac-ext pcf-build` | Build PCF component |
| `pac-ext pcf-push` | Push PCF to environment |
| `pac-ext pcf-start` | Start PCF harness with live data proxy |
| `pac-ext proxy` | Start Dataverse proxy server |
| `pac-ext audit` | Compare environments (master vs targets) |
| `pac-ext plugin-init` | Initialize new plugin project |
| `pac-ext status` | Show configuration and auth status |
| `pac-ext help` | Show help |

## Configuration

Run `pac-ext init` to create a `.env` file with your settings:

```env
# Solution
SOLUTION_NAME=MySolution
SOLUTION_DISPLAY_NAME=My Solution
SOLUTION_PUBLISHER_PREFIX=new

# Environments
ENV_DEV_URL=https://yourorg-dev.crm.dynamics.com
ENV_TEST_URL=https://yourorg-test.crm.dynamics.com
ENV_PROD_URL=https://yourorg.crm.dynamics.com

# Deployment
DEFAULT_ENV=dev
AUTO_BUMP_VERSION=true
BUMP_TYPE=patch

# Paths
SOLUTION_OUTPUT_PATH=./solutions
SOLUTION_SOURCE_PATH=./src
```

## Workflows

### Initial Setup
```bash
pac-ext init      # Create .env with your settings
pac-ext auth      # Authenticate to environment
```

### Clone and Develop
```bash
pac-ext solution-clone    # Clone solution to ./src
# ... make changes ...
pac-ext deploy            # Deploy to dev (bumps version)
```

### Promote to Test/Prod
```bash
pac-ext deploy --env test    # Deploy to test
pac-ext deploy --env prod    # Deploy as managed to production
```

### PCF Component
```bash
pac-ext pcf-init             # Create new PCF component
cd MyComponent
npm install
npm run build
pac-ext pcf-push             # Push to environment
```

### PCF Development with Live Data
```bash
pac-ext pcf-start            # Starts harness + Dataverse proxy
```

This starts the PCF test harness with a local proxy that authenticates to your Dataverse environment. Your component can fetch real data during development.

```bash
# Or run proxy separately
pac-ext proxy                # Start proxy on port 3000
```

The proxy uses browser-based authentication (no client secret needed). First run opens a browser to sign in, then tokens are cached for subsequent runs.

**Proxy endpoints:**
- `http://localhost:3000/api/data/v9.2/...` - Proxied Dataverse API
- `http://localhost:3000/_proxy/whoami` - Current user info

## Environment Audit

Compare a master/baseline environment against one or more target environments to find differences.

### Usage

```bash
# Compare prod (master) against dev and test
pac-ext audit --master prod --compare dev test

# Compare dev against test only
pac-ext audit --master dev --compare test

# Save report to HTML and JSON (opens in browser)
pac-ext audit --master prod --compare dev test --save

# Deep mode - compare table columns (type, length, required, precision)
pac-ext audit --master prod --compare dev test --deep

# Use full URLs
pac-ext audit --master https://org-prod.crm.dynamics.com \
              --compare https://org-dev.crm.dynamics.com \
                        https://org-test.crm.dynamics.com
```

### What Gets Compared

| Category | Details |
|----------|---------|
| Solutions | Names and version numbers |
| Environment Variables | Values across environments |
| Plugins | Assembly names and versions |
| Web Resources | Presence/absence |
| Custom Tables | Presence/absence |
| Workflows | Cloud flows and classic workflows |
| Security Roles | Role names |
| Connection References | Connection types |
| Canvas Apps | App names |

### Deep Mode (--deep)

When using `--deep`, the audit also compares table column schemas:

| Column Property | Description |
|-----------------|-------------|
| Type | Data type (String, Integer, DateTime, etc.) |
| MaxLength | Maximum length for text fields |
| Required | Required level (None, Recommended, Required) |
| Precision | Decimal precision for number fields |

This helps identify schema drift where column properties have changed between environments.

### Sample Output

```
═══════════════════════════════════════════════════════════════════════
  ENVIRONMENT AUDIT REPORT
  Master: prod
═══════════════════════════════════════════════════════════════════════

Solutions
──────────────────────────────────────────────────────────────────────
  Item                           Master          dev             Status
  MySolution                     2026.2.9.1      2026.2.8.1      !
  NewFeature                     1.0.0.0         -               ✗
──────────────────────────────────────────────────────────────────────
  ✓ 15 match  ! 2 differ  ✗ 1 missing  + 0 extra

Environment Variables
──────────────────────────────────────────────────────────────────────
  ApiEndpoint                    https://prod    https://dev     !
──────────────────────────────────────────────────────────────────────
  ✓ 8 match  ! 1 differ  ✗ 0 missing  + 0 extra

═══════════════════════════════════════════════════════════════════════
  ! Found 4 differences across environments
═══════════════════════════════════════════════════════════════════════
```

**Legend:**
- `✓` Match - Same in master and target
- `!` Differ - Different version/value
- `✗` Missing - In master but not in target
- `+` Extra - In target but not in master

## Features

- **Auto version bump** - Each deploy increments version automatically
- **Version formats** - Semantic (1.0.0.0), date-based (2024.02.08.1), or year-based (2024.1.0.0)
- **Environment aliases** - Use `dev`, `test`, `prod` instead of URLs
- **Smart defaults** - Production deploys use managed solutions
- **One command deploy** - `deploy` does bump + pack + import + publish
- **PCF live data** - Develop PCF components with real Dataverse data
- **Environment audit** - Compare solutions, variables, plugins across environments
- **Deep audit mode** - Compare table column schemas (type, length, required, precision)
- **Browser auth** - No client secrets needed, authenticates as you

## Requirements

- Node.js 16+
- Power Platform CLI (`pac`) installed and in PATH
- Valid Power Platform environment access

## License

MIT
