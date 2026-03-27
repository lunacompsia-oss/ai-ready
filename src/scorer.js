function scoreRepo(scan) {
  const breakdown = [];
  let total = 0;

  function add(name, points, max, reason) {
    const capped = Math.min(points, max);
    total += capped;
    breakdown.push({ category: name, score: capped, max, reason });
  }

  // 1. README quality (0-15)
  if (scan.hasReadme) {
    if (scan.readmeLength > 2000) add('README', 15, 15, 'Comprehensive README (2000+ chars)');
    else if (scan.readmeLength > 500) add('README', 10, 15, 'Good README (500+ chars)');
    else add('README', 5, 15, 'Basic README present');
  } else {
    add('README', 0, 15, 'No README found — AI tools need project context');
  }

  // 2. Project structure (0-10)
  if (scan.hasSrcDir && scan.topLevelDirs.length >= 2) {
    add('Structure', 10, 10, 'Clear project structure with organized directories');
  } else if (scan.topLevelDirs.length >= 1) {
    add('Structure', 5, 10, 'Basic directory structure');
  } else {
    add('Structure', 0, 10, 'Flat structure — AI tools work better with organized directories');
  }

  // 3. Dependency manifest (0-10)
  if (scan.hasManifest) {
    add('Dependencies', 10, 10, 'Package manifest found — AI can understand dependencies');
  } else {
    add('Dependencies', 0, 10, 'No package manifest — AI cannot infer dependencies');
  }

  // 4. Tests (0-15)
  if (scan.testFileCount >= 10) {
    add('Tests', 15, 15, `Strong test suite (${scan.testFileCount} test files)`);
  } else if (scan.testFileCount >= 3) {
    add('Tests', 10, 15, `Moderate test coverage (${scan.testFileCount} test files)`);
  } else if (scan.hasTests) {
    add('Tests', 5, 15, 'Some tests present');
  } else {
    add('Tests', 0, 15, 'No tests found — AI tools cannot verify changes');
  }

  // 5. CI/CD (0-5)
  if (scan.hasCi) {
    add('CI/CD', 5, 5, 'CI/CD pipeline configured');
  } else {
    add('CI/CD', 0, 5, 'No CI/CD — AI-generated code has no automated verification');
  }

  // 6. AI config files (0-15)
  if (scan.existingAiConfigs.length >= 3) {
    add('AI Config', 15, 15, `Multiple AI configs: ${scan.existingAiConfigs.join(', ')}`);
  } else if (scan.existingAiConfigs.length >= 1) {
    add('AI Config', 8, 15, `Some AI config: ${scan.existingAiConfigs.join(', ')}`);
  } else {
    add('AI Config', 0, 15, 'No AI config files — tools use generic behavior');
  }

  // 7. Type safety (0-10)
  if (scan.hasTypes) {
    add('Type Safety', 10, 10, 'Type annotations present — AI produces more accurate code');
  } else {
    add('Type Safety', 0, 10, 'No type annotations — AI may generate type-unsafe code');
  }

  // 8. Linting/Formatting (0-5)
  if (scan.hasLinting) {
    add('Code Style', 5, 5, 'Linter/formatter configured — AI follows your style');
  } else {
    add('Code Style', 0, 5, 'No linter — AI-generated code may not match your style');
  }

  // 9. Documentation (0-10)
  if (scan.hasDocs && scan.hasContributing) {
    add('Documentation', 10, 10, 'Docs directory + contributing guide');
  } else if (scan.hasDocs || scan.hasContributing) {
    add('Documentation', 5, 10, 'Some documentation present');
  } else {
    add('Documentation', 0, 10, 'No docs — AI lacks architectural context');
  }

  // 10. License (0-5)
  if (scan.hasLicense) {
    add('License', 5, 5, 'License file present');
  } else {
    add('License', 0, 5, 'No license file');
  }

  // Calculate grade
  let grade;
  if (total >= 90) grade = 'A';
  else if (total >= 75) grade = 'B';
  else if (total >= 60) grade = 'C';
  else if (total >= 40) grade = 'D';
  else grade = 'F';

  return {
    score: total,
    maxScore: 100,
    grade,
    breakdown,
    summary: generateSummary(scan, total, grade, breakdown),
  };
}

function generateSummary(scan, score, grade, breakdown) {
  const missing = breakdown.filter(b => b.score === 0).map(b => b.category);
  const strong = breakdown.filter(b => b.score === b.max).map(b => b.category);

  let summary = `AI Readiness: ${score}/100 (Grade: ${grade})\n`;
  summary += `Primary: ${scan.primaryLanguage}`;
  if (scan.frameworks.length) summary += ` | Frameworks: ${scan.frameworks.join(', ')}`;
  summary += '\n';

  if (strong.length) summary += `Strengths: ${strong.join(', ')}\n`;
  if (missing.length) summary += `Needs work: ${missing.join(', ')}\n`;

  return summary;
}

module.exports = { scoreRepo };
