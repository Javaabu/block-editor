---
title: JSON formats
sidebar_position: 5
---

# Content

Content is [TipTap/ProseMirror JSON](https://tiptap.dev/docs/editor/core-concepts/schema):

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2, "textAlign": null, "dir": null },
      "content": [{ "type": "text", "text": "ސުރުޚީ" }]
    },
    {
      "type": "paragraph",
      "attrs": { "textAlign": "center", "dir": null },
      "content": [
        { "type": "text", "text": "Read " },
        { "type": "text", "text": "the docs", "marks": [{ "type": "link", "attrs": { "href": "/docs", "target": null } }] }
      ]
    },
    { "type": "image", "attrs": { "src": "https://example.com/a.jpg", "alt": "", "title": null, "caption": "ކެޕްޝަން" } }
  ]
}
```

| Key | What |
| --- | --- |
| `type` | The node type: a block's `$name`, `text`, or `doc` at the root |
| `attrs` | The block's attributes (sanitized content has all of them) |
| `content` | Child nodes |
| `marks` | On text nodes: `[{ "type": "bold" }, { "type": "link", "attrs": { "href": … } }]`, outermost first |
| `text` | On text nodes |

The [core blocks](../basic-usage/blocks.md) list every node type and attribute. The JSON the editor emits has a few extra attributes, such as `rel` and `class` on links. The sanitizer drops them.

# The editor config

`BlockEditor::editorConfig($profile)` returns what the editor needs. Blade passes it in `data-config`, and React takes it as the `config` prop:

```json
{
  "version": 1,
  "profile": "default",
  "locale": "dv",
  "blocks": [
    {
      "name": "button",
      "title": "ބަޓަން",
      "description": "ލިންކެއް ހުޅުވާ ބަޓަނެއް",
      "group": "block",
      "content": "",
      "marks": null,
      "insertable": true,
      "category": "advanced",
      "icon": "mouse-pointer-click",
      "keywords": ["link", "call to action", "cta"],
      "attributes": {
        "text": { "type": "string", "default": null, "editable": true, "input": "text", "label": "ލިޔުން", "required": true, "thaana": true, "max": 100 },
        "variant": { "type": "enum", "default": "primary", "editable": true, "input": "select", "label": "ސްޓައިލް", "required": true, "thaana": false,
                     "options": [{ "value": "primary", "label": "މައި" }, { "value": "secondary", "label": "ދެވަނަ" }, { "value": "outline", "label": "އައުޓްލައިން" }] }
      }
    }
  ],
  "marks": [{ "name": "bold", "title": "ބޯލްޑް", "attributes": {} }],
  "strings": { "placeholder": "ބްލޮކްތައް ބޭނުންނަމަ / ޖައްސަވާ", "…": "…" },
  "thaana": { "enabled": true, "default_on": null, "keymap": "phonetic", "shortcut": "Alt-Shift-t" }
}
```

Hidden attributes only carry `type`, `default`, `editable: false`, and `options` for enums. The package's JS includes this config for the default profile in English and Dhivehi (`defaultConfig("en" | "dv")`), generated from PHP and checked in CI.
