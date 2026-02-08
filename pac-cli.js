#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load .env if exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config();
}

// ANSI colors (no dependency needed for basic colors)
const colors = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

const log = {
  info: (msg) => console.log(colors.blue('i'), msg),
  success: (msg) => console.log(colors.green('✓'), msg),
  error: (msg) => console.log(colors.red('✗'), msg),
  warn: (msg) => console.log(colors.yellow('!'), msg),
  title: (msg) => console.log('\n' + colors.bold(colors.cyan(msg))),
};

// Helper to run PAC commands
function runPac(args, options = {}) {
  const cmd = `pac ${args}`;
  log.info(colors.dim(`Running: ${cmd}`));
  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      log.error(`Command failed: ${cmd}`);
      if (error.stderr) console.error(error.stderr);
    }
    throw error;
  }
}

// Simple prompt helper
async function prompt(question, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const q = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(q, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

async function promptYN(question, defaultYes = true) {
  const answer = await prompt(`${question} (${defaultYes ? 'Y/n' : 'y/N'})`);
  if (!answer) return defaultYes;
  return answer.toLowerCase().startsWith('y');
}

// ============================================================================
// COMMANDS
// ============================================================================

async function cmdInit() {
  log.title('PAC Extended - Initialize Project');

  console.log('\nThis will create a .env file with your environment configuration.\n');

  const config = {
    // Solution settings
    SOLUTION_NAME: await prompt('Solution unique name'),
    SOLUTION_DISPLAY_NAME: await prompt('Solution display name'),
    SOLUTION_PUBLISHER_PREFIX: await prompt('Publisher prefix', 'new'),

    // Environment URLs
    ENV_DEV_URL: await prompt('Development environment URL'),
    ENV_TEST_URL: await prompt('Test environment URL'),
    ENV_PROD_URL: await prompt('Production environment URL'),

    // Default settings
    DEFAULT_ENV: await prompt('Default environment (dev/test/prod)', 'dev'),
    AUTO_BUMP_VERSION: await prompt('Auto bump version on deploy? (true/false)', 'true'),
    BUMP_TYPE: await prompt('Version bump type (patch/minor/major)', 'patch'),

    // Paths
    SOLUTION_OUTPUT_PATH: await prompt('Solution output folder', './solutions'),
    SOLUTION_SOURCE_PATH: await prompt('Solution source folder', './src'),
  };

  // Create .env content
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const fullEnvContent = `# PAC Extended Configuration
# Generated on ${new Date().toISOString()}

# ============================================================================
# SOLUTION SETTINGS
# ============================================================================
SOLUTION_NAME=${config.SOLUTION_NAME}
SOLUTION_DISPLAY_NAME=${config.SOLUTION_DISPLAY_NAME}
SOLUTION_PUBLISHER_PREFIX=${config.SOLUTION_PUBLISHER_PREFIX}

# ============================================================================
# ENVIRONMENT URLS
# ============================================================================
# Format: https://yourorg.crm.dynamics.com
ENV_DEV_URL=${config.ENV_DEV_URL}
ENV_TEST_URL=${config.ENV_TEST_URL}
ENV_PROD_URL=${config.ENV_PROD_URL}

# ============================================================================
# DEPLOYMENT SETTINGS
# ============================================================================
# Default environment to deploy to (dev/test/prod)
DEFAULT_ENV=${config.DEFAULT_ENV}

# Automatically bump version on deploy
AUTO_BUMP_VERSION=${config.AUTO_BUMP_VERSION}

# Version bump type: patch (1.0.X), minor (1.X.0), major (X.0.0)
BUMP_TYPE=${config.BUMP_TYPE}

# ============================================================================
# PATHS
# ============================================================================
# Where to save exported solutions
SOLUTION_OUTPUT_PATH=${config.SOLUTION_OUTPUT_PATH}

# Where solution source files are unpacked
SOLUTION_SOURCE_PATH=${config.SOLUTION_SOURCE_PATH}
`;

  fs.writeFileSync('.env', fullEnvContent);
  log.success('.env file created!');

  // Create directories
  const dirs = [config.SOLUTION_OUTPUT_PATH, config.SOLUTION_SOURCE_PATH];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log.success(`Created directory: ${dir}`);
    }
  });

  // Create .gitignore if not exists
  if (!fs.existsSync('.gitignore')) {
    fs.writeFileSync('.gitignore', `.env
node_modules/
solutions/*.zip
*.log
`);
    log.success('.gitignore created');
  }

  console.log('\n' + colors.green('Initialization complete!'));
  console.log('\nNext steps:');
  console.log('  1. Run ' + colors.cyan('npm install') + ' to install dependencies');
  console.log('  2. Run ' + colors.cyan('npm run pac:auth') + ' to authenticate');
  console.log('  3. Run ' + colors.cyan('npm run pac:help') + ' to see all commands');
}

