---
title: Validation
sidebar_position: 3
---

Validate the field with the `BlockContent` rule. It checks that the value is block editor content (a JSON string, an array or a `Document`) and that every block is allowed by the profile, sits where it may (a list item in a list, a column in columns), contains what it may, uses allowed formatting, and has valid attributes.

```php
use Javaabu\BlockEditor\Rules\BlockContent;

$request->validate([
    'title' => ['required', 'string', 'max:255'],
    'body' => ['required', BlockContent::make()->required()],
    'summary' => ['nullable', BlockContent::make('minimal')->maxBlocks(5)],
]);
```

| Method | What |
| --- | --- |
| `new BlockContent(?string $profile)` / `BlockContent::make($profile)` | Validate for a [profile](../advanced-usage/profiles.md). Default: the default profile. |
| `->required()` | Fail when the content is empty (no blocks, or only empty paragraphs). Laravel's `required` passes for an empty editor, because it posts `{"type":"doc","content":[…]}`. |
| `->maxBlocks(int)` | At most this many top-level blocks. |

A [stencil field](./editor-field.md#stencil) adds the rule by itself.

# Where errors go

Each problem is reported twice:

1. On the field, the first problem, saying which block it's in. This is the message the field shows.
2. On the problem's path in the JSON, prefixed with the field name. The editor shows these on the block.

```php
[
    'body' => ['Block 3 (Button): Use an http(s), mailto or tel link.'],
    'body.content.2.attrs.url' => ['Use an http(s), mailto or tel link.'],
]
```

Block numbers count top-level blocks from 1. An error inside columns or a list reports the top-level block it's in. Paths go through `content.N` for children, then `attrs.NAME` for attributes, or `marks.N` for formatting on text.

# What's checked

| Problem | Message |
| --- | --- |
| Not a `doc` (or not JSON) | The :attribute must be block editor content. |
| A block type that isn't registered | Unknown block type “x”. |
| A block the profile doesn't allow, or in the wrong place | The Button block isn't allowed here. |
| Children that don't fit the block (a heading straight in a list) | The content of this block isn't valid. |
| Formatting that isn't registered, or isn't allowed | Unknown formatting “x”. / Italic isn't allowed here. |
| An attribute that fails its rules | The attribute's validation message, e.g. The Link field is required. |
| An unsafe URL (`javascript:`, `data:`, …) | Use an http(s), mailto or tel link. |
| Blocks nested deeper than `sanitize.max_depth` | Blocks are nested too deeply. |

Attribute rules come from each block's [attributes](../advanced-usage/custom-blocks.md#attributes) and its `rules()`. Missing attributes count as their default. Messages are translated (English and Dhivehi ship with the package).

# Validation and sanitizing

Validation tells the user what's wrong. [Sanitizing](../advanced-usage/sanitizing.md) makes whatever is stored safe, even if it skipped validation. Do both: validate the request, and let the cast sanitize on save.
