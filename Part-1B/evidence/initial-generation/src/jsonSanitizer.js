/**
 * Robust JSON extraction and sanitization utility.
 */
function sanitizeAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Input text must be a non-empty string');
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1');

  // Find first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse sanitized JSON: ${err.message}. Raw text preview: ${cleaned.substring(0, 120)}`);
  }
}

module.exports = { sanitizeAndParseJSON };
