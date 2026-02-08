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

## Features

- **Auto version bump** - Each deploy increments version automatically
- **Environment aliases** - Use `dev`, `test`, `prod` instead of URLs
- **Smart defaults** - Production deploys use managed solutions
- **One command deploy** - `deploy` does bump + pack + import + publish

## Requirements

- Node.js 16+
- Power Platform CLI (`pac`) installed and in PATH
- Valid Power Platform environment access

## License

MIT
