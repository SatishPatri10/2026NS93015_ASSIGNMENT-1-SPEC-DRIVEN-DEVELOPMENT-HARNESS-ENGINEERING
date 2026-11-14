# Technical Plan: Semantic Code Review & Refactoring Assistant

## 1. System Architecture
```
[ Input: Code Snippet / Diff / Prompt ]
                 │
                 ▼
     [ Input Guardrail Filter ] ── (Rejects prompt injection, empty, or non-code) ──┐
                 │                                                                 │
                 ▼ (Passes)                                                        ▼
      [ Reviewer Engine ]                                                  [ Refusal Response ]
   ├── Cloud LLM Driver (Gemini / OpenAI)                                          │
   └── Local Semantic Heuristic Engine (Fallback)                                  │
                 │                                                                 │
                 ▼                                                                 │
      [ Output JSON Sanitizer ] ◄──────────────────────────────────────────────────┘
                 │
                 ▼
  [ 3-Layer Evaluation Harness ]
   ├── Layer 1: SchemaValidator (AJV/JSON Schema Contract)
   ├── Layer 2: InvariantEvaluator (Line Bounds, Refusals, Clean Code)
   └── Layer 3: SemanticQualityEvaluator (Category Rubrics, Score Calibration)
                 │
                 ▼
  [ Aggregate Scoring & Pass/Fail Decision ]
```

## 2. Directory Structure
```
Part-1B/
├── .specify/                         # Spec Kit configuration and constitution
├── specs/001-semantic-code-reviewer/ # Spec, Clarifications, Plan, Tasks
├── src/
│   ├── reviewer.js                   # Core code review orchestrator
│   ├── inputGuardrail.js             # Pre-generation safety & adversarial detector
│   ├── jsonSanitizer.js              # Robust JSON fence stripper and parser
│   └── localEngine.js                # Deterministic semantic analysis engine
├── prompts/
│   ├── system-prompt.txt             # Primary LLM instructions & schema specification
│   └── user-prompt-template.txt      # Parameterized user prompt template
├── tests/
│   └── reviewer.test.js              # Functional component tests
├── evals/
│   └── dataset.json                  # 16 benchmark cases across 6 requirement categories
├── .harness/
│   ├── schemaValidator.js            # Layer 1 validator
│   ├── invariantEvaluator.js         # Layer 2 evaluator
│   ├── semanticQualityEvaluator.js   # Layer 3 rubric evaluator
│   └── evalRunner.js                 # Unified evaluation pipeline runner
├── evidence/
│   ├── initial-generation/           # First generation snapshot (shows initial failure)
│   ├── eval-results-initial.json     # Initial evaluation run output (FAIL: 78.1%)
│   ├── final-generation/             # Repaired generation snapshot
│   ├── eval-results.json             # Final evaluation run output (PASS: 95.8%)
│   └── harness-log.md                # Comprehensive audit log and human decision
└── package.json                      # Scripts and metadata
```

## 3. Technology Stack
- **Language**: Node.js (CommonJS, >= 18.x)
- **External AI Integrations**: Supported via standard HTTPS `fetch` calls to Google Gemini API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`) or OpenAI API (`https://api.openai.com/v1/chat/completions`) when keys are supplied in `process.env`.
- **Zero-Dependency Architecture**: Uses Node.js standard libraries (`node:fs`, `node:path`, `node:test`, `node:assert`, `node:https`) ensuring offline reliability.
