---
title: Thaana and RTL
sidebar_position: 7
---

# Typing Thaana

The editor types Thaana from a Latin keyboard with the phonetic (JTK) keymap: `dhivehi` types ދހިވެހި. Switch it on and off with the toolbar's Thaana button or **Alt+Shift+T**. It starts on when the app's locale is `dv`, and off otherwise.

Typed text goes through the editor like any other edit, so undo, the `/` menu and input rules keep working. Text from a native Thaana keyboard or an IME is left alone. While Thaana typing is on, the editor's area is marked `lang="dv"` and `dir="rtl"`, so empty blocks start from the right.

Settings inputs for text that's usually Dhivehi (image alt text and captions, button text, video titles) type Thaana too when the editor does.

| Config (`block-editor.thaana`) | Default | What |
| --- | --- | --- |
| `enabled` | `true` | `false` removes Thaana typing from every editor |
| `default_on` | `null` | `true`/`false` to start on or off; `null` follows the locale |
| `keymap` | `phonetic` | `phonetic` (JTK), `phonetic-hh` (Hassan Hameed) or `typewriter` |
| `shortcut` | `Alt-Shift-t` | The toggle shortcut (ProseMirror key name), or `false` |

Per field: `thaana` starts it on, and `:thaana-keyboard="false"` removes it (React: `thaana={{ default_on: true }}` and `thaana={false}`). See [The editor field](./editor-field.md).

# Mixed Dhivehi and English

Every text block gets `dir="auto"`, so each paragraph takes the direction of its first letter: a Dhivehi paragraph is RTL and the English one after it is LTR. Digits and punctuation don't count.

Lists, quotes and tables can't rely on `dir="auto"`, because the browser skips children that have their own `dir`. They take the direction of their first strong letter instead, resolved on the server and in React the same way. A list of Dhivehi items gets its bullets on the right, and a table whose first cell is Dhivehi runs from the right.

Code (blocks and inline) is always left to right.

The editor and the rendered content use logical CSS only (`margin-inline-start`, `border-inline-start`, `text-align: start`), so the layout mirrors in an RTL page. Columns follow the page direction, and the toolbar, menus and handle mirror too. Alignment buttons set logical `start`/`center`/`end`.

# Dhivehi interface

Every string in the editor (toolbar, menus, settings, block names, validation messages) is in `lang/dv`. The editor gets the strings of the app's locale through its config. See [Translations](../advanced-usage/translations.md).
