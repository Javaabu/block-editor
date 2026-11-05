---
title: Introduction
sidebar_position: 1.0
---

# Block Editor

[Block Editor](https://github.com/Javaabu/block-editor) is a block editor for Laravel, built on [TipTap](https://tiptap.dev). Content is made of blocks: paragraphs, headings, lists, quotes, code, tables, images, videos, buttons, callouts, HTML and multi-column layouts. It's stored as JSON, validated and sanitized per block on the server, and rendered with Blade or React.

Each block has two halves:

- a **PHP class** that defines its attributes, their validation rules, how it renders in Blade, and its menu title and icon;
- a **JS module** that implements it in the editor and renders it in React. This half is optional: a block with only a PHP class still works in the editor.

Apps and packages register their own blocks. [javaabu/mediapicker](https://github.com/Javaabu/mediapicker), for example, adds media library blocks.

```php
// The model
protected function casts(): array
{
    return ['body' => AsBlockDocument::class];
}

// The request
$request->validate(['body' => ['required', BlockContent::make()->required()]]);
```

```blade
{{-- The form --}}
<x-block-editor::editor name="body" :model="$post" />

{{-- The page --}}
<x-block-editor::content :content="$post->body" />
```

```tsx
// Inertia React
<BlockEditorField name="body" config={editorConfig} />
<BlockContent content={post.body} />
```

## Features

- A TipTap editor with a formatting toolbar, a `/` menu, a `+` inserter, a drag handle and keyboard shortcuts for moving blocks, and a settings panel generated from each block's attributes.
- The same editor in Blade (mounted from a `data-` attribute) and in React, shipped through [javaabu/manifest](https://github.com/Javaabu/manifest).
- Content validated per block, with errors reported on the field and shown on the block that caused them.
- Sanitized on save and on render: unknown blocks and attributes are dropped, URLs are checked, and HTML blocks are cleaned by [symfony/html-sanitizer](https://symfony.com/doc/current/html_sanitizer.html).
- The Blade views and the React renderer produce the same markup, and tests check it.
- Multi-column layouts that stack on small screens and follow the text direction.
- Phonetic (JTK) Thaana typing, and correct direction for mixed Dhivehi and English content.
- Profiles: a comment field can offer fewer blocks than a page body.
- English and Dhivehi strings throughout.
