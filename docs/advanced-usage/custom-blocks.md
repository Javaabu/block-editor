---
title: Custom blocks
sidebar_position: 3
---

A block has a PHP class (attributes, validation, Blade rendering, menu entry) and optionally a JS module (how the editor shows it, and its React renderer). This page builds a **Notice** block: a text block with a tone and an optional link.

# 1. The PHP class

```php
<?php

namespace App\Blocks;

use Javaabu\BlockEditor\Blocks\Attribute;
use Javaabu\BlockEditor\Blocks\Block;

class Notice extends Block
{
    protected string $name = 'notice';

    protected string $content = 'inline*';

    protected ?array $marks = ['bold', 'italic', 'link'];

    protected string $category = 'text';

    protected string $icon = 'info';

    protected array $keywords = ['alert', 'message'];

    protected ?string $view = 'blocks.notice';

    protected ?string $script = 'app::notice-block';

    public function title(): string
    {
        return __('Notice');
    }

    public function description(): string
    {
        return __('A message that stands out');
    }

    public function attributes(): array
    {
        return [
            'tone' => Attribute::enum([
                'calm' => __('Calm'),
                'urgent' => __('Urgent'),
            ])->default('calm')->required(),
            'link' => Attribute::url()->label(__('Read more link')),
        ];
    }

    public function rules(): array
    {
        return ['link' => ['required_if:tone,urgent']];
    }
}
```

Register it in a service provider, or add it to `config('block-editor.blocks')`:

```php
use Javaabu\BlockEditor\Facades\BlockEditor;

public function boot(): void
{
    BlockEditor::register(\App\Blocks\Notice::class);
}
```

## Properties

