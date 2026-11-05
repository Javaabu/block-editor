---
title: JavaScript API
sidebar_position: 6
---

With manifest's Vite plugin, the TypeScript is importable as `@javaabu/block-editor` (framework-free) and `@javaabu/block-editor/react`.

# createBlockEditor

```ts
import { createBlockEditor } from "@javaabu/block-editor"

const instance = createBlockEditor(document.getElementById("body")!, {
  config: editorConfig,                 // BlockEditor::editorConfig() (object or JSON string)
  content: post.body,                   // JSON or a JSON string
  onChange: (value) => (input.value = JSON.stringify(value)),
})
```

| Option | What |
| --- | --- |
| `config` | The editor config. Default: the built-in one for `locale` (`en` or `dv`). |
| `content` | Starting content. |
| `onChange(value, editor)` | Called with the document on every change. |
| `editable` | `false` for read only. |
| `thaana` | `false` to remove Thaana typing, or settings over the config's (`{ default_on: true }`). |
| `errors`, `errorPrefix` | Validation errors to show on blocks (`{ "body.content.2.attrs.url": [...] }` with prefix `body`). |
| `toolbar` | `false` hides the toolbar. |
| `attributes` | Attributes for the editable element: `id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required`. |
| `extensions` | Extra TipTap extensions. |
| `autofocus` | `true`, `"start"` or `"end"`. |
| `onReady(instance)` | Called once it's created. |

The instance has `editor` (the TipTap `Editor`), `element`, `config`, `t` (the translator), `getJSON()`, `setContent(content, emit?)`, `setErrors(errors, prefix?)`, `setEditable(editable)`, `focus()` and `destroy()`.

# The Blade entry

`block-editor::editor` mounts every `[data-block-editor]` on `DOMContentLoaded`. For editors added later (modals, Turbo, Livewire):

```ts
window.JavaabuBlockEditor.mountAll(container)   // mounts the ones not mounted yet
window.JavaabuBlockEditor.mount(element)
window.JavaabuBlockEditor.get(element)          // the instance
```

The element fires `block-editor:ready` with the instance in `event.detail`, and the hidden input fires `input` and `change` on every edit.

# Blocks

| Export | What |
| --- | --- |
| `defineBlock(definition)` / `registerBlock(...definitions)` | Register the JS half of blocks. See [Custom blocks](./custom-blocks.md#3-the-js-module). |
| `forgetBlock(...names)`, `getBlock(name)`, `registeredBlocks()` | The registry |
| `CORE_BLOCKS` | The core definitions |
| `registerEmbedProvider(name, (url) => embedUrl \| null)`, `forgetEmbedProvider(name)`, `toEmbedUrl(url)` | Video providers |
| `attributesFrom`, `dataAttrs`, `defaultAttrs`, `insertDefault`, `atomView`, `settingsPrompt`, `openSettings` | Helpers for block extensions |
| `blockAt`, `currentBlock`, `insertBlock`, `moveBlock`, `duplicateBlock`, `deleteBlock` | Block commands |

# Content helpers

| Export | What |
| --- | --- |
| `parseContent(value)` | A `doc` from JSON or a JSON string, or `null` |
| `isEmptyDocument(doc)` | Only empty paragraphs |
| `fitToSchema(doc, schema)` | Drops nodes and marks a schema doesn't know |
| `isSafeUrl(url)`, `isSafeImageUrl(url)` | The URL checks the sanitizer uses |
| `detectDirection(text)`, `resolveDirection(node)`, `directionOf(node)` | Text direction, as the renderers resolve it |
| `translator(strings, fallback)` | `t(key, replacements)` over editor strings |
| `defaultConfig(locale)` | The built-in config |

# React

| Export | What |
| --- | --- |
| `BlockEditor` | The editor. Props: the options above, plus `value`/`defaultValue`, `name` (a hidden input), `readOnly`, `disabled`, `className`, `id` and `aria-*`. |
| `BlockEditorField` | The editor as a `@javaabu/forms` field. See [The editor field](../basic-usage/editor-field.md). |
| `StencilBlockEditor` | The stencil `block-editor` type. |
| `BlockContent` | The renderer. See [Rendering](../basic-usage/rendering.md). |
| `CORE_RENDERERS`, `CORE_MARKS` | The core React renderers, to wrap or reuse. |

Types: `EditorConfig`, `BlockConfig`, `AttributeConfig`, `MarkConfig`, `JSONDocument`, `JSONNode`, `ContentErrors`, `BlockDefinition`, `BlockRenderProps`, `MenuItem`, `BlockEditorInstance`, `BlockEditorOptions`.
