# Custom blocks

## PHP half (required)

```php
<?php

namespace App\Blocks;

use Javaabu\BlockEditor\Blocks\Attribute;
use Javaabu\BlockEditor\Blocks\Block;

class Notice extends Block
{
    protected string $name = 'notice';             // camelCase node type

    protected string $content = 'inline*';         // '' leaf, 'inline*' text, 'block+' blocks, 'item+' children

    protected ?array $marks = ['bold', 'link'];    // null = all

    protected string $category = 'text';           // text, media, embed, layout, advanced

    protected string $icon = 'info';               // Lucide name

    protected ?string $view = 'blocks.notice';     // default block-editor::blocks.{kebab-name}

    protected ?string $script = null;              // manifest script with the JS half, if any

    public function title(): string
    {
        return __('Notice');
    }

    public function attributes(): array
    {
        return [
            'tone' => Attribute::enum(['calm' => __('Calm'), 'urgent' => __('Urgent')])->default('calm')->required(),
            'link' => Attribute::url()->label(__('Link')),
            'note' => Attribute::string()->max(200)->thaana(),
        ];
    }

    public function rules(): array
    {
        return ['link' => ['required_if:tone,urgent']];
    }
}
```

```php
// AppServiceProvider::boot()
BlockEditor::register(Notice::class);
```

The view gets `$node`, `$attrs`, `$content` (rendered children, HtmlString), `$block` and `$renderer`. Escape attributes with `{{ }}`.

Attribute types: `string()`, `text()`, `url()`, `integer()`, `number()`, `boolean()`, `enum($options)`, `json()`. Builders: `default()`, `required()`, `hidden()`, `label()`, `help()`, `input()`, `thaana()`, `min()`, `max()`, `options()`, `rules()`.

Child blocks: `protected string $group = '';` and `protected bool $insertable = false;`. Override `sanitize(Node $node, Sanitizer $sanitizer): ?Node`, `isEmpty()`, `toText()` and `render()` when needed.

Without a JS half, the editor builds the block from its config: a card and the settings panel for leaves, an outlined area for text and containers.

## JS half (optional)

```php
$this->registerAssets('app', resource_path(), fn (Package $package) => $package
    ->script('notice-block', 'js/blocks/notice.tsx', depends_on: ['block-editor::editor']));
// and on the block: protected ?string $script = 'app::notice-block';
```

```tsx
import { Node } from "@tiptap/core"
import { attributesFrom, dataAttrs, defineBlock, registerBlock } from "@javaabu/block-editor"

registerBlock(
  defineBlock({
    name: "notice",
    extensions: ({ block }) => [
      Node.create({
        name: "notice",
        group: "block",
        content: "inline*",
        addAttributes: () => attributesFrom(block),
        parseHTML: () => [{ tag: 'aside[data-block="notice"]' }],
        renderHTML: ({ node }) => ["aside", { class: "notice", ...dataAttrs("notice", node.attrs) }, 0],
      }),
    ],
    render: ({ attrs, children }) => <aside className="notice" data-tone={String(attrs.tone)} dir="auto">{children}</aside>,
  }),
)
```

Leaf blocks use `atom: true` and `addNodeView: () => (props) => atomView(props, (node) => preview)` with `settingsPrompt(props, text)`, plus `settingsOnInsert: true`. Optional: `menuItems`, `insert`, `afterSettingsChange`.

The React `render` must produce the same markup as the Blade view.

## Replacing and removing

- Same `$name` replaces a core block (e.g. a media library `image`). Register the JS half with the same name too.
- `BlockEditor::forget('html')` removes one everywhere. A profile limits one field.

## Embed providers

```php
Embed::provider('loom', fn (string $url) => …embed URL or null);
```

```ts
registerEmbedProvider("loom", (url) => …embed URL or null)
```

## Sanitizing

Unknown, disallowed or misplaced blocks and marks are dropped. Attributes are cast, with defaults for invalid values. URLs must be http(s), mailto, tel or relative. HTML blocks go through symfony/html-sanitizer (`HtmlSanitizer::configureUsing(fn (HtmlSanitizerConfig $c) => $c->allowElement('abbr', ['title']))`). It runs on save (cast) and on render.

## Testing

```php
$errors = Validator::make(['body' => $content], ['body' => [new BlockContent]])->errors()->messages();
$html = BlockEditor::render($content);
```
