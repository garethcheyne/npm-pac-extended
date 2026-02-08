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
  };

  // Version format selection
  console.log();
  console.log(colors.bold('Version Format:'));
  console.log('─'.repeat(50));
  console.log('  1. ' + colors.cyan('semantic') + '  - 1.0.0.0 (major.minor.patch.revision)');
  console.log('  2. ' + colors.cyan('date') + '      - 2024.02.08.1 (yyyy.mm.dd.sequence)');
  console.log('  3. ' + colors.cyan('year') + '      - 2024.1.0.0 (yyyy.minor.patch.revision)');
  console.log();

  const versionChoice = await prompt('Choose version format (1/2/3)', '1');
  let versionFormat;
  switch (versionChoice) {
    case '2':
    case 'date':
      versionFormat = 'date';
      break;
    case '3':
    case 'year':
      versionFormat = 'year';
      break;
    default:
      versionFormat = 'semantic';
  }

  config.VERSION_FORMAT = versionFormat;

  // Only ask for bump type if semantic versioning
  if (versionFormat === 'semantic') {
    config.BUMP_TYPE = await prompt('Version bump type (patch/minor/major)', 'patch');
  } else {
    config.BUMP_TYPE = 'auto';
  }

  // Paths
  config.SOLUTION_OUTPUT_PATH = await prompt('Solution output folder', './solutions');
  config.SOLUTION_SOURCE_PATH = await prompt('Solution source folder', './src');

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

# Version format: semantic (1.0.0.0), date (yyyy.mm.dd.seq), year (yyyy.minor.patch.rev)
VERSION_FORMAT=${config.VERSION_FORMAT}

# Version bump type (for semantic): patch (1.0.X.0), minor (1.X.0.0), major (X.0.0.0)
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
  const versionFormat = process.env.VERSION_FORMAT || 'semantic';
  const bumpType = process.env.BUMP_TYPE || 'patch';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  switch (versionFormat) {
    case 'date':
      // Format: yyyy.mm.dd.sequence
      // If same date, increment sequence; otherwise reset to 1
      if (major === year && minor === month && build === day) {
        revision++;
      } else {
        major = year;
        minor = month;
        build = day;
        revision = 1;
      }
      break;

    case 'year':
      // Format: yyyy.minor.patch.revision
      // Update year, increment minor
      if (major !== year) {
        major = year;
        minor = 1;
        build = 0;
        revision = 0;
      } else {
        minor++;
        build = 0;
        revision = 0;
      }
      break;

    case 'semantic':
    default:
      // Format: major.minor.patch.revision
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
      break;
  }

  const oldVersionStr = versionMatch[0].replace(/<\/?Version>/g, '');
  const newVersionStr = `${major}.${minor}.${build}.${revision}`;
  const newVersion = `<Version>${newVersionStr}</Version>`;
  content = content.replace(versionMatch[0], newVersion);

  fs.writeFileSync(solutionXmlPath, content);

  // Show format-specific message
  let formatLabel;
  switch (versionFormat) {
    case 'date':
      formatLabel = `(${year}.${month}.${day}.seq)`;
      break;
    case 'year':
      formatLabel = `(${year}.minor.patch.rev)`;
      break;
    default:
      formatLabel = '(semantic)';
  }

  log.success(`Version bumped ${formatLabel}: ${oldVersionStr} -> ${newVersionStr}`);
}

