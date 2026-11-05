---
title: Installation & Setup
sidebar_position: 1.2
---

# Installing

Until it's on Packagist, add the repositories and require the package:

```json
"repositories": [
    { "type": "vcs", "url": "https://github.com/Javaabu/block-editor" },
    { "type": "vcs", "url": "https://github.com/Javaabu/forms" },
    { "type": "vcs", "url": "https://github.com/Javaabu/manifest" },
    { "type": "vcs", "url": "https://github.com/Javaabu/stencil" }
]
```

```bash
composer require javaabu/block-editor:^1.0@dev
```

The service provider is discovered automatically. Nothing needs configuring for the common case.

# The editor's JavaScript

The package registers its assets with [javaabu/manifest](https://github.com/Javaabu/manifest):

| Asset | What |
| --- | --- |
| `block-editor::styles` | The stylesheet for the editor and for rendered content |
| `block-editor::editor` | The Blade entry: mounts every editor on the page |
| `@javaabu/block-editor` | The TypeScript, for your own code and React (`@javaabu/block-editor/react`) |

`<x-block-editor::editor>` and `<x-block-editor::content>` ask manifest for what they need, and manifest adds the tags to the page. If your app builds with Vite, add manifest's plugin (see the manifest docs) and install the npm dependencies:

```bash
php artisan manifest:check
```

```bash
npm install @javaabu/onu @tiptap/core @tiptap/pm @tiptap/starter-kit @tiptap/extension-table \
  @tiptap/extension-text-align @tiptap/extensions @tiptap/suggestion @tiptap/react \
  @tiptap/static-renderer @tiptap/extension-image @tiptap/extension-placeholder react react-dom
```

Apps without Vite use the prebuilt files in `vendor/javaabu/block-editor/dist`, which manifest serves by itself.

# Inertia React

With manifest's Vite plugin, import the components:

```tsx
import { BlockContent, BlockEditorField } from "@javaabu/block-editor/react"
import "@javaabu/block-editor/block-editor.css"
```

Or load it from your root Blade view with `@manifestStyles('block-editor::styles')`.

Pass the editor config from PHP. It holds the profile's blocks and the translated strings:

```php
return Inertia::render('Posts/Edit', [
    'post' => $post,
    'editor' => BlockEditor::editorConfig(),
]);
```

# Publishing

```bash
php artisan vendor:publish --tag=block-editor-config        # config/block-editor.php
php artisan vendor:publish --tag=block-editor-translations  # lang/vendor/block-editor
php artisan vendor:publish --tag=block-editor-views         # resources/views/vendor/block-editor
```
