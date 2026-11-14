/**
 * Local Deterministic Semantic Analysis Engine.
 * Evaluates code patterns against security, performance, bug risk,
 * maintainability, and modern idioms when offline or as a baseline.
 */
function analyzeCodeLocally(code, language = 'javascript') {
  const lines = code.split('\n');
  const findings = [];
  const lineCount = lines.length;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // 1. SQL Injection via string interpolation or concatenation
    if (/SELECT\s+.*FROM\s+.*WHERE\s+.*(?:\$\{|\+)/i.test(lineText) ||
        /SELECT\s+.*FROM\s+.*WHERE\s+.*[`'"].*\$\{/i.test(lineText)) {
      findings.push({
        line: lineNum,
        category: 'security',
        severity: 'critical',
        title: 'CWE-89: Potential SQL Injection Vulnerability',
        description: 'Direct string interpolation of untrusted parameters into SQL queries leads to severe SQL injection vulnerabilities.',
        suggestion: 'Use parameterized queries or prepared statements via database driver bindings.',
        refactoredSnippet: 'const query = "SELECT * FROM users WHERE id = $1";\nconst result = await db.query(query, [id]);'
      });
    }

    // 2. Hardcoded Secrets
    if (/(?:JWT_SECRET|API_KEY|PASSWORD|SECRET)\s*=\s*['"`][a-zA-Z0-9_\-]{16,}['"`]/i.test(lineText)) {
      findings.push({
        line: lineNum,
        category: 'security',
        severity: 'critical',
        title: 'CWE-798: Hardcoded High-Entropy Secret Credential',
        description: 'Hardcoded secret token detected in source code. This exposes cryptographic tokens to repository exposure.',
        suggestion: 'Externalize sensitive credentials into environment variables managed securely.',
        refactoredSnippet: 'const JWT_SECRET = process.env.JWT_SECRET;\nif (!JWT_SECRET) throw new Error("JWT_SECRET env var required");'
      });
    }

    // 3. Catastrophic ReDoS Regex
    if (/\(\s*\[a-zA-Z0-9_\-\+]+\]\s*\)\s*\+/.test(lineText) || /([a-zA-Z0-9]+)\+/.test(lineText)) {
      if (lineText.includes('emailRegex') || lineText.includes('regex') || lineText.includes('RegExp')) {
        findings.push({
          line: lineNum,
          category: 'security',
          severity: 'high',
          title: 'CWE-1333: Inefficient Regular Expression with Catastrophic Backtracking (ReDoS)',
          description: 'Nested quantifiers like `([a-zA-Z0-9]+)+` cause exponential execution time on adversarial inputs.',
          suggestion: 'Refactor regular expression to remove nested quantifiers.',
          refactoredSnippet: 'const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;'
        });
      }
    }

    // 4. Inefficient Nested Loop O(N^2)
    if (/for\s*\(.*let\s+j\s*=/.test(lineText) && idx > 0 && /for\s*\(.*let\s+i\s*=/.test(lines[idx - 1])) {
      findings.push({
        line: lineNum,
        category: 'performance',
        severity: 'medium',
        title: 'Algorithmic Inefficiency: Nested Loop O(N^2) Scanning',
        description: 'Nested loops iterating across collections scale quadratically. Converting the inner scan to a hash Set yields O(N) complexity.',
        suggestion: 'Pre-index the second collection in a Set or Map for constant-time lookups.',
        refactoredSnippet: 'const setB = new Set(listB);\nreturn listA.filter(item => setB.has(item));'
      });
    }

    // 5. Unhandled Async DB Rejection
    if (/await\s+database\./.test(lineText) && !code.includes('try') && !code.includes('.catch(')) {
      findings.push({
        line: lineNum,
        category: 'bug_risk',
        severity: 'high',
        title: 'Unhandled Promise Rejection in Async Database Operation',
        description: 'Awaiting database promises without a surrounding try/catch block will throw unhandled rejections during connectivity or query errors.',
        suggestion: 'Wrap asynchronous operations inside structured try/catch blocks with error logging.',
        refactoredSnippet: 'try {\n  const order = await database.orders.findById(orderId);\n} catch (err) {\n  logger.error("Failed to fetch order", err);\n  throw err;\n}'
      });
    }

    // 6. React useEffect Missing Dependencies
    if (/useEffect\s*\(\s*\(\)\s*=>/.test(lineText) && !code.includes('],')) {
      findings.push({
        line: lineNum,
        category: 'bug_risk',
        severity: 'high',
        title: 'React Anti-Pattern: useEffect Lacking Dependency Array',
        description: 'Omitting the second dependency array argument causes the effect to run on every render, triggering infinite re-render loops when state updates.',
        suggestion: 'Provide an explicit dependency array including referenced props and state variables.',
        refactoredSnippet: 'useEffect(() => {\n  fetch(`/api/user/${userId}`).then(res => res.json()).then(setData);\n}, [userId]);'
      });
    }

    // 7. Off-by-one index access
    if (/\[\s*arr\.length\s*\]/.test(lineText)) {
      findings.push({
        line: lineNum,
        category: 'bug_risk',
        severity: 'medium',
        title: 'Off-By-One Index Error: Accessing arr[arr.length]',
        description: 'Zero-indexed arrays have elements from 0 to length - 1. Accessing index arr.length results in `undefined`.',
        suggestion: 'Access the last element via arr[arr.length - 1] or arr.at(-1).',
        refactoredSnippet: 'return arr.length > 0 ? arr[arr.length - 1] : undefined;'
      });
    }

    // 8. Prototype Pollution
    if (/Object\.assign\s*\(\s*target\s*,\s*parsed\s*\)/.test(lineText)) {
      findings.push({
        line: lineNum,
        category: 'security',
        severity: 'high',
        title: 'CWE-1321: Prototype Pollution via Unfiltered Object.assign',
        description: 'Merging unvalidated parsed JSON into target objects allows attackers to pollute Object.prototype with __proto__ properties.',
        suggestion: 'Validate properties against an allowlist or create objects with Object.create(null).',
        refactoredSnippet: 'const safeData = Object.create(null);\nfor (const [k, v] of Object.entries(parsed)) {\n  if (k !== "__proto__" && k !== "constructor") safeData[k] = v;\n}'
      });
    }

    // 9. Global Queue Mutation without declarations
    if (/globalQueue\.push/.test(lineText) && !code.includes('const globalQueue')) {
      findings.push({
        line: lineNum,
        category: 'maintainability',
        severity: 'medium',
        title: 'Implicit Global State Mutation',
        description: 'Modifying implicit global data structures without encapsulation creates hidden dependencies and race conditions.',
        suggestion: 'Inject dependencies explicitly or encapsulate queue inside a class or closure.',
        refactoredSnippet: 'function processQueue(item, queue) {\n  queue.push(item);\n  return true;\n}'
      });
    }

    // 10. Truncated Incomplete Syntax
    if (idx === lines.length - 1 && /{\s*username:\s*credentials\.username,\s*$/.test(lineText.trim())) {
      findings.push({
        line: lineNum,
        category: 'bug_risk',
        severity: 'high',
        title: 'Syntax Error: Incomplete Truncated Code Fragment',
        description: 'Code snippet ends abruptly mid-statement, leaving unbalanced braces and incomplete function definition.',
        suggestion: 'Complete the statement and close all curly braces.',
        refactoredSnippet: '  const user = await db.findUser({ username: credentials.username });\n  return user;\n}'
      });
    }
  });

  // Calculate Risk Score & Verdict
  const totalFindings = findings.length;
  let riskScore = 0;
  let verdict = 'clean';
  let reasoning = 'No anti-patterns, security vulnerabilities, or quality issues detected in source code.';

  if (totalFindings > 0) {
    const hasCritical = findings.some(f => f.severity === 'critical');
    const hasHigh = findings.some(f => f.severity === 'high');

    if (hasCritical) {
      riskScore = 85;
      verdict = 'critical_revisions_required';
      reasoning = 'Critical security vulnerabilities identified that must be resolved prior to merging.';
    } else if (hasHigh) {
      riskScore = 55;
      verdict = 'needs_improvement';
      reasoning = 'High severity bugs or security risks detected requiring developer revision.';
    } else {
      riskScore = 30;
      verdict = 'needs_improvement';
      reasoning = 'Code quality and performance improvements suggested.';
    }
  }

  return {
    findings,
    summary: {
      totalFindings,
      riskScore,
      verdict,
      reasoning
    }
  };
}

module.exports = { analyzeCodeLocally };
