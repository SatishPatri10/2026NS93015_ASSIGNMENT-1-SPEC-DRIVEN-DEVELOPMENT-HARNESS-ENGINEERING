const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function checkFileLint(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  // Check 1: Parse AST / Syntax check via vm.Script
  try {
    new vm.Script(content, { filename: filePath });
  } catch (syntaxError) {
    violations.push({
      rule: 'LINT001_SYNTAX_ERROR',
      line: syntaxError.stack.split('\n')[0],
      message: syntaxError.message
    });
  }

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check 2: Disallow legacy `var` keyword
    if (/\bvar\s+[a-zA-Z0-9_$]+/.test(line) && !line.trim().startsWith('//')) {
      violations.push({
        rule: 'LINT002_NO_VAR',
        line: lineNum,
        message: 'Use "const" or "let" instead of "var"'
      });
    }

    // Check 3: Disallow debugger statements
    if (/\bdebugger\b/.test(line) && !line.trim().startsWith('//')) {
      violations.push({
        rule: 'LINT003_NO_DEBUGGER',
        line: lineNum,
        message: 'Remove debugging breakpoint statements'
      });
    }
  });

  return violations;
}

function runLintGuard(targetDir) {
  const filesToCheck = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.specify' && entry.name !== '.git') {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        filesToCheck.push(fullPath);
      }
    }
  }

  scan(targetDir);

  const results = {};
  let totalViolations = 0;

  for (const file of filesToCheck) {
    const relativePath = path.relative(targetDir, file);
    const violations = checkFileLint(file);
    if (violations.length > 0) {
      results[relativePath] = violations;
      totalViolations += violations.length;
    }
  }

  const status = totalViolations === 0 ? 'PASS' : 'FAIL';
  return {
    gate: 'Gate 1: Syntax & Lint Guard',
    status,
    totalFilesChecked: filesToCheck.length,
    violationCount: totalViolations,
    details: results
  };
}

if (require.main === module) {
  const srcDir = path.resolve(__dirname, '../src');
  const report = runLintGuard(srcDir);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === 'PASS' ? 0 : 1);
}

module.exports = { runLintGuard };
