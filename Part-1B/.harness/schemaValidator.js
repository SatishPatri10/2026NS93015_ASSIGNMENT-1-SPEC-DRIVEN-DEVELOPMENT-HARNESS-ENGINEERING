/**
 * Layer 1: Structural Schema Validation.
 * Validates machine-checkable JSON schema constraints, field presence,
 * data types, enumerations, and mathematical count invariants.
 */
const ALLOWED_CATEGORIES = new Set(['security', 'performance', 'bug_risk', 'maintainability', 'modern_idiom']);
const ALLOWED_SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);
const ALLOWED_VERDICTS = new Set(['clean', 'needs_improvement', 'critical_revisions_required', 'refusal']);

function validateSchema(output) {
  const errors = [];

  if (!output || typeof output !== 'object') {
    return { pass: false, errors: ['Output must be a non-null JSON object'] };
  }

  // 1. Findings array validation
  if (!Array.isArray(output.findings)) {
    errors.push('Property "findings" must be an array');
  } else {
    output.findings.forEach((f, idx) => {
      const prefix = `findings[${idx}]`;
      if (!f || typeof f !== 'object') {
        errors.push(`${prefix} must be an object`);
        return;
      }

      if (typeof f.line !== 'number' || !Number.isInteger(f.line) || f.line < 1) {
        errors.push(`${prefix}.line must be a positive integer`);
      }

      if (!ALLOWED_CATEGORIES.has(f.category)) {
        errors.push(`${prefix}.category must be one of: ${Array.from(ALLOWED_CATEGORIES).join(', ')} (got '${f.category}')`);
      }

      if (!ALLOWED_SEVERITIES.has(f.severity)) {
        errors.push(`${prefix}.severity must be one of: ${Array.from(ALLOWED_SEVERITIES).join(', ')} (got '${f.severity}')`);
      }

      if (typeof f.title !== 'string' || f.title.trim().length < 3) {
        errors.push(`${prefix}.title must be a non-empty string (min length 3)`);
      }

      if (typeof f.description !== 'string' || f.description.trim().length < 5) {
        errors.push(`${prefix}.description must be an informative string (min length 5)`);
      }

      if (typeof f.suggestion !== 'string' || f.suggestion.trim().length < 5) {
        errors.push(`${prefix}.suggestion must be an actionable string (min length 5)`);
      }

      if (typeof f.refactoredSnippet !== 'string') {
        errors.push(`${prefix}.refactoredSnippet must be a string`);
      }
    });
  }

  // 2. Summary object validation
  if (!output.summary || typeof output.summary !== 'object') {
    errors.push('Property "summary" must be an object');
  } else {
    const s = output.summary;

    if (typeof s.totalFindings !== 'number' || s.totalFindings < 0) {
      errors.push('summary.totalFindings must be a non-negative integer');
    } else if (Array.isArray(output.findings) && s.totalFindings !== output.findings.length) {
      errors.push(`summary.totalFindings (${s.totalFindings}) does not match findings array length (${output.findings.length})`);
    }

    if (typeof s.riskScore !== 'number' || s.riskScore < 0 || s.riskScore > 100) {
      errors.push('summary.riskScore must be a number between 0 and 100');
    }

    if (!ALLOWED_VERDICTS.has(s.verdict)) {
      errors.push(`summary.verdict must be one of: ${Array.from(ALLOWED_VERDICTS).join(', ')} (got '${s.verdict}')`);
    }

    if (typeof s.reasoning !== 'string' || s.reasoning.trim().length < 5) {
      errors.push('summary.reasoning must be a non-empty string (min length 5)');
    }
  }

  return {
    pass: errors.length === 0,
    errors
  };
}

module.exports = { validateSchema };
