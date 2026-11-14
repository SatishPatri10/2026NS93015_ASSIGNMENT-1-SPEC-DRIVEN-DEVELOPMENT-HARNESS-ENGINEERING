/**
 * Initial generation: Naive input guardrail only checking empty input.
 * (Vulnerable to adversarial prompt injection and malware requests)
 */
function evaluateInputGuardrail(code, language = '') {
  if (!code || code.trim().length === 0) {
    return {
      blocked: true,
      verdict: 'refusal',
      riskScore: 0,
      reasoning: 'Input code snippet is empty.'
    };
  }

  // FLAW: Omitted prompt injection and malware request detection

  return { blocked: false };
}

module.exports = { evaluateInputGuardrail };
