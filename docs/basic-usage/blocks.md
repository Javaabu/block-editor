---
title: Core blocks
sidebar_position: 5
---

These blocks are registered by default (config `block-editor.blocks`). The names are the node types in the JSON. Attributes marked *settings* are edited in the block's settings panel. The others are set from the toolbar or by the block itself.

| Block | Name | Attributes | Renders |
| --- | --- | --- | --- |
| Text | `paragraph` | `textAlign` (start, center, end), `dir` | `<p dir="auto">` |
| Heading | `heading` | `level` (1–6), `textAlign`, `dir` | `<h2 dir="auto">` |
| Bulleted list | `bulletList` (+ `listItem`) | `dir` | `<ul dir="…">` |
| Numbered list | `orderedList` (+ `listItem`) | `start` *settings*, `type`, `dir` | `<ol start dir>` |
| Quote | `blockquote` | `dir` | `<blockquote dir="…">` |
| Callout | `callout` | `variant` *settings* (info, success, warning, error) | `<div class="block-callout" role="note">` |
| Code | `codeBlock` | `language` *settings* | `<pre class="block-code" dir="ltr"><code class="language-…">` |
| Table | `table` (+ `tableRow`, `tableHeader`, `tableCell`) | cells: `colspan`, `rowspan`, `colwidth` | `<div class="block-table"><table>` |
| Divider | `horizontalRule` | | `<hr>` |
| Image | `image` | `src` *settings, required*, `alt` *settings*, `caption` *settings*, `title` | `<figure class="block-image"><img loading="lazy">` |
| Video | `embed` | `src` *settings, required*, `title` *settings* | YouTube (youtube-nocookie.com) and Vimeo in an `<iframe>`, other links as a link |
| Button | `button` | `text`, `url` *required*, `variant` (primary, secondary, outline), `newTab`, `align` *settings* | `<div class="block-button"><a class="block-button__link">` |
| Columns | `columns` (+ `column`) | `layout`, `stackAt`, `gap`, `verticalAlign` *settings* | See [Columns](./columns.md) |
| HTML | `html` | `html` *settings, required* | The HTML, [sanitized](../advanced-usage/sanitizing.md) |
| Line break | `hardBreak` | | `<br>` (Shift+Enter) |

Formatting (marks): `bold` (`<strong>`), `italic` (`<em>`), `underline` (`<u>`), `strike` (`<s>`), `code` (`<code dir="ltr">`) and `link` (`<a href rel="noopener noreferrer nofollow">`, `target="_blank"` when it opens in a new tab).

# Choosing blocks

Remove a block from every editor by taking it out of the config, or in a provider:

```php
BlockEditor::forget('html');
```

Offer fewer blocks in one field with a [profile](../advanced-usage/profiles.md). Replace a core block by registering a block with the same name, e.g. an `image` block that picks from the media library. See [Custom blocks](../advanced-usage/custom-blocks.md).

# Heading levels

Pages usually have their own `<h1>`. Offer only some levels:

```php
use Javaabu\BlockEditor\Facades\BlockEditor;

BlockEditor::get('heading')->levels([2, 3, 4]);
```

The editor's menus, the block-type select and validation all follow it.

# Images

The core image block takes a URL (http(s) or relative). `data:` images are refused unless `block-editor.sanitize.data_images` is `true`. For uploads and the media library, use [javaabu/mediapicker](https://github.com/Javaabu/mediapicker)'s blocks.

# Videos

Only YouTube and Vimeo links are framed, YouTube through `youtube-nocookie.com`. Other links render as links. Add providers in PHP and JS:

```php
use Javaabu\BlockEditor\Blocks\Embed;

Embed::provider('loom', fn (string $url) => preg_match('~^https://www\.loom\.com/share/(\w+)~', $url, $m) ? "https://www.loom.com/embed/{$m[1]}" : null);
```

```ts
import { registerEmbedProvider } from "@javaabu/block-editor"

registerEmbedProvider("loom", (url) => url.match(/^https:\/\/www\.loom\.com\/share\/(\w+)/)?.[1] ? url.replace("/share/", "/embed/") : null)
```

`config('block-editor.embeds.providers')` turns the built-in ones on and off.