function cmdStatus() {
  log.title('PAC - Status');

  console.log('\n' + colors.bold('Configuration:'));
  console.log('  Solution:', process.env.SOLUTION_NAME || colors.dim('(not set)'));
  console.log('  Default Env:', process.env.DEFAULT_ENV || colors.dim('(not set)'));
  console.log('  Auto Bump:', process.env.AUTO_BUMP_VERSION || colors.dim('(not set)'));
  console.log('  Version Format:', process.env.VERSION_FORMAT || colors.dim('semantic'));

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

// ============================================================================
// PCF COMMANDS
// ============================================================================

async function cmdPcfInit() {
  log.title('PAC - Initialize PCF Component');

  const hasEnv = fs.existsSync('.env');
  const hasPublisher = !!process.env.SOLUTION_PUBLISHER_PREFIX;

  // Show current configuration status
  console.log('\n' + colors.bold('Configuration Status:'));
  console.log('─'.repeat(50));

  if (hasEnv && hasPublisher) {
    console.log(colors.green('  ✓ .env found'));
    console.log(colors.green(`  ✓ Publisher prefix: ${process.env.SOLUTION_PUBLISHER_PREFIX}`));
    if (process.env.SOLUTION_NAME) {
      console.log(colors.green(`  ✓ Solution: ${process.env.SOLUTION_NAME}`));
    }
    if (process.env.ENV_DEV_URL) {
      console.log(colors.green(`  ✓ Dev environment: ${process.env.ENV_DEV_URL}`));
    }
    console.log();
  } else if (hasEnv && !hasPublisher) {
    console.log(colors.yellow('  ! .env found but missing publisher prefix'));
    console.log(colors.dim('    Run: pac-ext init to configure'));
    console.log();
  } else {
    console.log(colors.yellow('  ! No .env file found'));
    console.log(colors.dim('    Tip: Run pac-ext init first to set up your project'));
    console.log();
  }

  // Component details
  console.log(colors.bold('Component Details:'));
  console.log('─'.repeat(50));

  // Get display name (can have spaces)
  let displayName = process.argv[3];
  if (!displayName) {
    console.log(colors.dim('  Display name can include spaces (e.g., "Fluent Address Picker")'));
    displayName = await prompt('  Display name');
  } else {
    console.log(`  Display name: ${colors.cyan(displayName)}`);
  }

  if (!displayName || displayName.trim() === '') {
    log.error('Display name is required');
    return;
  }

  // Generate technical name (strip invalid chars, keep original case)
  const generateTechnicalName = (str) => {
    return str.replace(/[^A-Za-z0-9]/g, '');
  };

  let technicalName = generateTechnicalName(displayName);

  console.log();
  console.log(colors.dim('  Technical name must be alphanumeric (A-Z, a-z, 0-9) - PAC requirement'));
  console.log(colors.dim(`  Generated: ${technicalName}`));

  const useTechnicalName = await promptYN(`  Use "${technicalName}" as technical name?`, true);
  if (!useTechnicalName) {
    technicalName = await prompt('  Technical name');
    // Clean the input
    technicalName = technicalName.replace(/[^A-Za-z0-9]/g, '');
    if (!technicalName) {
      log.error('Technical name is required and must be alphanumeric');
      return;
    }
  }

  // Validate technical name
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(technicalName)) {
    log.error('Technical name must start with a letter and contain only A-Z, a-z, 0-9');
    return;
  }

  // Get namespace (use publisher prefix from .env or ask)
  let namespace;
  if (hasPublisher) {
    const useDefault = await promptYN(`  Use namespace "${process.env.SOLUTION_PUBLISHER_PREFIX}"?`, true);
    if (useDefault) {
      namespace = process.env.SOLUTION_PUBLISHER_PREFIX;
    } else {
      namespace = await prompt('  Namespace');
    }
  } else {
    console.log();
    console.log(colors.dim('  Namespace is typically your publisher prefix (e.g., contoso, acme)'));
    namespace = await prompt('  Namespace');
  }

  if (!namespace || namespace.trim() === '') {
    namespace = 'New';
    console.log(colors.dim(`  Using default namespace: ${namespace}`));
  }

  // Get template type
  console.log();
  console.log(colors.bold('  Template Type:'));
  console.log(colors.dim('    field   - For form fields (text, number, date, etc.)'));
  console.log(colors.dim('    dataset - For grids and lists (subgrids, views)'));
  console.log();

  const template = await prompt('  Template (field/dataset)', 'field');

  // Output path (use technical name for folder)
  const outputPath = `./${technicalName}`;

  // Summary before creation
  console.log();
  console.log(colors.bold('Summary:'));
  console.log('─'.repeat(50));
  console.log(`  Display Name:    ${colors.cyan(displayName)}`);
  console.log(`  Technical Name:  ${colors.cyan(technicalName)}`);
  console.log(`  Namespace:       ${colors.cyan(namespace)}`);
  console.log(`  Full Name:       ${colors.cyan(namespace + '.' + technicalName)}`);
  console.log(`  Template:        ${colors.cyan(template)}`);
  console.log(`  Output Folder:   ${colors.cyan(outputPath)}`);
  console.log();

  const proceed = await promptYN('  Create component?', true);
  if (!proceed) {
    log.warn('Cancelled');
    return;
  }

  // Create the component
  console.log();
  log.info(`Creating PCF component: ${namespace}.${technicalName}`);

  try {
    runPac(`pcf init --name "${technicalName}" --namespace "${namespace}" --template "${template}" --outputDirectory "${outputPath}"`);
  } catch (error) {
    log.error('Failed to create PCF component');
    return;
  }

  // Success message with next steps
  console.log();
  console.log(colors.green('─'.repeat(50)));
  log.success('PCF component created successfully!');
  console.log(colors.green('─'.repeat(50)));

  console.log();
  console.log(colors.bold('Next Steps:'));
  console.log();
  console.log(`  ${colors.cyan('1.')} cd ${technicalName}`);
  console.log(`  ${colors.cyan('2.')} npm install`);
  console.log(`  ${colors.cyan('3.')} ${colors.dim('# Edit index.ts to build your component')}`);
  console.log(`  ${colors.cyan('4.')} npm run build`);
  console.log(`  ${colors.cyan('5.')} pac-ext pcf-push`);
  console.log();

  if (!hasEnv) {
    console.log(colors.yellow('Tip: Run pac-ext init in your project root to configure environments'));
    console.log();
  }
}