function cmdAuth() {
  log.title('PAC - Authenticate');
  const env = getEnvUrl(process.env.DEFAULT_ENV || 'dev');

  if (env) {
    log.info(`Authenticating to: ${env}`);
    runPac(`auth create --environment "${env}"`);
  } else {
    log.info('Opening browser for interactive authentication...');
    runPac('auth create');
  }
}

function cmdAuthList() {
  log.title('PAC - Auth Profiles');
  runPac('auth list');
}

function cmdAuthClear() {
  log.title('PAC - Clear Auth');
  runPac('auth clear');
  log.success('All auth profiles cleared');
}

function cmdEnvList() {
  log.title('PAC - Environments');
  runPac('org list');
}

function cmdEnvSelect() {
  log.title('PAC - Select Environment');
  const envArg = process.argv[3];
  const env = getEnvUrl(envArg);

  if (env) {
    runPac(`org select --environment "${env}"`);
    log.success(`Selected environment: ${env}`);
  } else {
    log.error('Please specify environment: dev, test, or prod');
    log.info('Or run: npm run pac:env:list to see available environments');
  }
}

function cmdSolutionList() {
  log.title('PAC - Solutions');
  runPac('solution list');
}

async function cmdSolutionClone() {
  log.title('PAC - Clone Solution');

  const solutionName = process.env.SOLUTION_NAME || await prompt('Solution name');
  const outputPath = process.env.SOLUTION_SOURCE_PATH || './src';

  runPac(`solution clone --name "${solutionName}" --outputDirectory "${outputPath}"`);
  log.success(`Solution cloned to ${outputPath}`);
}

async function cmdSolutionExport() {
  log.title('PAC - Export Solution');

  const solutionName = process.env.SOLUTION_NAME || await prompt('Solution name');
  const outputPath = process.env.SOLUTION_OUTPUT_PATH || './solutions';
  const managed = process.argv.includes('--managed');

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${solutionName}_${timestamp}${managed ? '_managed' : ''}.zip`;
  const filePath = path.join(outputPath, fileName);

  const args = `solution export --name "${solutionName}" --path "${filePath}"${managed ? ' --managed' : ''}`;
  runPac(args);

  log.success(`Solution exported to: ${filePath}`);
}

async function cmdSolutionImport() {
  log.title('PAC - Import Solution');

  let solutionPath = process.argv[3];

  if (!solutionPath) {
    // Find most recent solution file
    const outputPath = process.env.SOLUTION_OUTPUT_PATH || './solutions';
    if (fs.existsSync(outputPath)) {
      const files = fs.readdirSync(outputPath)
        .filter(f => f.endsWith('.zip'))
        .map(f => ({ name: f, time: fs.statSync(path.join(outputPath, f)).mtime }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        solutionPath = path.join(outputPath, files[0].name);
        log.info(`Using most recent solution: ${files[0].name}`);
      }
    }
  }

  if (!solutionPath) {
    log.error('No solution file specified and no solutions found in output folder');
    return;
  }

  runPac(`solution import --path "${solutionPath}"`);
  log.success('Solution imported!');
}

function cmdSolutionUnpack() {
  log.title('PAC - Unpack Solution');

  const solutionZip = process.argv[3];
  const outputPath = process.env.SOLUTION_SOURCE_PATH || './src';

  if (!solutionZip) {
    log.error('Please specify solution zip file');
    log.info('Usage: npm run pac:solution:unpack <path-to-solution.zip>');
    return;
  }

  runPac(`solution unpack --zipfile "${solutionZip}" --folder "${outputPath}"`);
  log.success(`Solution unpacked to: ${outputPath}`);
}

function cmdSolutionPack() {
  log.title('PAC - Pack Solution');

  const sourcePath = process.env.SOLUTION_SOURCE_PATH || './src';
  const outputPath = process.env.SOLUTION_OUTPUT_PATH || './solutions';
  const solutionName = process.env.SOLUTION_NAME || 'solution';
  const managed = process.argv.includes('--managed');

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${solutionName}_${timestamp}${managed ? '_managed' : ''}.zip`;
  const filePath = path.join(outputPath, fileName);

  const args = `solution pack --folder "${sourcePath}" --zipfile "${filePath}"${managed ? ' --packagetype Managed' : ''}`;
  runPac(args);

  log.success(`Solution packed to: ${filePath}`);
}

