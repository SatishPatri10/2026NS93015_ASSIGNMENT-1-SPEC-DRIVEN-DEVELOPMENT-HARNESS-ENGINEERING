const fs = require('node:fs');
const path = require('node:path');
const { evaluateInputGuardrail } = require('./inputGuardrail');
const { sanitizeAndParseJSON } = require('./jsonSanitizer');
const { analyzeCodeLocally } = require('./localEngine');

class CodeReviewAssistant {
  constructor(options = {}) {
    this.geminiApiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
    this.openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
  }

  async review(code, language = 'javascript') {
    const guardrail = evaluateInputGuardrail(code, language);
    if (guardrail.blocked) {
      return {
        findings: [],
        summary: {
          totalFindings: 0,
          riskScore: guardrail.riskScore,
          verdict: guardrail.verdict,
          reasoning: guardrail.reasoning
        }
      };
    }

    // FLAW: Naive parsing without line clamping
    const parsedResult = analyzeCodeLocally(code, language);
    return parsedResult;
  }
}

module.exports = { CodeReviewAssistant };