function cmdPcfPush() {
  log.title('PAC - Push PCF Component');

  const env = getEnvUrl(process.env.DEFAULT_ENV || 'dev');
  if (env) {
    log.info(`Pushing to: ${env}`);
    try {
      runPac(`org select --environment "${env}"`, { silent: true });
    } catch (e) {
      // ignore
    }
  }

  runPac('pcf push --publisher-prefix ' + (process.env.SOLUTION_PUBLISHER_PREFIX || 'new'));
  log.success('PCF component pushed!');
}

function cmdPcfBuild() {
  log.title('PAC - Build PCF Component');

  const isProduction = process.argv.includes('--prod') || process.argv.includes('--production');

  if (isProduction) {
    log.info('Building for production...');
    runPac('pcf build --production');
  } else {
    log.info('Building for development...');
    runPac('pcf build');
  }

  log.success('PCF build complete!');
}

async function cmdPcfStart() {
  log.title('PAC - Start PCF Development');

  const envUrl = process.env.ENV_DEV_URL;

  // Check if we're in a PCF project folder
  const hasPcfConfig = fs.existsSync('pcfconfig.json') || fs.existsSync('ControlManifest.Input.xml');
  const hasPackageJson = fs.existsSync('package.json');

  if (!hasPcfConfig) {
    log.warn('No PCF project found in current directory');
    console.log(colors.dim('  Run this command from your PCF component folder'));
    return;
  }

  // Install dependencies if needed
  if (hasPackageJson && !fs.existsSync('node_modules')) {
    log.info('Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
    } catch (e) {
      log.error('Failed to install dependencies');
      return;
    }
  }

  console.log();
  console.log(colors.bold('Starting PCF Development:'));
  console.log('─'.repeat(50));

  if (envUrl) {
    console.log(`  ${colors.green('✓')} Environment: ${envUrl}`);
    console.log(`  ${colors.green('✓')} Live data proxy will start on port 3000`);
    console.log(`  ${colors.green('✓')} PCF harness will start on port 8181`);
    console.log();

    // Start proxy in background
    log.info('Starting Dataverse proxy...');
    const proxyPath = path.join(__dirname, 'dataverse-proxy.js');
    const proxyProcess = spawn('node', [proxyPath], {
      stdio: 'inherit',
      env: { ...process.env },
      detached: false,
    });

    // Give proxy time to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start PCF harness
    log.info('Starting PCF test harness...');
    try {
      execSync('npm start', { stdio: 'inherit' });
    } catch (e) {
      // User cancelled with Ctrl+C
    }

    // Cleanup
    proxyProcess.kill();
  } else {
    console.log(colors.yellow('  ! No environment URL configured'));
    console.log(colors.dim('    Starting harness without live data proxy'));
    console.log(colors.dim('    Tip: Run pac-ext init to configure environments'));
    console.log();

    // Just start the harness
    log.info('Starting PCF test harness...');
    try {
      execSync('npm start', { stdio: 'inherit' });
    } catch (e) {
      // User cancelled
    }
  }
}

