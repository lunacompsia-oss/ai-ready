const path = require('path');
const { scanRepo } = require('./scanner');
const { scoreRepo } = require('./scorer');
const { generateConfigs, generateBadgeMarkdown } = require('./generator');

function run() {
  const isAction = !!process.env.GITHUB_ACTIONS;
  let repoPath, mode, outputDir, addBadge;

  if (isAction) {
    const core = require('@actions/core');
    try {
      repoPath = process.env.GITHUB_WORKSPACE || '.';
      mode = core.getInput('mode') || 'full';
      outputDir = core.getInput('output-dir') || '.';
      addBadge = core.getInput('badge') !== 'false';

      const result = execute(repoPath, mode, outputDir, addBadge);

      core.setOutput('score', result.score);
      core.setOutput('grade', result.grade);
      core.setOutput('report', JSON.stringify(result));
      core.setOutput('files-generated', result.filesGenerated.join(','));

      // Post summary to GitHub Actions
      core.summary
        .addHeading('AI Readiness Report', 2)
        .addRaw(`**Score: ${result.score}/100 (Grade: ${result.grade})**\n\n`)
        .addTable([
          [{ data: 'Category', header: true }, { data: 'Score', header: true }, { data: 'Max', header: true }, { data: 'Details', header: true }],
          ...result.breakdown.map(b => [b.category, String(b.score), String(b.max), b.reason])
        ])
        .addRaw('\n\n')
        .addRaw(`**Languages:** ${result.languages.map(l => l.language).join(', ')}\n`)
        .addRaw(`**Frameworks:** ${result.frameworks.join(', ') || 'None detected'}\n`);

      if (result.filesGenerated.length) {
        core.summary.addRaw(`\n**Generated:** ${result.filesGenerated.join(', ')}\n`);
      }

      core.summary.write();

      if (result.score < 40) {
        core.warning(`AI Readiness score is ${result.score}/100 (Grade: ${result.grade}). Your repo could benefit from AI config files.`);
      }
    } catch (error) {
      core.setFailed(error.message);
    }
  } else {
    // CLI mode
    repoPath = process.argv[2] || '.';
    mode = process.argv[3] || 'full';
    outputDir = process.argv[4] || repoPath;
    addBadge = !process.argv.includes('--no-badge');

    const result = execute(repoPath, mode, outputDir, addBadge);
    printReport(result);
  }
}

function execute(repoPath, mode, outputDir, addBadge) {
  repoPath = path.resolve(repoPath);
  outputDir = path.resolve(outputDir);

  // Scan
  const scan = scanRepo(repoPath);

  // Score
  const scoreResult = scoreRepo(scan);

  let filesGenerated = [];

  // Generate configs if mode is 'generate' or 'full'
  if (mode === 'generate' || mode === 'full') {
    filesGenerated = generateConfigs(scan, scoreResult, outputDir);
  }

  return {
    score: scoreResult.score,
    grade: scoreResult.grade,
    breakdown: scoreResult.breakdown,
    summary: scoreResult.summary,
    languages: scan.languages,
    frameworks: scan.frameworks,
    primaryLanguage: scan.primaryLanguage,
    existingAiConfigs: scan.existingAiConfigs,
    filesGenerated,
    badge: generateBadgeMarkdown(scoreResult.score),
    totalFiles: scan.totalFiles,
  };
}

function printReport(result) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    AI READINESS REPORT                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Score: ${result.score}/100  Grade: ${result.grade}`);
  console.log(`  Files scanned: ${result.totalFiles}`);
  console.log(`  Primary language: ${result.primaryLanguage}`);
  if (result.frameworks.length) {
    console.log(`  Frameworks: ${result.frameworks.join(', ')}`);
  }
  console.log('');
  console.log('  ─── Breakdown ───');
  console.log('');

  for (const b of result.breakdown) {
    const bar = '█'.repeat(b.score) + '░'.repeat(b.max - b.score);
    const pad = b.category.padEnd(14);
    console.log(`  ${pad} ${bar} ${b.score}/${b.max}`);
    console.log(`  ${''.padEnd(14)} ${b.reason}`);
  }

  console.log('');

  if (result.existingAiConfigs.length) {
    console.log(`  Existing AI configs: ${result.existingAiConfigs.join(', ')}`);
  }

  if (result.filesGenerated.length) {
    console.log(`  Generated: ${result.filesGenerated.join(', ')}`);
  }

  console.log('');
  console.log('  ─── Badge ───');
  console.log('');
  console.log(`  ${result.badge}`);
  console.log('');
}

run();
