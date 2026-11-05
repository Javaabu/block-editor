# Block Editor

[![Tests](https://github.com/Javaabu/block-editor/actions/workflows/tests.yml/badge.svg)](https://github.com/Javaabu/block-editor/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/Javaabu/block-editor/branch/main/graph/badge.svg)](https://codecov.io/gh/Javaabu/block-editor)
[![Latest Version on Packagist](https://img.shields.io/packagist/v/javaabu/block-editor.svg)](https://packagist.org/packages/javaabu/block-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

A block editor for Laravel, built on [TipTap](https://tiptap.dev). Blocks are PHP classes (attributes, validation, Blade rendering) with optional JS modules, and apps and packages register their own. Content is stored as JSON, validated and sanitized per block, and rendered with Blade or React. Multi-column layouts, phonetic Thaana typing and RTL-aware rendering are built in.

```php
protected function casts(): array
{
    return ['body' => AsBlockDocument::class];
}

$request->validate(['body' => ['required', BlockContent::make()->required()]]);
```

```blade
<x-block-editor::editor name="body" :model="$post" />

<x-block-editor::content :content="$post->body" />
```

```tsx
<BlockEditorField name="body" config={editor} />   // @javaabu/block-editor/react
<BlockContent content={post.body} />
```

## Documentation

You'll find the documentation on [https://docs.javaabu.com/block-editor](https://docs.javaabu.com/block-editor), and in the [`docs`](docs) folder.

AI coding assistants can start from [`llms.txt`](llms.txt). The package ships a [Laravel Boost](https://github.com/laravel/boost) skill and guideline, which Boost finds by itself. See [AI assistants](docs/ai-assistants.md).

## Testing

```bash
composer test
pnpm test
pnpm examples   # try the editor in a browser
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security

If you discover any security related issues, please email info@javaabu.com instead of using the issue tracker.

## Credits

- [Javaabu Pvt. Ltd.](https://github.com/javaabu)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
