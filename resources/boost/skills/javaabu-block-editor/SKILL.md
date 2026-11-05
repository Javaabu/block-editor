---
name: javaabu-block-editor
description: Store, validate, edit and render block editor content in Laravel with javaabu/block-editor (TipTap). Use when adding a rich content field (AsBlockDocument cast, BlockContent rule), the editor field in Blade (<x-block-editor::editor>), React (BlockEditorField, BlockEditor from @javaabu/block-editor/react) or stencil (BlockEditorField::make()), rendering content (<x-block-editor::content>, {{ $post->body }}, BlockContent), choosing blocks with profiles, configuring Thaana typing, or writing custom blocks (Block, Attribute, defineBlock/registerBlock) and embed providers.
license: MIT
metadata:
  author: Javaabu
---

# Block content with javaabu/block-editor

The docs ship with the package: `vendor/javaabu/block-editor/llms.txt` lists every page in `vendor/javaabu/block-editor/docs/`.

| Task | Read |
| --- | --- |
| Store, validate, edit and render a content field | This file |
| Every block, attribute, option and method | [references/api.md](references/api.md) |
| Custom blocks (PHP and JS), profiles, sanitizing | [references/custom-blocks.md](references/custom-blocks.md) |

## A content field, end to end

```php
// Migration
$table->json('body')->nullable();

// Model
use Javaabu\BlockEditor\Casts\AsBlockDocument;

protected function casts(): array
{
    return [
        'body' => AsBlockDocument::class,
    ];
}

// Request
use Javaabu\BlockEditor\Rules\BlockContent;

public function rules(): array
{
    return [
        'title' => ['required', 'string', 'max:255'],
        'body' => ['required', BlockContent::make()->required()],
    ];
}

// Controller
$post->update($request->validated());   // the cast sanitizes the JSON string
```

```blade
{{-- Form --}}
<x-forms::form :model="$post" method="PATCH" :action="route('posts.update', $post)">
    <x-forms::text name="title" thaana />
    <x-block-editor::editor name="body" required />
    <x-forms::submit />
</x-forms::form>

{{-- Page --}}
<x-block-editor::content :content="$post->body">
    <p>{{ __('No content yet.') }}</p>
</x-block-editor::content>
```

Inertia React:

```php
return Inertia::render('Posts/Edit', [
    'post' => $post,
    'editor' => BlockEditor::editorConfig(),
]);
```

```tsx
import { BlockContent, BlockEditorField } from "@javaabu/block-editor/react"
import "@javaabu/block-editor/block-editor.css"

<BlockEditorField name="body" config={editor} required />
<BlockContent content={post.body} />
```

Stencil:

```php
use Javaabu\BlockEditor\Stencil\BlockEditorField;

BlockEditorField::make('body')->label(__('Content'))->required()
```

(React: `<StencilProvider components={{ "block-editor": StencilBlockEditor }}>`.)

## The Document

`$post->body` is a `Javaabu\BlockEditor\Document`, never null: `isEmpty()`, `blocks()`, `render($profile)`, `toHtml()`, `toText()` (for search), `excerpt(160)`, `toArray()`, `toJson()`. `{{ $post->body }}` renders it, sanitized.

## Profiles

A field that offers fewer blocks uses a profile everywhere:

```php
BlockEditor::profile('comment', ['paragraph', 'bulletList', 'orderedList'], ['bold', 'italic', 'link']);

'body' => AsBlockDocument::class . ':comment',          // cast
BlockContent::make('comment')                           // rule
<x-block-editor::editor name="body" profile="comment" /> // Blade
BlockEditor::editorConfig('comment')                    // React config
```

## Rules

- Use `BlockContent::make()->required()` together with `required`: Laravel's `required` passes the empty editor's JSON.
- Errors come back on the field (`Block 3 (Button): …`) and on the block's path (`body.content.2.attrs.url`). The fields show both. Don't flatten or rename them.
- Don't decode and re-encode the JSON yourself, or store HTML. Pass the request value to the model and let the cast sanitize it.
- Render only with the components or the Document. In React, `BlockContent` expects content that came through the cast.
- Thaana typing is on for the `dv` locale. Use `thaana` on the field to start it on, and `->thaana()` on custom attributes that take Dhivehi.
- New blocks: see [references/custom-blocks.md](references/custom-blocks.md). A PHP class alone works in the editor. Add a JS module only for a custom editor look or a React renderer.

## Common mistakes

| Mistake | Instead |
| --- | --- |
| `'body' => 'array'` cast, or a `text` column with `json_decode` | `AsBlockDocument::class` |
| `{!! $post->body !!}` or `{!! json_encode(...) !!}` | `{{ $post->body }}` or `<x-block-editor::content>` |
| `'body' => ['required', 'json']` | `['required', BlockContent::make()->required()]` |
| A textarea or TinyMCE for rich content | `<x-block-editor::editor>` |
| Rendering nodes in React by hand | `<BlockContent content={…} />`, with `renderers` for custom blocks |
| Different blocks offered than validated | The same profile for the field, the rule and the cast |
