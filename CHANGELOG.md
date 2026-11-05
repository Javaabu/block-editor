# Changelog

All notable changes to `javaabu/block-editor` are documented in this file.

## Unreleased

Initial development of v1.0:

- Blocks as PHP classes (`Block`, `Attribute`): content expressions, attributes with types, defaults and rules, Blade views, menu metadata and an optional JS module. A registry (`BlockEditor` facade) for blocks, marks and profiles.
- Content stored as TipTap JSON: the `AsBlockDocument` cast, `Document` and `Node`, plain text and excerpts.
- The `BlockContent` rule: structure, profile, marks and attribute rules, with errors on the field and on the block's JSON path.
- Sanitizing on save and on render; HTML blocks cleaned with symfony/html-sanitizer.
- Core blocks: paragraph, heading, lists, quote, callout, code, table, divider, image, video embed (YouTube, Vimeo, custom providers), button, HTML and multi-column layouts.
- A framework-free TipTap editor (`createBlockEditor`) with a toolbar, `/` menu, `+` inserter, block handle (drag, move, duplicate, delete), settings panel generated from attributes, links, keyboard shortcuts and server errors on blocks. Reuses Onu's Thaana keyboard, auto direction, callout and embed nodes.
- Blade: `<x-block-editor::editor>` (a javaabu/forms field) and `<x-block-editor::content>`. React: `BlockEditor`, `BlockEditorField` (@javaabu/forms), `BlockContent` (same markup as Blade). Stencil: `BlockEditorField` and the `block-editor` React type.
- Phonetic (JTK) Thaana typing and RTL-aware rendering of mixed Dhivehi and English content; English and Dhivehi strings.
- Assets through javaabu/manifest, with a prebuilt `dist/` for apps without Vite; runnable examples.
