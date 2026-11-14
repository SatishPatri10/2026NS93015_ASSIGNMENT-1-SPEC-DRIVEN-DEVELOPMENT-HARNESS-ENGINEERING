const { spawnSync } = require('node:child_process');
const path = require('node:path');

function runTestSuite(projectDir, targetSrcDir = null) {
  const testsDir = path.resolve(projectDir, 'tests');
  const testFiles = ['tokenBucket.test.js', 'apiRateLimit.test.js'].map(f => path.join(testsDir, f));

  const env = { ...process.env };
  if (targetSrcDir) {
    env.SRC_DIR = targetSrcDir;
  }

  const result = spawnSync(process.execPath, ['--test', ...testFiles], {
    cwd: projectDir,
    env,
    encoding: 'utf8'
  });

  const output = (result.stdout || '') + '\n' + (result.stderr || '');
  const passed = (output.match(/ok \d+/g) || []).length;
  const failed = (output.match(/not ok \d+/g) || []).length;
  const isPass = result.status === 0 && failed === 0;

  return {
    gate: 'Gate 3: Deterministic Unit & Contract Tests',
    status: isPass ? 'PASS' : 'FAIL',
    exitCode: result.status,
    totalTestsReported: passed + failed,
    passedTests: passed,
    failedTests: failed,
    rawOutput: output
  };
}

if (require.main === module) {
  const projectDir = path.resolve(__dirname, '..');
  const targetSrcDir = process.env.SRC_DIR || path.resolve(projectDir, 'src');
  const report = runTestSuite(projectDir, targetSrcDir);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === 'PASS' ? 0 : 1);
}

module.exports = { runTestSuite };