async function cmdDeploy() {
  log.title('PAC - Deploy Solution');

  // Determine target environment
  let targetEnv = process.env.DEFAULT_ENV || 'dev';
  const envArg = process.argv.find(a => a.startsWith('--env=') || a.startsWith('--env '));
  if (envArg) {
    targetEnv = envArg.split('=')[1] || process.argv[process.argv.indexOf('--env') + 1];
  } else if (process.argv.includes('--env')) {
    targetEnv = process.argv[process.argv.indexOf('--env') + 1];
  }

  const envUrl = getEnvUrl(targetEnv);
  if (!envUrl) {
    log.error(`Environment URL not configured for: ${targetEnv}`);
    log.info('Run npm run pac:init to configure environments');
    return;
  }

  log.info(`Target environment: ${targetEnv} (${envUrl})`);

  // Bump version if enabled
  if (process.env.AUTO_BUMP_VERSION === 'true') {
    await cmdVersionBump();
  }

  // Select the target environment
  log.info('Selecting target environment...');
  try {
    runPac(`org select --environment "${envUrl}"`, { silent: true });
  } catch (e) {
    log.warn('Could not select environment, trying to authenticate...');
    runPac(`auth create --environment "${envUrl}"`);
  }

  // Pack the solution
  log.info('Packing solution...');
  const sourcePath = process.env.SOLUTION_SOURCE_PATH || './src';
  const outputPath = process.env.SOLUTION_OUTPUT_PATH || './solutions';
  const solutionName = process.env.SOLUTION_NAME || 'solution';
  const managed = targetEnv === 'prod';

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const fileName = `${solutionName}_deploy${managed ? '_managed' : ''}.zip`;
  const filePath = path.join(outputPath, fileName);

  runPac(`solution pack --folder "${sourcePath}" --zipfile "${filePath}"${managed ? ' --packagetype Managed' : ''}`);

  // Import the solution
  log.info('Importing solution...');
  runPac(`solution import --path "${filePath}" --publish-changes`);

  log.success(`Deployed to ${targetEnv}!`);
}

function cmdPublish() {
  log.title('PAC - Publish Customizations');
  runPac('solution publish');
  log.success('All customizations published!');
}

async function cmdVersionBump() {
  log.title('PAC - Bump Version');

  const sourcePath = process.env.SOLUTION_SOURCE_PATH || './src';
  const solutionXmlPath = path.join(sourcePath, 'Other', 'Solution.xml');

  if (!fs.existsSync(solutionXmlPath)) {
    log.warn('Solution.xml not found. Skipping version bump.');
    return;
  }

  let content = fs.readFileSync(solutionXmlPath, 'utf-8');
  const versionMatch = content.match(/<Version>(\d+)\.(\d+)\.(\d+)\.(\d+)<\/Version>/);

  if (!versionMatch) {
    log.warn('Version tag not found in Solution.xml');
    return;
  }

  let [, major, minor, build, revision] = versionMatch.map(Number);
  const bumpType = process.env.BUMP_TYPE || 'patch';

  switch (bumpType) {
    case 'major':
      major++;
      minor = 0;
      build = 0;
      revision = 0;
      break;
    case 'minor':
      minor++;
      build = 0;
      revision = 0;
      break;
    case 'patch':
    default:
      build++;
      revision = 0;
      break;
  }

  const oldVersion = versionMatch[0];
  const newVersion = `<Version>${major}.${minor}.${build}.${revision}</Version>`;
  content = content.replace(oldVersion, newVersion);

  fs.writeFileSync(solutionXmlPath, content);
  log.success(`Version bumped: ${versionMatch[0].replace(/<\/?Version>/g, '')} -> ${major}.${minor}.${build}.${revision}`);
}

function cmdStatus() {
  log.title('PAC - Status');

  console.log('\n' + colors.bold('Configuration:'));
  console.log('  Solution:', process.env.SOLUTION_NAME || colors.dim('(not set)'));
  console.log('  Default Env:', process.env.DEFAULT_ENV || colors.dim('(not set)'));
  console.log('  Auto Bump:', process.env.AUTO_BUMP_VERSION || colors.dim('(not set)'));

  console.log('\n' + colors.bold('Environments:'));
  console.log('  Dev:', process.env.ENV_DEV_URL || colors.dim('(not set)'));
  console.log('  Test:', process.env.ENV_TEST_URL || colors.dim('(not set)'));
  console.log('  Prod:', process.env.ENV_PROD_URL || colors.dim('(not set)'));

  console.log('\n' + colors.bold('Auth Profiles:'));
  try {
    runPac('auth list');
  } catch (e) {
    log.warn('Could not retrieve auth profiles');
  }
}

