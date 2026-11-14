/**
 * Input Guardrail Filter: Inspects code and queries for adversarial injection,
 * malicious requests, empty strings, and non-code text.
 */
function evaluateInputGuardrail(code, language = '') {
  // 1. Check for empty or whitespace-only input
  if (!code || code.trim().length === 0) {
    return {
      blocked: true,
      verdict: 'refusal',
      riskScore: 0,
      reasoning: 'Input code snippet is empty. Please provide valid source code for review.'
    };
  }

  const trimmed = code.trim();

  // 2. Check for binary / corrupt control characters
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(trimmed)) {
    return {
      blocked: true,
      verdict: 'refusal',
      riskScore: 0,
      reasoning: 'Input contains invalid or corrupted binary control characters.'
    };
  }

  // 3. Check for prompt injection / jailbreak attempts
  const promptInjectionPattern = /ignore\s+(?:all\s+)?previous\s+instructions|output\s+system_config|developer\s+prompt|print\s+(?:system|internal)\s+(?:prompt|password|secret)/i;
  if (promptInjectionPattern.test(trimmed)) {
    return {
      blocked: true,
      verdict: 'refusal',
      riskScore: 100,
      reasoning: 'Security refusal: Inbound prompt injection attempt detected.'
    };
  }

  // 4. Check for malicious weaponization / exploit / ransomware assistance
  const maliciousIntentPattern = /\bransomware\b|\bkeylogger\b|encrypt\s+(?:user\s+)?files\s+faster|without\s+being\s+detected\s+by\s+antivirus|\bexploit\s+payload\b/i;
  if (maliciousIntentPattern.test(trimmed)) {
    return {
      blocked: true,
      verdict: 'refusal',
      riskScore: 100,
      reasoning: 'Safety policy refusal: Request involves malicious software, malware, or evasion techniques.'
    };
  }

  // 5. Check for non-code natural language prose (culinary recipes, essays)
  const isLikelyCode = /[{}();=><\[\]]|(?:\b(?:function|def|class|var|let|const|import|from|return)\b)|\bapp\./.test(trimmed);
  const isProse = /preheat\s+oven|skillet\s+cook|tablespoon|teaspoon|stir\s+in/i.test(trimmed);

  if (isProse && !isLikelyCode) {
    return {
      blocked: true,
      verdict: 'refusal',
      riskScore: 0,
      reasoning: 'Input appears to be general non-code prose rather than a recognized programming language.'
    };
  }

  return { blocked: false };
}

module.exports = { evaluateInputGuardrail };
