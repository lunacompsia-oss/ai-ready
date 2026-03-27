const fs = require('fs');
const path = require('path');

const LANGUAGE_MAP = {
  '.js': 'JavaScript', '.jsx': 'JavaScript (React)', '.ts': 'TypeScript',
  '.tsx': 'TypeScript (React)', '.py': 'Python', '.go': 'Go', '.rs': 'Rust',
  '.java': 'Java', '.kt': 'Kotlin', '.rb': 'Ruby', '.php': 'PHP',
  '.cs': 'C#', '.cpp': 'C++', '.c': 'C', '.swift': 'Swift',
  '.vue': 'Vue', '.svelte': 'Svelte', '.dart': 'Dart', '.zig': 'Zig',
  '.ex': 'Elixir', '.exs': 'Elixir', '.sh': 'Shell', '.lua': 'Lua',
};

const FRAMEWORK_SIGNALS = {
  'next.config': 'Next.js', 'nuxt.config': 'Nuxt', 'svelte.config': 'SvelteKit',
  'astro.config': 'Astro', 'vite.config': 'Vite', 'webpack.config': 'Webpack',
  'angular.json': 'Angular', 'remix.config': 'Remix',
  'tailwind.config': 'Tailwind CSS', 'postcss.config': 'PostCSS',
  'prisma/schema.prisma': 'Prisma', 'drizzle.config': 'Drizzle',
  'django': 'Django', 'flask': 'Flask', 'fastapi': 'FastAPI',
  'Cargo.toml': 'Rust/Cargo', 'go.mod': 'Go Modules',
  'Gemfile': 'Ruby/Bundler', 'composer.json': 'PHP/Composer',
  'build.gradle': 'Gradle', 'pom.xml': 'Maven',
  'Dockerfile': 'Docker', 'docker-compose': 'Docker Compose',
  'wrangler.toml': 'Cloudflare Workers', 'vercel.json': 'Vercel',
  'netlify.toml': 'Netlify', 'fly.toml': 'Fly.io',
};

const TEST_PATTERNS = [
  '**/*.test.*', '**/*.spec.*', '**/*_test.*', '**/test_*',
  '**/tests/**', '**/__tests__/**', '**/spec/**',
  'jest.config*', 'vitest.config*', 'pytest.ini', 'setup.cfg',
  '.mocharc*', 'cypress.config*', 'playwright.config*',
];

const CI_PATTERNS = [
  '.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile',
  '.circleci', '.travis.yml', 'azure-pipelines.yml',
  'bitbucket-pipelines.yml', '.buildkite',
];

const AI_CONFIG_FILES = [
  'CLAUDE.md', '.claude/CLAUDE.md', '.cursorrules', '.cursorignore',
  '.github/copilot-instructions.md', '.aider.conf.yml',
  'coderabbit.yaml', '.coderabbit.yaml', '.devin',
];

const LINT_CONFIGS = [
  '.eslintrc*', '.eslintrc.json', '.eslintrc.js', '.eslintrc.yml', 'eslint.config*',
  '.prettierrc*', 'prettier.config*', '.editorconfig',
  'biome.json', 'deno.json', 'ruff.toml', 'pyproject.toml',
  '.rubocop.yml', '.golangci.yml', 'clippy.toml',
  'tsconfig.json', 'jsconfig.json',
];

function walkDir(dir, maxDepth = 4, depth = 0) {
  const results = [];
  if (depth > maxDepth) return results;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && depth === 0 && entry.name !== '.github') continue;
    if (['node_modules', 'vendor', 'dist', 'build', '.git', '__pycache__', '.next', '.nuxt', 'target', 'venv', '.venv'].includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push({ path: fullPath, name: entry.name, type: 'dir', depth });
      results.push(...walkDir(fullPath, maxDepth, depth + 1));
    } else {
      results.push({ path: fullPath, name: entry.name, type: 'file', depth, ext: path.extname(entry.name) });
    }
  }
  return results;
}

function fileExists(repoPath, patterns) {
  for (const pattern of patterns) {
    const target = path.join(repoPath, pattern);
    if (fs.existsSync(target)) return true;
    // Check with glob-like matching for wildcard patterns
    if (pattern.includes('*')) {
      const dir = path.dirname(target);
      const base = path.basename(pattern).replace('*', '');
      try {
        const files = fs.readdirSync(dir.replace(/\*/g, ''));
        if (files.some(f => f.includes(base.replace('*', '')))) return true;
      } catch { /* dir doesn't exist */ }
    }
  }
  return false;
}

