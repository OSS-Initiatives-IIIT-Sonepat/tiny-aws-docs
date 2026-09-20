# Contributing

Thanks for contributing to `vengeance-blog-template`.

## Local setup

1. Install Node.js `22+` and npm.
2. Install dependencies:

```bash
npm install
```

3. Start development:

```bash
npm run dev
```

## Project structure

- App/UI code: `src/`
- Markdown blog content: `content/blog/`
- Static assets: `public/`

## Editing workflow

1. Create a branch from `main`.
2. Make focused changes.
3. Run checks before commit:

```bash
npm run test:lint
npm test
npm run build
```

## Linting and formatting

- ESLint:

```bash
npm run lint
```

- Auto-fix lint:

```bash
npm run lint:fix
```

- Prettier format:

```bash
npm run format
```

- Prettier check:

```bash
npm run format:check
```

Markdown files are intentionally excluded from Prettier checks in `.prettierignore`.

## Tests

Unit tests are run with Vitest:

```bash
npm test
```

CI runs lint, Prettier checks, tests, and build on pushes/PRs.
