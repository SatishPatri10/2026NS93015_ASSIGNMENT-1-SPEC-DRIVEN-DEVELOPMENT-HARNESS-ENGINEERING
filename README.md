# BITS Pilani - AI-Augmented Software Development Life Cycle (SEZG534)

## Assignment 1: Spec-Driven Development & Harness Engineering

---

### Project Overview

This repository contains the complete implementation and verification artifacts for **Assignment 1**, showcasing how **GitHub Spec Kit** and **Automated Verification Harnesses** constrain, validate, and repair AI-assisted software implementations across both deterministic and non-deterministic paradigms.

| Module      | Application                                      | Engineering Focus                                                                                              | Final Harness Status                            |
| ----------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Part 1A** | **Tiered Rate Limiter Microservice**             | Deterministic token-bucket algorithm, RFC 6585 compliance, in-memory client storage, SAST/lint/contract guards | **PASS (100% - 13/13 tests)**                   |
| **Part 1B** | **Semantic Code Review & Refactoring Assistant** | Non-deterministic AI behavior, 16-case benchmark evaluation dataset, 3-layer validation harness                | **PASS (98.8% Aggregate Score)**                |
| **Part 2**  | **Assessed Reflection Report**                   | Detailed, evidence-based answers to all 5 assessed reflection questions                                        | **Documented in `Reflection_Report_PART_2.md`** |

---

## 1. Repository Structure

```
Assignment-1/
├── README.md                                 # Master repository documentation & quick start
├── Reflection_Report_PART_2.md               # LMS Submission Reflection Report (Assessed Part 2)
│
├── Part-1A/                                  # Deterministic Application
│   ├── .specify/                             # Spec Kit configuration, scripts, & constitution
│   ├── specs/001-tiered-rate-limiter/        # spec.md, clarifications.md, plan.md, tasks.md
│   ├── src/                                  # Production source code
│   │   ├── config/tiers.js                   # Free, Standard, Premium tier definitions & key mappings
│   │   ├── limiter/tokenBucket.js            # Pure token bucket engine with continuous refill
│   │   ├── limiter/memoryStore.js            # In-memory store with TTL idle eviction
│   │   ├── middleware/rateLimiterMiddleware.js# Express/HTTP middleware with RFC 6585 headers
│   │   ├── app.js                            # Application request dispatcher
│   │   └── server.js                         # Standalone HTTP microservice listener
│   ├── tests/                                # Automated binary assertions (Node test runner)
│   │   ├── tokenBucket.test.js               # Mathematical token bucket unit tests
│   │   ├── apiRateLimit.test.js              # HTTP contract & status transition tests
│   │   └── testHelper.js                     # In-memory mock request/response test runner
│   ├── .harness/                             # Multi-gate deterministic harness
│   │   ├── lint-guard.js                     # Gate 1: Syntax & Static lint validator
│   │   ├── security-guard.js                 # Gate 2: SAST security & memory-leak guard
│   │   ├── test-runner.js                    # Gate 3: Unit & contract test suite runner
│   │   └── run-harness.js                    # 3-gate orchestrator & report generator
│   ├── evidence/                             # Preserved development audit artifacts
│   │   ├── initial-generation/               # Pre-repair implementation snapshot
│   │   ├── initial-run.json                  # First harness run output (shows failure)
│   │   ├── final-generation/                 # Repaired implementation snapshot
│   │   ├── final-run.json                    # Final harness run output (100% PASS)
│   │   ├── harness-results.json              # Latest execution report
│   │   └── harness-log.md                    # Detailed self-healing audit log & human review
│   └── package.json
│
└── Part-1B/                                  # Non-Deterministic AI Application
    ├── .specify/                             # Spec Kit configuration, scripts, & constitution
    ├── specs/001-semantic-code-reviewer/     # spec.md, clarifications.md, plan.md, tasks.md
    ├── src/                                  # Production source code
    │   ├── reviewer.js                       # Code review orchestrator (Cloud LLM + Local engine)
    │   ├── inputGuardrail.js                 # Inbound prompt-injection & safety filter
    │   ├── jsonSanitizer.js                  # Markdown fence stripper & strict JSON parser
    │   └── localEngine.js                    # Deterministic offline semantic analysis engine
    ├── prompts/
    │   ├── system-prompt.txt                 # Prompt schema contract & operational rules
    │   └── user-prompt-template.txt          # Review request template
    ├── tests/
    │   └── reviewer.test.js                  # Component & functional unit tests
    ├── evals/
    │   └── dataset.json                      # 16 benchmark cases across 6 requirement categories
    ├── .harness/                             # 3-layer evaluation harness pipeline
    │   ├── schemaValidator.js                # Layer 1: JSON schema structural validator
    │   ├── invariantEvaluator.js             # Layer 2: Invariant & property boundary evaluator
    │   ├── semanticQualityEvaluator.js       # Layer 3: Semantic rubric & quality evaluator
    │   └── evalRunner.js                     # Single evaluation harness pipeline runner
    ├── evidence/                             # Preserved evaluation audit artifacts
    │   ├── initial-generation/               # Pre-repair code snapshot
    │   ├── eval-results-initial.json         # First evaluation run output (FAIL: 76.1%)
    │   ├── final-generation/                 # Repaired code snapshot
    │   ├── eval-results.json                 # Final evaluation run output (PASS: 98.8%)
    │   └── harness-log.md                    # Comprehensive repair trace & human decision
    └── package.json
```

