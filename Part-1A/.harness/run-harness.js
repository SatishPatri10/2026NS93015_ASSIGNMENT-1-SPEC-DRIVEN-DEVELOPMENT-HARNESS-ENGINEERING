const path = require('node:path');
const fs = require('node:fs');
const { runLintGuard } = require('./lint-guard');
const { runSecurityGuard } = require('./security-guard');
const { runTestSuite } = require('./test-runner');

function runHarness(targetSrcDir, projectDir) {
  const startTime = Date.now();
  console.log('===============================================================');
  console.log('   PART 1A DETERMINISTIC HARNESS: SPECIFICATION VALIDATION    ');
  console.log('===============================================================');
  console.log(`Target Source Directory: ${targetSrcDir}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // 1. Gate 1: Lint & Syntax Guard
  console.log('--> Running Gate 1: Syntax & Static Lint Guard...');
  const lintResult = runLintGuard(targetSrcDir);
  console.log(`    Result: [${lintResult.status}] (Violations: ${lintResult.violationCount})`);

  // 2. Gate 2: SAST Security Guard
  console.log('--> Running Gate 2: SAST Security Guard...');
  const securityResult = runSecurityGuard(targetSrcDir);
  console.log(`    Result: [${securityResult.status}] (Findings: ${securityResult.findingsCount})`);

  // 3. Gate 3: Unit & Contract Tests
  console.log('--> Running Gate 3: Unit & Contract Test Suite...');
  const testResult = runTestSuite(projectDir, targetSrcDir);
  console.log(`    Result: [${testResult.status}] (Passed: ${testResult.passedTests}, Failed: ${testResult.failedTests})`);

  const allPassed = lintResult.status === 'PASS' &&
                    securityResult.status === 'PASS' &&
                    testResult.status === 'PASS';

  const durationMs = Date.now() - startTime;
  const overallDecision = allPassed ? 'PASS' : 'FAIL';

  const harnessReport = {
    timestamp: new Date().toISOString(),
    overallDecision,
    durationMs,
    targetSrcDir,
    gates: {
      gate1_lint: lintResult,
      gate2_security: securityResult,
      gate3_tests: testResult
    }
  };

  console.log('\n===============================================================');
  console.log(`   HARNESS RUN OUTCOME: [${overallDecision}] (${durationMs}ms)   `);
  console.log('===============================================================');

  return harnessReport;
}

if (require.main === module) {
  const projectDir = path.resolve(__dirname, '..');
  const srcDir = process.env.SRC_DIR || path.resolve(projectDir, 'src');
  const report = runHarness(srcDir, projectDir);

  const evidenceDir = path.resolve(projectDir, 'evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const outputPath = path.resolve(evidenceDir, 'harness-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Report preserved to: ${outputPath}`);

  process.exit(report.overallDecision === 'PASS' ? 0 : 1);
}

module.exports = { runHarness };
