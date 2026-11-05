---
title: Using the editor
sidebar_position: 8
---

What people writing content can do, and how to reach it with a keyboard or a screen reader.

| To | Do |
| --- | --- |
| Add a block | Type `/` and a few letters of its name (in English or Dhivehi), then Enter. Or press `+` beside a block, or **Add a block** on the toolbar. |
| Change a block's type | The toolbar's block type list (text, headings, lists, quote, code, callout). |
| Format text | The toolbar, or Ctrl/⌘+B, I, U, Shift+S (strikethrough), E (code). |
| Add a link | Select the text, then Ctrl/⌘+K or the link button. Relative links (`/about`) are fine. |
| Align text | The alignment buttons, or Ctrl/⌘+Shift+L (start), E (center) and R (end). |
| Move a block | Drag the grip beside it, or Ctrl/⌘+Shift+↑/↓, or **Move up**/**Move down** in its actions. |
| Duplicate or delete a block | Its actions: press the grip, or **Block actions** on the toolbar. |
| Change a block's settings | Double-click it (images, buttons, videos, HTML), or select it and press Enter, or **Settings** in its actions. |
| Edit a table | The table buttons appear on the toolbar while the caret is in a table. Tab moves between cells. |
| Type Thaana | Alt+Shift+T, or the Thaana button. |
| Reach the toolbar | Alt+F10. Arrow keys move along it (mirrored in RTL), Escape goes back to the text. |

# Accessibility

- The editor is a labelled multi-line textbox. The field's label, help and errors are linked to it with `aria-labelledby`/`aria-label`, `aria-describedby` and `aria-invalid`.
- The toolbar is a single tab stop (`role="toolbar"`) with roving focus. Toggle buttons report `aria-pressed`, and every button has a name and its shortcut (`aria-keyshortcuts`).
- The `/` menu and the inserter are listboxes navigated with the arrow keys, with the active option announced through `aria-activedescendant`. Focus stays in the text (or the search box).
- Block actions are a menu (`role="menu"`) navigated with the arrow keys. Settings and links are labelled dialogs that return focus when they close (Escape).
- Moving, adding and deleting blocks are announced through a polite live region ("Moved to position 3").
- Blocks with server errors are outlined and marked `aria-invalid`, with the message right after them.
