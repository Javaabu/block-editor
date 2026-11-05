---
title: Profiles
sidebar_position: 2
---

A profile is a named set of blocks and marks. The editor offers only the profile's blocks and formatting. Validation rejects anything else, and sanitizing drops it. Child blocks (list items, table rows and cells, columns) come with their parents.

```php
// config/block-editor.php
'profiles' => [
    'default' => ['blocks' => ['*'], 'marks' => ['*']],
    'minimal' => [
        'blocks' => ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote'],
        'marks' => ['bold', 'italic', 'underline', 'link'],
    ],
],
```

Or in a service provider:

```php
BlockEditor::profile('comment', blocks: ['paragraph', 'bulletList'], marks: ['bold', 'italic', 'link']);
```

Use the same profile in each place:

```php
protected function casts(): array
{
    return ['excerpt' => AsBlockDocument::class . ':minimal'];
}

$request->validate(['excerpt' => ['nullable', BlockContent::make('minimal')]]);
```

```blade
<x-block-editor::editor name="excerpt" profile="minimal" />
<x-block-editor::content :content="$post->excerpt" profile="minimal" />
```

```php
return Inertia::render('Posts/Edit', ['excerptEditor' => BlockEditor::editorConfig('minimal')]);
```

```tsx
<BlockEditorField name="excerpt" config={excerptEditor} />
```

| Method | What |
| --- | --- |
| `BlockEditor::profile($name, $blocks, $marks)` | Defines a profile. `['*']` means everything registered. |
| `BlockEditor::profile($name)` | Gets one. Unknown names throw `UnknownBlockException`. |
| `BlockEditor::profile()` | The default profile (`default_profile` in the config). |
| `BlockEditor::blocksFor($profile)` / `marksFor($profile)` | The blocks or marks it allows. |
| `BlockEditor::editorConfig($profile)` | The editor's JSON config for it. |
| `BlockEditor::scripts($profile)` | The manifest scripts of its blocks. |