function cmdHelp() {
  log.title('PAC Extended - Commands');

  const commands = [
    { cmd: 'pac:init', desc: 'Initialize project, create .env configuration' },
    { cmd: 'pac:auth', desc: 'Authenticate to default environment' },
    { cmd: 'pac:auth:list', desc: 'List auth profiles' },
    { cmd: 'pac:auth:clear', desc: 'Clear all auth profiles' },
    { cmd: 'pac:env:list', desc: 'List available environments' },
    { cmd: 'pac:env:select', desc: 'Select active environment (dev/test/prod)' },
    { cmd: 'pac:solution:list', desc: 'List solutions in current environment' },
    { cmd: 'pac:solution:clone', desc: 'Clone solution from environment' },
    { cmd: 'pac:solution:export', desc: 'Export solution as zip' },
    { cmd: 'pac:solution:import', desc: 'Import solution zip' },
    { cmd: 'pac:solution:unpack', desc: 'Unpack solution zip to source' },
    { cmd: 'pac:solution:pack', desc: 'Pack source to solution zip' },
    { cmd: 'pac:deploy', desc: 'Bump version, pack, and deploy to default env' },
    { cmd: 'pac:deploy:test', desc: 'Deploy to test environment' },
    { cmd: 'pac:deploy:prod', desc: 'Deploy as managed to production' },
    { cmd: 'pac:publish', desc: 'Publish all customizations' },
    { cmd: 'pac:version:bump', desc: 'Bump solution version' },
    { cmd: 'pac:status', desc: 'Show current configuration and auth status' },
    { cmd: 'pac:help', desc: 'Show this help' },
  ];

  console.log('\n' + colors.bold('Available Commands:'));
  console.log();

  const maxLen = Math.max(...commands.map(c => c.cmd.length));
  commands.forEach(({ cmd, desc }) => {
    console.log(`  npm run ${colors.cyan(cmd.padEnd(maxLen))}  ${desc}`);
  });

  console.log('\n' + colors.bold('Workflow Examples:'));
  console.log();
  console.log('  ' + colors.dim('# Initial setup'));
  console.log('  npm run pac:init');
  console.log('  npm run pac:auth');
  console.log();
  console.log('  ' + colors.dim('# Clone and work on solution'));
  console.log('  npm run pac:solution:clone');
  console.log('  ' + colors.dim('# ... make changes to src/ ...'));
  console.log('  npm run pac:deploy');
  console.log();
  console.log('  ' + colors.dim('# Promote to production'));
  console.log('  npm run pac:deploy:prod');
}

// Helper to get environment URL from alias
function getEnvUrl(envAlias) {
  switch (envAlias?.toLowerCase()) {
    case 'dev':
    case 'development':
      return process.env.ENV_DEV_URL;
    case 'test':
    case 'testing':
    case 'uat':
      return process.env.ENV_TEST_URL;
    case 'prod':
    case 'production':
      return process.env.ENV_PROD_URL;
    default:
      // If it looks like a URL, use it directly
      if (envAlias?.includes('.dynamics.com') || envAlias?.includes('.crm')) {
        return envAlias;
      }
      return null;
  }
}

// ============================================================================
// MAIN
// ============================================================================

const command = process.argv[2];

const commands = {
  'init': cmdInit,
  'auth': cmdAuth,
  'auth-list': cmdAuthList,
  'auth-clear': cmdAuthClear,
  'env-list': cmdEnvList,
  'env-select': cmdEnvSelect,
  'solution-list': cmdSolutionList,
  'solution-clone': cmdSolutionClone,
  'solution-export': cmdSolutionExport,
  'solution-import': cmdSolutionImport,
  'solution-unpack': cmdSolutionUnpack,
  'solution-pack': cmdSolutionPack,
  'deploy': cmdDeploy,
  'publish': cmdPublish,
  'version-bump': cmdVersionBump,
  'status': cmdStatus,
  'help': cmdHelp,
};

if (commands[command]) {
  commands[command]().catch(err => {
    log.error(err.message);
    process.exit(1);
  });
} else {
  cmdHelp();
}
