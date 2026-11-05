---
title: Columns
sidebar_position: 6
---

The **Columns** block puts blocks side by side. Each column holds any blocks, including another columns block.

Insert it from the `/` menu or `+`, then open its settings (the gear in the block actions) to choose:

| Setting | Values | Default |
| --- | --- | --- |
| Layout | 50 / 50, 33 / 67, 67 / 33, 33 / 33 / 33, 25 / 50 / 25, 50 / 25 / 25, 25 / 25 / 50, 25 / 25 / 25 / 25 | 50 / 50 |
| Stack the columns | on phones (below 640px), on tablets and phones (below 768px), below desktop width (below 1024px), never | tablets and phones |
| Gap | none, small, medium, large | medium |
| Vertical alignment | stretch, start, center, end | stretch |

Changing to a layout with more columns adds empty ones. Changing to fewer moves the blocks of the removed columns into the last remaining one, so nothing is lost.

# Markup

```html
<div class="block-columns" data-stack="md" data-gap="md" data-align="stretch"
     style="--block-columns: minmax(0, 2fr) minmax(0, 1fr)">
  <div class="block-column">…</div>
  <div class="block-column">…</div>
</div>
```

The stylesheet makes it a CSS grid with one column until the `data-stack` breakpoint, then the layout's columns. A grid follows the text direction, so in an RTL page the first column is on the right. No styles use left or right.

To use your own breakpoints or a framework's grid, override the `.block-columns` rules or [the view](../advanced-usage/styling-and-views.md).

# JSON

```json
{
  "type": "columns",
  "attrs": { "layout": "2-1", "stackAt": "md", "gap": "md", "verticalAlign": "stretch" },
  "content": [
    { "type": "column", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "ބޮޑު ކޮލަމް" }] }] },
    { "type": "column", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Side" }] }] }
  ]
}
```

A columns block holds 1 to 6 columns. When the number of columns doesn't match the layout, they render with equal widths.