function findMatchingFiles(entries, patterns) {
  const found = [];
  for (const entry of entries) {
    if (entry.type !== 'file') continue;
    for (const pattern of patterns) {
      const patternBase = path.basename(pattern).replace(/\*/g, '');
      if (entry.name.includes(patternBase) && patternBase.length > 0) {
        found.push(entry);
        break;
      }
    }
  }
  return found;
}

function scanRepo(repoPath) {
  const entries = walkDir(repoPath);
  const files = entries.filter(e => e.type === 'file');
  const dirs = entries.filter(e => e.type === 'dir');

  // Detect languages
  const langCounts = {};
  for (const file of files) {
    const lang = LANGUAGE_MAP[file.ext];
    if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1;
  }
  const languages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({ language: lang, fileCount: count }));

  const primaryLanguage = languages[0]?.language || 'Unknown';

  // Detect frameworks
  const frameworks = [];
  for (const [signal, name] of Object.entries(FRAMEWORK_SIGNALS)) {
    for (const entry of entries) {
      if (entry.name.startsWith(signal) || entry.path.includes(signal)) {
        if (!frameworks.includes(name)) frameworks.push(name);
        break;
      }
    }
  }

  // Check for README
  const hasReadme = files.some(f => f.name.toLowerCase() === 'readme.md' || f.name.toLowerCase() === 'readme');
  let readmeLength = 0;
  if (hasReadme) {
    const readmeFile = files.find(f => f.name.toLowerCase() === 'readme.md' || f.name.toLowerCase() === 'readme');
    try { readmeLength = fs.readFileSync(readmeFile.path, 'utf-8').length; } catch { }
  }

  // Check for package manifest
  const hasManifest = files.some(f =>
    ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'Gemfile',
     'composer.json', 'build.gradle', 'pom.xml', 'requirements.txt'].includes(f.name)
  );

  // Check for tests
  const testFiles = findMatchingFiles(files, ['test', 'spec', '_test', 'test_']);
  const testDirs = dirs.filter(d => ['tests', 'test', '__tests__', 'spec', 'e2e', 'integration'].includes(d.name));
  const hasTests = testFiles.length > 0 || testDirs.length > 0;
  const testFileCount = testFiles.length;

  // Check for CI/CD
  const hasCi = CI_PATTERNS.some(p => {
    const target = path.join(repoPath, p);
    return fs.existsSync(target);
  });

  // Check for existing AI configs
  const existingAiConfigs = [];
  for (const config of AI_CONFIG_FILES) {
    const target = path.join(repoPath, config);
    if (fs.existsSync(target)) existingAiConfigs.push(config);
  }

  // Check for linting/formatting
  const lintFiles = findMatchingFiles(files, LINT_CONFIGS.map(p => p.replace('*', '')));
  const hasLinting = lintFiles.length > 0 || files.some(f =>
    ['tsconfig.json', 'jsconfig.json', 'biome.json', 'pyproject.toml', '.editorconfig'].includes(f.name)
  );

  // Check for type safety
  const hasTypes = files.some(f => ['.ts', '.tsx'].includes(f.ext)) ||
    files.some(f => f.name === 'tsconfig.json') ||
    files.some(f => f.name.endsWith('.pyi')) ||
    files.some(f => f.name === 'py.typed');

  // Check for docs
  const docDirs = dirs.filter(d => ['docs', 'doc', 'documentation', 'wiki'].includes(d.name));
  const hasDocs = docDirs.length > 0;

  // Check for contributing guide
  const hasContributing = files.some(f => f.name.toLowerCase().startsWith('contributing'));

  // Check for license
  const hasLicense = files.some(f => f.name.toLowerCase().startsWith('license') || f.name.toLowerCase().startsWith('licence'));

  // Folder structure analysis
  const topLevelDirs = dirs.filter(d => d.depth === 0).map(d => d.name);
  const hasSrcDir = topLevelDirs.some(d => ['src', 'lib', 'app', 'pkg', 'internal', 'cmd'].includes(d));

  // Count lines in key files for depth analysis
  const totalFiles = files.length;

  return {
    repoPath,
    totalFiles,
    languages,
    primaryLanguage,
    frameworks,
    hasReadme,
    readmeLength,
    hasManifest,
    hasTests,
    testFileCount,
    hasCi,
    existingAiConfigs,
    hasLinting,
    hasTypes,
    hasDocs,
    hasContributing,
    hasLicense,
    hasSrcDir,
    topLevelDirs,
  };
}

module.exports = { scanRepo };