async function cmdProxy() {
  log.title('PAC - Dataverse Proxy');

  const envUrl = process.env.ENV_DEV_URL || process.argv[3];

  if (!envUrl) {
    log.error('No environment URL configured');
    console.log();
    console.log('Set ENV_DEV_URL in .env or pass as argument:');
    console.log(colors.dim('  pac-ext proxy https://yourorg.crm.dynamics.com'));
    return;
  }

  // Load and run proxy
  const { DataverseProxy } = require('./dataverse-proxy.js');
  const proxy = new DataverseProxy(envUrl);
  await proxy.start();
}

async function cmdAudit() {
  log.title('PAC - Environment Audit');

  // Parse arguments - support space-separated environments after --compare
  const args = process.argv.slice(3);
  let masterEnv = null;
  let compareEnvs = [];
  let saveReport = false;
  let deepMode = false;
  let collectingCompare = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Check for flags
    if (arg.startsWith('-')) {
      collectingCompare = false;

      if (arg === '--master' || arg === '-m') {
        masterEnv = args[++i];
      } else if (arg === '--compare' || arg === '-c') {
        collectingCompare = true;
      } else if (arg === '--save' || arg === '-s') {
        saveReport = true;
      } else if (arg === '--deep' || arg === '-d') {
        deepMode = true;
      }
    } else if (collectingCompare) {
      // Collect all non-flag arguments as environments
      // Support both comma-separated and space-separated
      const envs = arg.split(',').map(e => e.trim()).filter(e => e);
      compareEnvs.push(...envs);
    }
  }

  // Show help if no args
  if (!masterEnv && !compareEnvs.length) {
    console.log();
    console.log(colors.bold('Usage:'));
    console.log('─'.repeat(60));
    console.log('  pac-ext audit --master <env> --compare <env1> <env2> ...');
    console.log();
    console.log(colors.bold('Options:'));
    console.log('  --master, -m   Master/baseline environment (dev/test/prod or URL)');
    console.log('  --compare, -c  Environments to compare (space or comma separated)');
    console.log('  --deep, -d     Deep comparison (table columns, field properties)');
    console.log('  --save, -s     Save report to HTML and JSON');
    console.log();
    console.log(colors.bold('Examples:'));
    console.log(colors.dim('  # Compare using aliases'));
    console.log('  pac-ext audit --master prod --compare dev test');
    console.log();
    console.log(colors.dim('  # Compare using URLs'));
    console.log('  pac-ext audit --master https://org-prod.crm.dynamics.com \\');
    console.log('                --compare https://org-dev.crm.dynamics.com \\');
    console.log('                          https://org-test.crm.dynamics.com');
    console.log();
    console.log(colors.dim('  # Save report'));
    console.log('  pac-ext audit --master prod --compare dev test --save');
    console.log();

    // Show configured environments
    console.log(colors.bold('Configured Environments:'));
    console.log('─'.repeat(60));
    console.log(`  dev:  ${process.env.ENV_DEV_URL || colors.dim('(not set)')}`);
    console.log(`  test: ${process.env.ENV_TEST_URL || colors.dim('(not set)')}`);
    console.log(`  prod: ${process.env.ENV_PROD_URL || colors.dim('(not set)')}`);
    console.log();
    return;
  }

  // Resolve environment URLs
  const resolveEnv = (name) => {
    const url = getEnvUrl(name);
    if (url) return { name, url };
    // If it looks like a URL, use it directly
    if (name?.includes('.dynamics.com') || name?.includes('.crm')) {
      return { name: name.split('//')[1]?.split('.')[0] || name, url: name };
    }
    return null;
  };

  const master = resolveEnv(masterEnv);
  if (!master) {
    log.error(`Could not resolve master environment: ${masterEnv}`);
    return;
  }

  const targets = [];
  for (const env of compareEnvs) {
    const resolved = resolveEnv(env.trim());
    if (resolved) {
      targets.push(resolved);
    } else {
      log.warn(`Could not resolve environment: ${env}`);
    }
  }

  if (targets.length === 0) {
    log.error('No valid target environments to compare');
    return;
  }

  // Run audit
  const { EnvironmentAudit } = require('./environment-audit.js');
  const audit = new EnvironmentAudit(master.url, master.name, targets, { deep: deepMode });

  try {
    await audit.runAudit();
    audit.printReport();

    if (saveReport) {
      // Create reports directory
      const reportsDir = './reports';
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Sanitize name for filename (extract org name from URL or use alias)
      const sanitizeName = (name) => {
        // If it's a URL, extract the org name
        if (name.includes('.dynamics.com') || name.includes('.crm')) {
          const match = name.match(/https?:\/\/([^.]+)/);
          return match ? match[1] : 'environment';
        }
        // Otherwise just remove invalid chars
        return name.replace(/[^a-zA-Z0-9-_]/g, '_');
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const safeName = sanitizeName(master.name);
      const baseName = `${reportsDir}/audit-${safeName}-${timestamp}`;

      audit.saveReport(`${baseName}.json`);
      const htmlPath = audit.saveHtmlReport(`${baseName}.html`);

      // Open HTML report in browser
      console.log();
      log.info('Opening report in browser...');
      const open = require('open');
      open(htmlPath).catch(() => {});
    }
  } catch (error) {
    log.error(`Audit failed: ${error.message}`);
  }
}