| Property | Default | What |
| --- | --- | --- |
| `$name` | | The node type in the JSON and the TipTap node name. Use camelCase. |
| `$group` | `block` | Space-separated groups. `block` blocks may go wherever blocks may. Use `''` for child blocks that only appear inside a parent, and `inline` for inline nodes. |
| `$content` | `''` | What it contains, as a [ProseMirror content expression](https://prosemirror.net/docs/guide/#schema.content_expressions): `inline*` (text), `block+` (blocks), `listItem+`, `paragraph block*`, `(tableCell \| tableHeader)*`, `column{1,6}`. Empty for a leaf (an image). |
| `$marks` | `null` | The formatting allowed in its text: `null` for all, `[]` for none, or names. |
| `$view` | `block-editor::blocks.{kebab-name}` | The Blade view that renders it. |
| `$script` | `null` | The javaabu/manifest script asset with the JS half. The editor field requires it. |
| `$insertable` | `true` | Shown in the `/` and `+` menus. `false` for child blocks. |
| `$category` | `text` | The menu section: `text`, `media`, `embed`, `layout`, `advanced`. |
| `$icon` | `square` | A [Lucide](https://lucide.dev) icon name for the menus. Unknown names show a square. |
| `$keywords` | `[]` | Extra search words for the menus. |

## Methods to override

| Method | What |
| --- | --- |
| `title()`, `description()` | Menu text. Default: `block-editor::strings.blocks.{name}.title` / `.description`, or the name. |
| `attributes()` | The attributes, keyed by name. See below. |
| `rules()`, `messages()` | Extra validation rules and messages for the attributes, keyed by attribute name. |
| `sanitize(Node $node, Sanitizer $sanitizer): ?Node` | Last changes after the attributes, marks and children were sanitized. Return `null` to drop the node. `$sanitizer->html($html)` cleans HTML. |
| `render(Node $node, Renderer $renderer): string` | The HTML. By default it renders `$view`. |
| `viewData(Node $node, Renderer $renderer): array` | What the view gets: `$node`, `$attrs`, `$content` (the rendered children), `$block`, `$renderer`. |
| `isEmpty(Node $node): bool` | Whether the node shows nothing. Leaf blocks never are; text blocks are when they have no text. |
| `toText(Node $node, Renderer $renderer): string` | Its text for `Document::toText()`. |

## Attributes

```php
Attribute::string()       // one line of text: a text input
Attribute::text()         // several lines: a textarea
Attribute::url()          // a link: http(s), mailto, tel or relative; anything else fails validation and is dropped
Attribute::integer()
Attribute::number()
Attribute::boolean()      // a checkbox, default false
Attribute::enum(['a', 'b'])              // a select; or ['a' => __('A'), …], or a backed enum class
Attribute::json()         // any value, kept as is, never shown in the settings panel
```

| Builder | What |
| --- | --- |
| `->default($value)` | The default (a closure is called). Missing attributes get it when the content is sanitized and validated. |
| `->required()` | Validation fails without a value, and the settings panel marks it. |
| `->hidden()` | Not shown in the settings panel (set by the block or the toolbar). |
| `->label($label)`, `->help($text)` | Settings panel text. The default label is `block-editor::strings.attributes.{name}` or the name. |
| `->input($input)` | The settings input: `text`, `textarea`, `url`, `number`, `checkbox`, `select`, `code`. |
| `->thaana()` | Its input types Thaana when the editor does. |
| `->min($n)`, `->max($n)` | For numbers, the range; for text, the length. |
| `->options($options)` | Enum options. |
| `->rules([...])` | Extra Laravel rules. |

Sanitizing casts each value to its type. Values that can't be cast become the default: an unsafe URL, a value outside the options, or a non-number in a number.

## The view

```blade
{{-- resources/views/blocks/notice.blade.php --}}
<aside class="notice" data-tone="{{ $attrs['tone'] }}" dir="auto">
    {{ $content }}
    @if($attrs['link'])
        <a href="{{ $attrs['link'] }}" rel="noopener">{{ __('Read more') }}</a>
    @endif
</aside>
```

`$content` is the rendered children (escaped text and marks, or nested blocks) as an `HtmlString`. `$renderer->attributes([...])` builds an attribute string and skips nulls.

# 2. Without JavaScript

That's enough for the block to work. The editor builds a node from the PHP config: text blocks and containers get an outlined area to type in, and leaf blocks show a card with their title and a button that opens the settings panel. The settings panel lists every attribute that isn't hidden. `<BlockContent>` renders its children in a `<div data-block="notice">`. Pass `html` from the server when you need the Blade markup in React.

# 3. The JS module

For a custom look in the editor, or a React renderer, write the JS half and register it as a manifest script:

```php
// AppServiceProvider::boot()
$this->registerAssets('app', resource_path(), fn (Package $package) => $package
    ->script('notice-block', 'js/blocks/notice.tsx', depends_on: ['block-editor::editor']));
```

```tsx
// resources/js/blocks/notice.tsx
import { Node, mergeAttributes } from "@tiptap/core"
import { attributesFrom, dataAttrs, defineBlock, registerBlock } from "@javaabu/block-editor"

export const notice = defineBlock({
  name: "notice",

  // TipTap nodes for the block (and its child nodes, if any)
  extensions: ({ block }) => [
    Node.create({
      name: "notice",
      group: "block",
      content: "inline*",
      marks: "bold italic link",
      defining: true,
      addAttributes: () => attributesFrom(block),   // defaults from the PHP attributes
      parseHTML: () => [{ tag: 'aside[data-block="notice"]' }],
      renderHTML: ({ node, HTMLAttributes }) => [
        "aside",
        mergeAttributes(HTMLAttributes, { class: "notice", "data-tone": node.attrs.tone }, dataAttrs("notice", node.attrs)),
        0,
      ],
    }),
  ],

  // React renderer for <BlockContent>: the same markup as the Blade view
  render: ({ attrs, children }) => (
    <aside className="notice" data-tone={String(attrs.tone)} dir="auto">
      {children}
      {attrs.link ? <a href={String(attrs.link)} rel="noopener">Read more</a> : null}
    </aside>
  ),
})

registerBlock(notice)
```

| Option | What |
| --- | --- |
| `name` | The PHP block's `$name`. |
| `extensions({ block, config, has })` | TipTap extensions. `block` is the PHP config of the block, `has(name)` tells whether another block is in the profile. |
| `menuItems(block, t)` | Menu entries. Default: one, from the PHP title, description, icon and keywords. Headings return one per level, with `attrs`. |
| `insert(editor, { item, openSettings })` | Inserts the block. Default: text blocks replace an empty paragraph (or go after the current block); leaves and containers are inserted, filled with their required children. |
| `settingsOnInsert` | Open the settings panel after inserting (blocks that need a URL first). |
| `afterSettingsChange(editor, pos)` | Called after the settings panel changes the block (columns add or merge columns here). |
| `render` | React component for `<BlockContent>`. It gets `{ node, attrs, children, block }`. |

Helpers for the editor half:

- `attributesFrom(block)`: TipTap attributes with the PHP defaults, read back from `data-attrs` when pasted.
- `dataAttrs(name, attrs)`: `data-block` and `data-attrs` for `renderHTML`, so copy and paste keeps the attributes.
- `atomView(props, render)`: a node view for leaf blocks that previews them, selects on click and opens settings on double-click.
- `settingsPrompt(props, text)`: a button for that preview that opens the settings.
- `insertBlock(editor, node)`, `defaultAttrs(editor, name)`, `currentBlock(state)`.

The registry is global (`globalThis`), so blocks registered by any script on the page, including other packages' prebuilt bundles, reach every editor. Register before the editor mounts: the Blade entry mounts on `DOMContentLoaded`, after module scripts have run. In React, import the module before rendering the editor.

# Child blocks

A block with children of its own type, such as a gallery of items, registers both:

```php
class Gallery extends Block
{
    protected string $name = 'gallery';
    protected string $content = 'galleryItem+';
}

class GalleryItem extends Block
{
    protected string $name = 'galleryItem';
    protected string $group = '';          // only inside a gallery
    protected bool $insertable = false;
}
```

Profiles that allow `gallery` allow `galleryItem` too. In JS, the gallery's `extensions` return both nodes.

# Replacing a core block

Register a block with the same name. It replaces the core one in the registry, the editor and validation:

```php
BlockEditor::register(MediaImage::class);   // protected string $name = 'image';
```

```ts
registerBlock(defineBlock({ name: "image", extensions: …, render: … }))
```

Content already stored with the old attributes keeps working, as long as the new block accepts them (unknown attributes are dropped when sanitized).

# Custom marks

Marks (inline formatting) extend `Javaabu\BlockEditor\Marks\Mark` with `$name`, `$tag`, `attributes()`, `htmlAttributes()` and `sanitize()`. Register them with `BlockEditor::registerMark()` and add the TipTap mark with the editor's `extensions` option.

# Testing

```php
$this->assertEquals([], Validator::make(
    ['body' => ['type' => 'doc', 'content' => [['type' => 'notice', 'attrs' => ['tone' => 'calm'], 'content' => [['type' => 'text', 'text' => 'ހޭލާ']]]]]],
    ['body' => [new BlockContent]],
)->errors()->messages());

$this->assertStringContainsString('data-tone="urgent"', BlockEditor::render($content));
```
