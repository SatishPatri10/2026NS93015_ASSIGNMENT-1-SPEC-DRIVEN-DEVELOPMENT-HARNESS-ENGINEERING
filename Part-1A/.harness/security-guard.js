const fs = require('node:fs');
const path = require('node:path');

function checkFileSecurity(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    // SEC001: Dangerous dynamic evaluation
    if (/\beval\s*\(/.test(line) || /new\s+Function\s*\(/.test(line)) {
      findings.push({
        rule: 'SEC001_DANGEROUS_EVAL',
        severity: 'CRITICAL',
        line: lineNum,
        message: 'Dynamic code execution via eval() or new Function() is forbidden'
      });
    }

    // SEC002: Hardcoded private secrets or API keys
    if (/['"`](?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33})['"`]/.test(line)) {
      findings.push({
        rule: 'SEC002_HARDCODED_SECRET',
        severity: 'CRITICAL',
        line: lineNum,
        message: 'Hardcoded API secret token detected'
      });
    }

    // SEC003: Prototype pollution
    if (/__proto__|constructor\s*\[\s*['"`]prototype['"`]\s*\]/.test(line)) {
      findings.push({
        rule: 'SEC003_PROTOTYPE_POLLUTION',
        severity: 'HIGH',
        line: lineNum,
        message: 'Unsafe prototype access pattern detected'
      });
    }
  });

  // SEC004: In-memory store without eviction logic in code (strip comments)
  if (filePath.toLowerCase().includes('memorystore') || filePath.toLowerCase().includes('store')) {
    const codeWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    if (codeWithoutComments.includes('Map') &&
        !codeWithoutComments.includes('.delete(') &&
        !codeWithoutComments.includes('evict')) {
      findings.push({
        rule: 'SEC004_UNBOUNDED_CACHE_MEMORY_LEAK',
        severity: 'HIGH',
        line: 1,
        message: 'In-memory store maintains unbounded collections without an eviction strategy (.delete() / evictExpired)'
      });
    }
  }

  return findings;
}

function runSecurityGuard(targetDir) {
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
  let totalFindings = 0;

  for (const file of filesToCheck) {
    const relativePath = path.relative(targetDir, file);
    const findings = checkFileSecurity(file);
    if (findings.length > 0) {
      results[relativePath] = findings;
      totalFindings += findings.length;
    }
  }

  const status = totalFindings === 0 ? 'PASS' : 'FAIL';
  return {
    gate: 'Gate 2: SAST Security Guard',
    status,
    totalFilesChecked: filesToCheck.length,
    findingsCount: totalFindings,
    details: results
  };
}

if (require.main === module) {
  const srcDir = path.resolve(__dirname, '../src');
  const report = runSecurityGuard(srcDir);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.status === 'PASS' ? 0 : 1);
}

module.exports = { runSecurityGuard };