// ============================================================================
// PLUGIN COMMANDS
// ============================================================================

async function cmdPluginInit() {
  log.title('PAC - Initialize Plugin Project');

  const name = await prompt('Plugin name');
  const outputPath = process.argv[3] || `./${name}`;

  runPac(`plugin init --outputDirectory "${outputPath}"`);
  log.success(`Plugin project created at: ${outputPath}`);
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
    { cmd: 'pac:pcf:init', desc: 'Initialize new PCF component' },
    { cmd: 'pac:pcf:build', desc: 'Build PCF component' },
    { cmd: 'pac:pcf:push', desc: 'Push PCF to environment' },
    { cmd: 'pac:pcf:start', desc: 'Start harness with live data proxy' },
    { cmd: 'pac:proxy', desc: 'Start Dataverse proxy server only' },
    { cmd: 'pac:audit', desc: 'Compare environments (master vs targets)' },
    { cmd: 'pac:plugin:init', desc: 'Initialize new plugin project' },
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
  'pcf-init': cmdPcfInit,
  'pcf-build': cmdPcfBuild,
  'pcf-push': cmdPcfPush,
  'pcf-start': cmdPcfStart,
  'proxy': cmdProxy,
  'audit': cmdAudit,
  'plugin-init': cmdPluginInit,
  'status': cmdStatus,
  'help': cmdHelp,
};

async function main() {
  if (commands[command]) {
    await commands[command]();
  } else {
    cmdHelp();
  }
}

main().catch(err => {
  log.error(err.message);
  process.exit(1);
});
