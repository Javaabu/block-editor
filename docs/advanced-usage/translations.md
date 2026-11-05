---
title: Translations
sidebar_position: 8
---

Every user-facing string ships in English and Dhivehi:

| File | What |
| --- | --- |
| `lang/{en,dv}/editor.php` | The editor's interface: toolbar, menus, block actions, settings, announcements. It's sent to the editor in its config. |
| `lang/{en,dv}/strings.php` | Block and mark names and descriptions, attribute labels, option labels, validation messages. |

The editor uses the app's locale when the config is built (`BlockEditor::editorConfig()`, or the Blade field). To change a string, publish the translations and edit them:

```bash
php artisan vendor:publish --tag=block-editor-translations
```

```php
// lang/vendor/block-editor/dv/editor.php
return ['placeholder' => 'ލިޔުއްވާ، ނުވަތަ ބްލޮކަކަށް / ޖައްސަވާ'];
```

Translate your own blocks' titles, descriptions, attribute labels and option labels with `__()` in the class, or add them to `strings.php` under `blocks.{name}.title`, `attributes.{name}` and `options.{value}`.

Without a PHP config (tests, Storybook), the JS has the default profile built in, in English and Dhivehi: `defaultConfig("dv")`, or the `locale="dv"` prop.

# Needs review

The Dhivehi strings were written for this package. A native speaker should check these technical terms before release:

| Key | Dhivehi | English |
| --- | --- | --- |
| `editor.toolbar` | ފޯމެޓިންގ | Formatting |
| `editor.underline`, `marks.underline` | ދަށުން ރޮނގު | Underline |
| `editor.strike`, `marks.strike` | މެދުން ރޮނގު | Strikethrough |
| `editor.bold`, `editor.italic` | ބޯލްޑް, އިޓަލިކް | Bold, Italic (transliterated) |
| `editor.alignStart`, `editor.alignEnd` | ފެށޭ ފަރާތަށް, ނިމޭ ފަރާތަށް | Align to the start / end |
| `editor.blockActions` | ބްލޮކުގެ ޢަމަލުތައް | Block actions |
| `editor.dragBlock` | ގެންދަން ދަމާލައްވާ، ނުވަތަ ޢަމަލުތަކަށް Enter ފިތާލައްވާ | Drag to move, or press Enter for actions |
| `editor.toggleHeaderRow` | ސުރުޚީގެ ރޯ | Header row |
| `editor.embeddedContent` | އެމްބެޑްކޮށްފައިވާ ކޮންޓެންޓް | Embedded content |
| `blocks.callout.title` | ނޯޓް | Callout |
| `blocks.blockquote.title` | ޤައުލު | Quote |
| `blocks.horizontalRule.title` | ވަކިކުރާ ރޮނގު | Divider |
| `attributes.alt` | ފޮޓޯ ބަޔާންކުރާ ލިޔުން | Alternative text |
| `attributes.stackAt` | ކޮލަމްތައް ތިރިތިރިއަށް ބަހައްޓާނީ | Stack the columns |
| `attributes.verticalAlign` | މަތިން ތިރިއަށް ހުންނާނެ ގޮތް | Vertical alignment |
| `attributes.language` | ކޯޑުގެ ބަސް | (Programming) language |
| `options.primary`, `options.secondary` | މައި, ދެވަނަ | Primary, Secondary (button styles) |
| `options._blank` | އާއެކޭ | Yes |
