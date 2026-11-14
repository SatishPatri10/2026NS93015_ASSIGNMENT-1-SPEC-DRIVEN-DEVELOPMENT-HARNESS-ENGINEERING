const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { evaluateInputGuardrail } = require('./inputGuardrail');
const { sanitizeAndParseJSON } = require('./jsonSanitizer');
const { analyzeCodeLocally } = require('./localEngine');

class CodeReviewAssistant {
  constructor(options = {}) {
    this.geminiApiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
    this.openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
    this.promptsDir = options.promptsDir || path.resolve(__dirname, '../prompts');

    this.systemPrompt = '';
    const sysPromptPath = path.join(this.promptsDir, 'system-prompt.txt');
    if (fs.existsSync(sysPromptPath)) {
      this.systemPrompt = fs.readFileSync(sysPromptPath, 'utf8');
    }
  }

  async review(code, language = 'javascript') {
    const totalLines = code ? code.split('\n').length : 1;

    // 1. Inbound Guardrail Check
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

    let parsedResult = null;

    // 2. Cloud LLM Call if API Keys configured
    if (this.geminiApiKey) {
      try {
        const rawText = await this._callGemini(code, language);
        parsedResult = sanitizeAndParseJSON(rawText);
      } catch (err) {
        console.warn(`[CodeReviewAssistant] Gemini API call failed (${err.message}). Falling back to local engine.`);
      }
    } else if (this.openaiApiKey) {
      try {
        const rawText = await this._callOpenAI(code, language);
        parsedResult = sanitizeAndParseJSON(rawText);
      } catch (err) {
        console.warn(`[CodeReviewAssistant] OpenAI API call failed (${err.message}). Falling back to local engine.`);
      }
    }

    // 3. Fallback to Local Deterministic Engine
    if (!parsedResult) {
      parsedResult = analyzeCodeLocally(code, language);
    }

    // 4. Invariant Post-Processing: Clamp line numbers within total line bounds
    if (Array.isArray(parsedResult.findings)) {
      parsedResult.findings.forEach(f => {
        if (typeof f.line === 'number') {
          f.line = Math.max(1, Math.min(f.line, totalLines));
        }
      });
      parsedResult.summary.totalFindings = parsedResult.findings.length;
    }

    return parsedResult;
  }

  _callGemini(code, language) {
    return new Promise((resolve, reject) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
      const payload = JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${this.systemPrompt}\n\nReview this code:\n\`\`\`${language}\n${code}\n\`\`\`` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(body);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              resolve(text);
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Gemini HTTP ${res.statusCode}: ${body.substring(0, 100)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  _callOpenAI(code, language) {
    return new Promise((resolve, reject) => {
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: `Review this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`` }
        ],
        response_format: { type: 'json_object' }
      });

      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(body);
              resolve(data.choices?.[0]?.message?.content);
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`OpenAI HTTP ${res.statusCode}: ${body.substring(0, 100)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}

module.exports = { CodeReviewAssistant };
