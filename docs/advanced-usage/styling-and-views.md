---
title: Styling and views
sidebar_position: 7
---

# The stylesheet

`block-editor::styles` (`resources/css/block-editor.css`) styles the rendered content (`.block-content` and the `.block-*` classes) and the editor (`.be-*`). It reads [Onu](https://www.npmjs.com/package/@javaabu/onu)'s theme variables, so it follows your theme and dark mode, and falls back to plain colours without Onu:

| Variable | From Onu | Used for |
| --- | --- | --- |
| `--be-background`, `--be-foreground` | `--onu-background`, `--onu-foreground` | Editor surface and text |
| `--be-muted`, `--be-muted-foreground`, `--be-accent` | `--onu-neutral-*` | Code, table headers, hovers, placeholders |
| `--be-border`, `--be-border-soft` | `--onu-neutral-input`, `--onu-neutral-border` | Borders |
| `--be-primary`, `--be-primary-foreground` | `--onu-primary` | Links, buttons, focus |
| `--be-destructive`, `--be-info`, `--be-success`, `--be-warning` | `--onu-*` | Errors and callouts |
| `--be-radius`, `--be-font`, `--be-font-mono` | `--onu-radius`, `--onu-font-sans`, `--onu-font-mono` | Shape and type |
| `--be-gap` | | The columns gap |

Override them on `.block-content` or `.be-editor`:

```css
.block-content { --be-primary: #0f766e; --be-gap: 1.5rem; }
```

The stylesheet only uses logical properties, so it mirrors in RTL. If you style content with Tailwind Typography or your own CSS, keep the `.block-columns`, `.block-button`, `.block-callout` and `.block-embed` rules, or replace them.

# Blade views

Each block renders with `resources/views/blocks/{name}.blade.php`, and the components with `resources/views/components/`. Publish them all:

```bash
php artisan vendor:publish --tag=block-editor-views
```

Or override one by creating it in `resources/views/vendor/block-editor/blocks/`, e.g. `image.blade.php` for a `<picture>` with your image sizes. Keep the React renderer in step (`renderers` on `<BlockContent>`) if you render in both.

# JavaScript files

Through manifest, any file under the package's `resources/js` can be overridden by a file at the same path under `resources/vendor/block-editor/js/` (see manifest's docs). Prefer registering a block with the same name, which survives updates.
