---
title: Rendering content
sidebar_position: 4
---

Content is always sanitized before it renders, and text is always escaped. The output is wrapped in `.block-content`, which the package's stylesheet styles.

<table>
<tr><th>Blade</th><th>Inertia React</th></tr>
<tr><td>

```blade
<x-block-editor::content :content="$post->body" class="mt-6">
    <p>{{ __('No content yet.') }}</p>
</x-block-editor::content>
```

</td><td>

```tsx
import { BlockContent } from "@javaabu/block-editor/react"

<BlockContent
  content={post.body}
  className="mt-6"
  empty={<p>{__("No content yet.")}</p>}
/>
```

</td></tr>
</table>

Both render the same HTML. The Blade views and the React renderers are tested against the same fixtures.

# Blade

`<x-block-editor::content>` takes `content` (a `Document`, an array, a JSON string or `null`), `profile` (render only what that profile allows) and `:styles="false"` (don't ask manifest for the stylesheet). Its slot shows when there's no content.

A `Document` also renders when echoed:

```blade
{{ $post->body }}
{{ $post->body->render('minimal') }}
```

Each block renders with its own Blade view, `block-editor::blocks.{name}`. To change one, publish the views or create `resources/views/vendor/block-editor/blocks/{name}.blade.php`. See [Styling and views](../advanced-usage/styling-and-views.md).

# React

| Prop | What |
| --- | --- |
| `content` | The JSON (`post.body` from Inertia, cast by `AsBlockDocument`) or a JSON string |
| `html` | HTML the server rendered (`$post->body->toHtml()`), shown as is instead. Use it when some blocks only have a Blade view. |
| `config` | The editor config, for translated strings (the embed's fallback title) |
| `renderers` | `{ [blockName]: Component }`, over the core renderers and registered blocks |
| `marks` | `{ [markName]: (attrs, children) => node }` |
| `empty` | Shown when there's no content |

A block registered in JS with a `render` component renders with it. A block with no React renderer renders its children in a `<div data-block="…">`, so its text still shows.

```tsx
<BlockContent content={post.body} renderers={{ image: ({ attrs }) => <Picture src={String(attrs.src)} alt={String(attrs.alt ?? "")} /> }} />
```

`BlockContent` expects content the server sanitized (the cast does that). It still escapes text, drops unsafe links, images and buttons, and cleans HTML blocks again in the browser.

# The stylesheet

The components ask manifest for `block-editor::styles`. In React, import it once:

```ts
import "@javaabu/block-editor/block-editor.css"
```

It uses Onu's theme variables when the page has them, and plain colours otherwise.
