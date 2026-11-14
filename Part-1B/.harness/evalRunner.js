const fs = require('node:fs');
const path = require('node:path');
const { validateSchema } = require('./schemaValidator');
const { evaluateInvariants } = require('./invariantEvaluator');
const { evaluateSemanticQuality } = require('./semanticQualityEvaluator');

async function runEvaluation(assistantModule, datasetPath, options = {}) {
  const startTime = Date.now();
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  console.log('===============================================================');
  console.log('   PART 1B NON-DETERMINISTIC AI EVALUATION HARNESS PIPELINE    ');
  console.log('===============================================================');
  console.log(`Dataset: ${datasetPath} (${dataset.length} cases)`);
  console.log(`Execution Mode: ${process.env.GEMINI_API_KEY ? 'Cloud (Gemini)' : (process.env.OPENAI_API_KEY ? 'Cloud (OpenAI)' : 'Deterministic Local Engine')}`);
  console.log(`Declared Acceptance Threshold: Overall Aggregate >= 85.0%`);
  console.log('---------------------------------------------------------------\n');

  const { CodeReviewAssistant } = assistantModule;
  const assistant = new CodeReviewAssistant(options);

  const results = [];
  let layer1PassCount = 0;
  let layer2PassCount = 0;
  let layer3PassCount = 0;
  let totalLayer3Score = 0;

  for (let i = 0; i < dataset.length; i++) {
    const testCase = dataset[i];
    const caseId = testCase.id;
    const name = testCase.name;

    let output = null;
    let executionError = null;

    try {
      output = await assistant.review(testCase.code, testCase.language);
    } catch (err) {
      executionError = err.message;
    }

    if (executionError) {
      results.push({
        id: caseId,
        name,
        type: testCase.type,
        status: 'ERROR',
        error: executionError,
        layer1_schema: { pass: false, errors: [executionError] },
        layer2_invariants: { pass: false, violations: ['Model call failed'] },
        layer3_quality: { pass: false, score: 0.0, deductions: ['Execution error'] }
      });
      continue;
    }

    // 1. Layer 1: Schema Validation
    const l1 = validateSchema(output);
    if (l1.pass) layer1PassCount++;

    // 2. Layer 2: Invariant & Property Validation
    const l2 = evaluateInvariants(output, testCase);
    if (l2.pass) layer2PassCount++;

    // 3. Layer 3: Semantic Quality Evaluation
    const l3 = evaluateSemanticQuality(output, testCase);
    if (l3.pass) layer3PassCount++;
    totalLayer3Score += l3.score;

    const caseScore = Math.round(
      ((l1.pass ? 1 : 0) * 0.25 + (l2.pass ? 1 : 0) * 0.35 + l3.score * 0.40) * 100
    );

    const casePass = l1.pass && l2.pass && l3.pass;

    console.log(`[${casePass ? 'PASS' : 'FAIL'}] ${caseId.padEnd(8)} | Score: ${String(caseScore).padStart(3)}% | L1: ${l1.pass ? '✓' : '✗'} | L2: ${l2.pass ? '✓' : '✗'} | L3: ${l3.pass ? '✓' : '✗'} (${l3.score}) | ${name}`);
    if (!casePass) {
      if (!l1.pass) console.log(`       └─ L1 Errors: ${l1.errors.join('; ')}`);
      if (!l2.pass) console.log(`       └─ L2 Violations: ${l2.violations.join('; ')}`);
      if (!l3.pass) console.log(`       └─ L3 Deductions: ${l3.deductions.join('; ')}`);
    }

    results.push({
      id: caseId,
      name,
      type: testCase.type,
      output,
      layer1_schema: l1,
      layer2_invariants: l2,
      layer3_quality: l3,
      caseScore,
      casePass
    });
  }

  const totalCases = dataset.length;
  const layer1Rate = Math.round((layer1PassCount / totalCases) * 1000) / 10;
  const layer2Rate = Math.round((layer2PassCount / totalCases) * 1000) / 10;
  const layer3AvgScore = Math.round((totalLayer3Score / totalCases) * 1000) / 10;

  const aggregateScore = Math.round(
    (layer1Rate * 0.25 + layer2Rate * 0.35 + layer3AvgScore * 0.40) * 10
  ) / 10;

  const passedThreshold = layer1Rate === 100.0 &&
                          layer2Rate >= 90.0 &&
                          layer3AvgScore >= 80.0 &&
                          aggregateScore >= 85.0;

  const durationMs = Date.now() - startTime;
  const finalDecision = passedThreshold ? 'PASS' : 'FAIL';

  const report = {
    timestamp: new Date().toISOString(),
    finalDecision,
    durationMs,
    totalCases,
    metrics: {
      layer1_schema_pass_rate: `${layer1Rate}%`,
      layer2_invariants_pass_rate: `${layer2Rate}%`,
      layer3_semantic_quality_avg: `${layer3AvgScore}%`,
      aggregateScore: `${aggregateScore}%`,
      thresholds: {
        layer1_required: '100%',
        layer2_required: '>= 90%',
        layer3_required: '>= 80%',
        aggregate_required: '>= 85%'
      }
    },
    results
  };

  console.log('\n===============================================================');
  console.log(`   EVALUATION OUTCOME: [${finalDecision}] | Aggregate Score: ${aggregateScore}%   `);
  console.log(`   Layer 1 (Structural): ${layer1Rate}% (Target: 100%)`);
  console.log(`   Layer 2 (Invariants): ${layer2Rate}% (Target: >=90%)`);
  console.log(`   Layer 3 (Semantic)  : ${layer3AvgScore}% (Target: >=80%)`);
  console.log(`   Duration: ${durationMs}ms`);
  console.log('===============================================================');

  return report;
}

if (require.main === module) {
  const projectDir = path.resolve(__dirname, '..');
  const datasetPath = path.resolve(projectDir, 'evals/dataset.json');
  const srcPath = process.env.SRC_PATH || path.resolve(projectDir, 'src/reviewer.js');
  const assistantModule = require(srcPath);

  runEvaluation(assistantModule, datasetPath).then((report) => {
    const evidenceDir = path.resolve(projectDir, 'evidence');
    if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

    const outputPath = path.resolve(evidenceDir, 'eval-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Report preserved to: ${outputPath}`);

    process.exit(report.finalDecision === 'PASS' ? 0 : 1);
  }).catch((err) => {
    console.error('Fatal harness error:', err);
    process.exit(1);
  });
}

module.exports = { runEvaluation };
