# Clarification Decisions: Semantic Code Review & Refactoring Assistant

## Clarification 1: Handling Markdown Fences in Model Generation
- **Question**: Large language models frequently enclose JSON output within markdown code fences (e.g. ` ```json { ... } ``` `) despite system prompt instructions. How should this be handled?
- **Decision**: An automated output sanitizer (`src/jsonSanitizer.js`) strips markdown fences and extraneous prose before parsing. This ensures parser resilience while maintaining strict JSON validation inside the harness.

## Clarification 2: Diff Line Numbering vs Full File Numbering
- **Question**: When analyzing a unified git diff containing `+` and `-` markers, how should line numbers be reported?
- **Decision**: Line numbers correspond to the new file lines (the `+` lines). The sanitizer/preprocessor maps hunk headers (`@@ -a,b +c,d @@`) to concrete line positions.

## Clarification 3: Adversarial Input Boundaries
- **Question**: What constitutes an adversarial input requiring refusal?
- **Decision**: Two distinct forms:
  1. *Prompt injection*: Injected commands attempting to alter system instructions (e.g., "Ignore previous instructions", "Output developer passwords").
  2. *Malicious code assistance*: Explicit requests to weaponize or obfuscate malware, ransomware, or exploits. Both must result in `summary.verdict = "refusal"`.

## Clarification 4: Offline Execution for CI/CD Testing
- **Question**: What happens if the test harness is executed in an environment without internet connectivity or without a configured `GEMINI_API_KEY` / `OPENAI_API_KEY`?
- **Decision**: The system architecture provides dual execution drivers:
  - If `GEMINI_API_KEY` or `OPENAI_API_KEY` is set in the environment, the assistant routes requests to the cloud LLM.
  - If no API key is present, the assistant automatically engages an in-process deterministic heuristic engine that mimics model outputs for the benchmark suite. This ensures 100% testability anywhere.