---

## 2. Quick Start, Commands & Execution Logs Reference

Both applications use **zero external runtime dependencies** for test and harness execution, guaranteeing instant, 100% reliable execution in any environment without requiring `npm install` or active internet connectivity.

### Execution Commands & Preserved Log Files

| Command Description                                 | Terminal Command                                                                           | Result                                   | Saved Log File                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| **Part 1A Unit & Contract Tests**                   | `node --test tests/tokenBucket.test.js tests/apiRateLimit.test.js` (in `Part-1A`)          | **13/13 Pass (100%)**                    | [`logs/part1a_tests.log`](logs/part1a_tests.log)                                     |
| **Part 1A Deterministic Harness** (Gates 1, 2, 3)   | `node .harness/run-harness.js` (in `Part-1A`)                                              | **PASS (100%)**                          | [`logs/part1a_harness.log`](logs/part1a_harness.log)                                 |
| **Part 1A Initial Failure Harness** (Pre-repair)    | `$env:SRC_DIR="evidence/initial-generation/src"; node .harness/run-harness.js`             | **FAIL** (Gate 2 SAST + Gate 3 Contract) | [`logs/part1a_initial_failure_harness.log`](logs/part1a_initial_failure_harness.log) |
| **Part 1B Component & Unit Tests**                  | `node --test tests/reviewer.test.js` (in `Part-1B`)                                        | **7/7 Pass (100%)**                      | [`logs/part1b_tests.log`](logs/part1b_tests.log)                                     |
| **Part 1B 3-Layer Evaluation Harness** (16 Cases)   | `node .harness/evalRunner.js` (in `Part-1B`)                                               | **PASS (98.8% Aggregate)**               | [`logs/part1b_eval_harness.log`](logs/part1b_eval_harness.log)                       |
| **Part 1B Initial Failure Evaluation** (Pre-repair) | `$env:SRC_PATH="evidence/initial-generation/src/reviewer.js"; node .harness/evalRunner.js` | **FAIL (76.1% < 85%)**                   | [`logs/part1b_initial_failure_eval.log`](logs/part1b_initial_failure_eval.log)       |

---

### Step-by-Step Terminal Instructions

#### Running Part 1A (Deterministic Harness)

```powershell
cd Part-1A

# 1. Run unit and contract tests directly
node --test tests/tokenBucket.test.js tests/apiRateLimit.test.js

# 2. Run the full 3-gate deterministic harness (Lint -> Security -> Tests)
node .harness/run-harness.js
```

#### Running Part 1B (Non-Deterministic AI Evaluation Harness)

```powershell
cd Part-1B

# 1. Run component tests
node --test tests/reviewer.test.js

# 2. Run the 3-layer non-deterministic evaluation harness (16 cases)
node .harness/evalRunner.js
```

_(Optional: If you wish to test Part 1B against live cloud LLMs, set `$env:GEMINI_API_KEY="your-key"` or `$env:OPENAI_API_KEY="your-key"`; the harness will automatically route to the cloud API while maintaining the same 3-layer validation pipeline!)_

---

## 3. Key Verification Results

### Part 1A Deterministic Harness Run

- **Gate 1 (Syntax & Lint)**: PASS (0 violations across all files)
- **Gate 2 (SAST Security Guard)**: PASS (0 vulnerabilities detected; TTL eviction verified)
- **Gate 3 (Unit & Contract Tests)**: PASS (13/13 tests passing, duration ~520ms)
- **Self-Healing Repair Cycle**: Detected missing `Retry-After` header and unbounded cache in `initial-generation/`, repaired root causes, and achieved 100% PASS on re-execution.

### Part 1B Non-Deterministic Evaluation Run

- **Layer 1 (Structural Invariants)**: 100% Pass (16/16 cases conform to JSON schema contract)
- **Layer 2 (Property & Invariant Boundaries)**: 100% Pass (16/16 cases satisfy line bounds and refusal rules)
- **Layer 3 (Semantic & Quality Rubric)**: 96.9% Average Score (Target: $\ge 80\%$)
- **Aggregate Score**: **98.8%** (Pre-declared threshold: $\ge 85\%$)
- **Self-Healing Repair Cycle**: Detected prompt-injection bypass and ReDoS diff parsing omissions in `initial-generation/` (initial score: 76.1% FAIL), patched guardrails and regex parsers, achieving 98.8% PASS.

---

## 4. Assessment Deliverables Checklist

- [x] Part 1A and Part 1B fully implemented and verified.
- [x] Full GitHub Spec Kit SDD artifacts present (`constitution.md`, `spec.md`, `clarifications.md`, `plan.md`, `tasks.md`).
- [x] Part 1A deterministic harness (Lint, SAST, Unit/Contract) operational.
- [x] Part 1B non-deterministic harness (Layer 1 Schema, Layer 2 Invariants, Layer 3 Semantic) operational.
- [x] 16 evaluation benchmark cases covering normal, boundary, ambiguous, missing mandatory, malformed, and adversarial inputs.
- [x] Both parts include preserved initial generation, failure reports, final generation, and `harness-log.md`.
- [x] Reflection Report answering all 5 assessed questions prepared in `Reflection_Report_PART_2.md`.
- [x] Zero API keys or secrets committed to repository.
