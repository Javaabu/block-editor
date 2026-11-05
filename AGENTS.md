# block-editor: notes for AI coding agents

`javaabu/block-editor` is a Laravel package: a TipTap block editor whose blocks are PHP classes (attributes, validation, Blade rendering) with optional JS modules (TipTap extensions, React renderers). It's a Composer package that also ships TypeScript (imported by apps as `@javaabu/block-editor` through javaabu/manifest) and a prebuilt `dist/` for the Blade entry.

## Layout

| Path | What |
| --- | --- |
| `src/BlockEditorManager.php` | The registry (facade `BlockEditor`): blocks, marks, profiles, editor config |
| `src/Blocks/` | `Block` (base), `Attribute`, and the core blocks |
| `src/Marks/` | `Mark` (base) and the core marks |
| `src/Document.php`, `src/Node.php` | Value objects for the JSON |
| `src/Sanitizing/` | `Sanitizer` and `HtmlSanitizer` (symfony/html-sanitizer) |
| `src/Validation/`, `src/Rules/BlockContent.php` | The content validator and the rule |
| `src/Rendering/` | `Renderer` (Blade views per block) and `Direction` (dir resolution) |
| `src/Casts/AsBlockDocument.php` | The cast |
| `src/Views/Components/` | `<x-block-editor::editor>` (a javaabu/forms `Input`) and `<x-block-editor::content>` |
| `src/Stencil/BlockEditorField.php` | The stencil field |
| `src/Assets/Assets.php` | Manifest registration |
| `resources/views/blocks/` | One Blade view per block |
| `resources/js/editor/` | `createBlockEditor()`, the schema, commands, slash menu, errors, and the vanilla UI in `ui/` |
| `resources/js/blocks/` | Core block definitions (TipTap nodes, menu items, inserts) |
| `resources/js/react/` | `BlockEditor`, `BlockContent` + `renderers.tsx`, `BlockEditorField`, the stencil component |
| `resources/js/blade/editor.ts` | The Blade entry (built to `dist/`, **committed**) |
| `resources/js/generated/` | `config.{en,dv}.json`, generated from PHP by `JsConfigTest` |
| `resources/css/block-editor.css` | Content and editor styles (logical properties only) |
| `tests/Fixtures/content/` | Shared rendering fixtures: JSON in, canonical HTML out, checked by PHP and React |
| `examples/` | The Blade entry and React, runnable with `pnpm examples` |
| `docs`, `llms.txt`, `resources/boost` | Docs, the index for assistants, the Laravel Boost guideline and skill |

## Rules

- Follow the Javaabu PHP guidelines (`vendor/javaabu/boost-javaabu-guidelines`): snake_case variables and properties, camelCase methods, `#[Test]` methods named `it_…`, early returns, no `else`. JSON attribute names stay camelCase (TipTap's).
- A block's Blade view and its React renderer must produce the same markup. After changing either, run `BLOCK_EDITOR_UPDATE_FIXTURES=1 vendor/bin/phpunit --filter RenderingFixturesTest`, review the `.html` diff, and make `pnpm test` (`tests/js/fixtures.test.tsx`) pass.
- After changing a block's attributes, `lang/*`, or anything in `editorConfig()`, run `BLOCK_EDITOR_UPDATE_FIXTURES=1 vendor/bin/phpunit --filter JsConfigTest` and commit `resources/js/generated`.
- After changing `resources/js` (outside `react/`) or `resources/css`, run `pnpm build` and commit `dist/`. CI fails when it's stale.
- The editor UI is framework-free DOM (`resources/js/editor/ui`); React only wraps it. Don't import React outside `resources/js/react`.
- Reuse Onu's TipTap pieces (`ThaanaKeyboard`, `AutoDirection`, `CalloutNode`, `Embed` from `@javaabu/onu/editor`) instead of copying them.
- URL and direction logic exists in PHP (`Support/Url`, `Rendering/Direction`) and TS (`url.ts`, `direction.ts`). Change both together.
- Every user-facing string goes in `lang/en` and `lang/dv` (`editor.php` for the editor UI, `strings.php` for the rest). Tests use Thaana for user-facing behaviour.
- CSS uses logical properties only (no left/right).
- Every change needs tests, docs (linked from `llms.txt`), the Boost skill if it changes usage, and a line in `CHANGELOG.md`.

## Commands

```bash
composer install && pnpm install      # pnpm 10.28 (packageManager)
composer lint && composer test        # Pint and PHPUnit
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
pnpm build                            # dist/
pnpm examples                         # http://localhost:5173
node scripts/icons.mjs                # regenerate editor icons from lucide-static
vendor/bin/testbench manifest:list block-editor
```
