# Implementation Tasks: Semantic Code Review & Refactoring Assistant

## Task Overview & Traceability Mapping

Each task maps directly to the Output Schema Contract, Structural Invariants, Behavioural Properties, and Evaluation Expectations in `spec.md`.

- [x] **Task 1: Prompt Engineering & Templates**
  - Formulate `prompts/system-prompt.txt` with schema contract, allowed enums, and guardrails.
  - Implement `prompts/user-prompt-template.txt`.
  - _Maps to: Schema Contract & System Boundaries_

- [x] **Task 2: Evaluation Benchmark Dataset (16 Cases)**
  - Construct `evals/dataset.json` with 16 test cases covering:
    - Normal (SQLi, ReDoS, nested loops, unhandled promise)
    - Boundary (1-line off-by-one, clean code zero findings, multi-file diff)
    - Ambiguous (missing imports, truncated code fragment)
    - Missing mandatory (empty input, non-code text)
    - Malformed (corrupt binary / base64)
    - Adversarial & Guardrails (prompt injection, ransomware assistance request)
  - _Maps to: Section 4.5 Evaluation Dataset Expectations_

- [x] **Task 3: Core Reviewer Engine & Sanitizer**
  - Implement `src/jsonSanitizer.js` to strip markdown fences and parse JSON.
  - Implement `src/inputGuardrail.js` to intercept prompt injection and invalid inputs.
  - Implement `src/localEngine.js` deterministic offline fallback.
  - Implement `src/reviewer.js` orchestrating guardrail, LLM call, and fallback.
  - _Maps to: INV-1 through INV-4, PROP-1 through PROP-4_

- [x] **Task 4: Three-Layer Evaluation Harness**
  - Implement `.harness/schemaValidator.js` (Layer 1 Structural validation).
  - Implement `.harness/invariantEvaluator.js` (Layer 2 Property & Invariant validation).
  - Implement `.harness/semanticQualityEvaluator.js` (Layer 3 Rubric & Quality validation).
  - Implement `.harness/evalRunner.js` (Pipeline orchestrator, scoring against 85% threshold).
  - _Maps to: Section 4.6 & 4.7 Harness Validation Pipeline_

- [x] **Task 5: Failure Capture & Self-Healing Repair**
  - Capture initial failure in `evidence/initial-generation/` and `evidence/eval-results-initial.json`.
  - Feed failure evidence to coding agent and apply targeted repair to guardrail and prompt.
  - Re-evaluate repaired code in `evidence/final-generation/` and verify PASS in `evidence/eval-results.json`.
  - Record audit trail and human ACCEPT review in `evidence/harness-log.md`.
  - _Maps to: Section 4.8 & 4.10 Harness-Driven Repair & Log_
