---
title: Sanitizing
sidebar_position: 4
---

Content is sanitized twice: when the [cast](../basic-usage/storing-content.md) stores it, and again when it renders. Content that never went through validation (an import, a seeder, a raw query) is still safe to show.

What the sanitizer does, for a profile:

- Drops nodes whose type isn't registered, isn't allowed by the profile, or isn't allowed where it is (a list item outside a list). Containers left without children (a list with no items) are dropped too.
- Casts each attribute to its type and fills in defaults. Values that can't be cast become the default, and attributes the block doesn't define are dropped.
- Allows only URLs with the configured schemes (`sanitize.url_schemes`: http, https, mailto, tel) or relative URLs. It strips whitespace and control characters before checking the scheme, so `java\tscript:` doesn't slip through. A link mark with an unsafe URL is removed and its text kept. An image or video with one is dropped.
- Drops marks that aren't registered, allowed by the profile, or allowed in that block (code blocks allow none), and merges neighbouring text with the same marks.
- Removes control characters from text and drops empty text nodes.
- Stops at `sanitize.max_depth` levels of nesting.
- Runs each block's `sanitize()` last. The HTML block cleans its HTML there, code blocks check their language name, and table cells check their spans.

```php
$clean = BlockEditor::sanitize($request->input('body'), 'minimal');   // Document
$clean = $post->body->sanitize();
```

# The HTML block

HTML blocks go through [symfony/html-sanitizer](https://symfony.com/doc/current/html_sanitizer.html) with its safe elements: no `<script>`, `<style>`, `<iframe>`, forms, event handlers or `style` attributes. Links and media must use the configured schemes, and `class`, `dir` and `lang` are allowed on every element. An HTML block that's empty after cleaning is dropped.

Change the allowed HTML in config (`sanitize.html.*`), or in code:

```php
use Javaabu\BlockEditor\Sanitizing\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

HtmlSanitizer::configureUsing(fn (HtmlSanitizerConfig $config) => $config
    ->allowElement('abbr', ['title'])
    ->allowElement('details')
    ->allowElement('summary'));
```

Allowing `iframe_hosts` lets `<iframe>`s from those hosts in. It also limits every image and media URL in HTML blocks to them (that's how symfony/html-sanitizer works). For videos, prefer the [video block](../basic-usage/blocks.md#videos).

In the browser, `<BlockContent>` cleans HTML blocks again (scripts, event handlers, styles and unsafe URLs). That's a second line of defence, not a replacement for the server.

# Turning it off on save

```php
// config/block-editor.php
'sanitize' => ['on_save' => false],
```

The cast then stores what it's given. Rendering still sanitizes.
