# Bklit Documentation

Documentation site for Bklit Analytics, built with [Fumadocs](https://www.fumadocs.dev).

## Development

```bash
# From root
pnpm dev:docs

# Or from this directory
pnpm dev
```

The docs will be available at `http://localhost:3002`.

## Building

```bash
pnpm build
```

## Structure

- `content/docs/` - MDX documentation files
- `src/app/` - Next.js app router pages
- `src/lib/` - Shared utilities and configuration

## Adding Documentation

Add new MDX files to `content/docs/` with frontmatter:

```mdx
---
title: Page Title
description: Page description
---

# Content here
```

