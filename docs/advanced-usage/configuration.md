---
title: Configuration
sidebar_position: 1
---

Publish the config with `php artisan vendor:publish --tag=block-editor-config`. Every option has a default, so you only publish to change one.

| Key | Default | What |
| --- | --- | --- |
| `blocks` | the core blocks | Block classes registered at boot, in menu order. Add yours, or remove one to take it out of every editor. |
| `marks` | bold, italic, underline, strike, code, link | Mark (formatting) classes, in toolbar order. |
| `default_profile` | `default` | The profile used when none is given. |
| `profiles` | `default` (everything), `minimal` | Named sets of blocks and marks. See [Profiles](./profiles.md). |
| `thaana.enabled` | `true` | Thaana typing in the editor. |
| `thaana.default_on` | `null` | Start with Thaana typing on (`true`), off (`false`), or on for the `dv` locale (`null`). |
| `thaana.keymap` | `phonetic` | `phonetic` (JTK), `phonetic-hh` or `typewriter`. |
| `thaana.shortcut` | `Alt-Shift-t` | The toggle shortcut, or `false`. |
| `embeds.providers` | `['youtube', 'vimeo']` | Built-in video providers that are framed. Providers added with `Embed::provider()` are always on. |
| `sanitize.on_save` | `true` | Sanitize content when the cast sets it. |
| `sanitize.max_depth` | `20` | Deepest nesting kept (and validated). |
| `sanitize.url_schemes` | http, https, mailto, tel | Schemes allowed in links and URL attributes. Relative URLs are always allowed. |
| `sanitize.data_images` | `false` | Allow `data:image/…;base64` image sources. |
| `sanitize.link_rel` | `noopener noreferrer nofollow` | `rel` of rendered links. |
| `sanitize.html.link_schemes` | http, https, mailto, tel | Schemes allowed in links inside HTML blocks. |
| `sanitize.html.media_schemes` | http, https | Schemes allowed for images and media inside HTML blocks. |
| `sanitize.html.allow_attributes` | class, dir, lang | Attributes allowed on every element inside HTML blocks. |
| `sanitize.html.iframe_hosts` | `[]` | Allow `<iframe>` from these hosts in HTML blocks. This also limits all media in HTML blocks to them. |
| `sanitize.html.max_length` | `100000` | Longest HTML kept. |
| `assets` | `true` | Ask javaabu/manifest for the script and stylesheet. Turn it off to load them yourself. |

# In code

```php
use Javaabu\BlockEditor\Facades\BlockEditor;
use Javaabu\BlockEditor\Sanitizing\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

public function boot(): void
{
    BlockEditor::register(CallToAction::class);
    BlockEditor::forget('html');
    BlockEditor::profile('comment', ['paragraph', 'bulletList', 'orderedList', 'blockquote'], ['bold', 'italic', 'link']);
    BlockEditor::get('heading')->levels([2, 3, 4]);

    HtmlSanitizer::configureUsing(fn (HtmlSanitizerConfig $config) => $config->allowElement('abbr', ['title']));
}
```
