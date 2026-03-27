# AI Ready

[![AI Ready](https://img.shields.io/badge/AI%20Ready-Score%20Your%20Repo-purple?style=flat&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA0LTggOHptLTEtNGgybC0uNS0yaDFsLjUtMmgtNGwuNSAyaDFMLDExIDh6Ii8+PC9zdmc+)](https://github.com/M3phist0s/ai-ready)
[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-Marketplace-blue?style=flat&logo=github)](https://github.com/M3phist0s/ai-ready)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Score your repo's AI-readiness and auto-generate config files for Claude Code, Cursor, and GitHub Copilot.**

Like Lighthouse for web performance, but for AI coding tools. Get a 0-100 score showing how well AI assistants can work with your codebase, plus auto-generated config files to close the gap.

## What It Does

1. **Scans** your repository structure, languages, frameworks, tests, docs, and existing configs
2. **Scores** AI-readiness on 10 dimensions (0-100 scale with letter grade)
3. **Generates** missing config files tailored to your specific codebase:
   - `CLAUDE.md` — Claude Code project instructions
   - `.cursorrules` — Cursor AI rules
   - `.github/copilot-instructions.md` — GitHub Copilot instructions
4. **Adds a badge** to show your repo's AI-readiness score

## Quick Start

### GitHub Action

Add to `.github/workflows/ai-ready.yml`:

```yaml
name: AI Ready
on:
  push:
    branches: [main]
  pull_request:

jobs:
  ai-ready:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: M3phist0s/ai-ready@v1
        with:
          mode: full        # 'score', 'generate', or 'full'
          badge: true       # Add badge to README
```

### CLI

```bash
# Score a repo
npx ai-ready /path/to/repo score

# Generate config files
npx ai-ready /path/to/repo generate

# Full report + generate
npx ai-ready /path/to/repo full
```

## Scoring Rubric

| Category | Max Points | What It Measures |
|----------|-----------|-----------------|
| README | 15 | Project description quality and length |
| Structure | 10 | Organized directories (src/, lib/, etc.) |
| Dependencies | 10 | Package manifest (package.json, Cargo.toml, etc.) |
| Tests | 15 | Test files and test infrastructure |
| CI/CD | 5 | Automated verification pipeline |
| AI Config | 15 | Existing CLAUDE.md, .cursorrules, etc. |
| Type Safety | 10 | TypeScript, type hints, strict typing |
| Code Style | 5 | Linter/formatter configuration |
| Documentation | 10 | Docs directory, contributing guide |
| License | 5 | License file present |

### Grades

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | AI tools work excellently with your repo |
| B | 75-89 | Good AI support, minor improvements possible |
| C | 60-74 | Decent, but AI tools miss important context |
| D | 40-59 | AI tools will struggle with your codebase |
| F | 0-39 | AI tools are essentially flying blind |

## Generated Configs Are Repo-Aware

Unlike generic templates, AI Ready analyzes your actual codebase:

- Detects your **languages** (20+ supported) and generates language-specific rules
- Identifies **frameworks** (Next.js, FastAPI, Tailwind, Prisma, etc.) and adds framework patterns
- Reads your **package.json** scripts to document build/test/lint commands
- Maps your **directory structure** so AI knows where things are
- Checks your **existing configs** and only generates what's missing

## Supported Languages

JavaScript, TypeScript, Python, Go, Rust, Java, Kotlin, Ruby, PHP, C#, C++, C, Swift, Vue, Svelte, Dart, Zig, Elixir, Lua, Shell

## Supported Frameworks

Next.js, Nuxt, SvelteKit, Astro, Vite, Webpack, Angular, Remix, Tailwind CSS, Prisma, Drizzle, Django, Flask, FastAPI, Docker, Cloudflare Workers, Vercel, Netlify, Fly.io, and more.

## Action Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `mode` | `full` | `score` (report only), `generate` (create configs), `full` (both) |
| `output-dir` | `.` | Where to write generated config files |
| `badge` | `true` | Add AI-Ready badge to README |
| `create-pr` | `false` | Create a PR with generated configs |

## Action Outputs

| Output | Description |
|--------|-------------|
| `score` | Numeric score (0-100) |
| `grade` | Letter grade (A/B/C/D/F) |
| `report` | Full JSON report |
| `files-generated` | Comma-separated list of generated files |

## Example Output

```
╔══════════════════════════════════════════════════════════╗
║                    AI READINESS REPORT                  ║
╚══════════════════════════════════════════════════════════╝

  Score: 68/100  Grade: C
  Files scanned: 152
  Primary language: TypeScript
  Frameworks: Next.js, Tailwind CSS, Prisma

  ─── Breakdown ───

  README         ███████████████ 15/15
                 Comprehensive README (2000+ chars)
  Structure      ██████████ 10/10
                 Clear project structure with organized directories
  Dependencies   ██████████ 10/10
                 Package manifest found
  Tests          ██████████░░░░░ 10/15
                 Moderate test coverage (8 test files)
  CI/CD          █████ 5/5
                 CI/CD pipeline configured
  AI Config      ░░░░░░░░░░░░░░░ 0/15
                 No AI config files
  Type Safety    ██████████ 10/10
                 Type annotations present
  Code Style     █████ 5/5
                 Linter/formatter configured
  Documentation  ███░░░░░░░ 3/10
                 Some documentation present
  License        ░░░░░ 0/5
                 No license file

  Generated: CLAUDE.md, .cursorrules, .github/copilot-instructions.md
```

## Why AI Readiness Matters

AI coding tools (Claude Code, Cursor, GitHub Copilot) work dramatically better when they understand your project's context, conventions, and structure. A well-configured repo means:

- More accurate code suggestions
- Fewer hallucinated imports and APIs
- Code that matches your style and patterns
- AI that understands your architecture

Most repos have zero AI configuration. This tool fixes that in seconds.

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT
