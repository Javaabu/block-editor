# javaabu/block-editor API

## PHP

### BlockEditor facade (`Javaabu\BlockEditor\Facades\BlockEditor`)

| Method | What |
| --- | --- |
| `register(string\|Block ...$blocks)` | Register blocks; the same name replaces |
| `forget(string ...$names)` | Remove blocks |
| `has($name)`, `get($name)`, `blocks()` | The registry (`get()` throws `UnknownBlockException`) |
| `registerMark()`, `forgetMark()`, `hasMark()`, `mark()`, `marks()` | Marks |
| `profile($name, $blocks, $marks)` | Define a profile; `profile($name)` gets one; `profile()` the default |
| `blocksFor($profile)`, `marksFor($profile)` | What a profile allows |
| `editorConfig($profile)` | The editor's JSON config (blocks, marks, translated strings, Thaana) |
| `scripts($profile)` | The manifest scripts of the profile's blocks |
| `document($content)`, `render($content, $profile)`, `sanitize($content, $profile)` | Content helpers |

### Document

`Document::make($value)` (Document, Node, array, JSON string, null), `Document::empty()`, `root()`, `blocks()`, `isEmpty()`, `isNotEmpty()`, `sanitize($profile)`, `render($profile)` (HtmlString), `toHtml()`, `toText($profile)`, `excerpt($limit, $end)`, `toArray()`, `toJson()`. Castable: `Document::class` works as a cast.

### Cast

`AsBlockDocument::class[:profile]`: get → Document (empty for null); set → sanitized JSON (config `sanitize.on_save`); serialize → array.

### Rule

`new BlockContent(?string $profile)`, `BlockContent::make($profile)->required()->maxBlocks(100)`.

### Components

`<x-block-editor::editor>`: `name`, `label`, `:model`, `:default`, `:value`, `required`, `inline`, `show-label`, `show-errors`, `profile`, `readonly`, `thaana`, `:thaana-keyboard="false"`, `:toolbar="false"`, `help` slot.

`<x-block-editor::content>`: `:content`, `profile`, `:styles="false"`, slot for empty content.

### Stencil

`Javaabu\BlockEditor\Stencil\BlockEditorField::make('body')->profile('minimal')->toolbar(false)->maxBlocks(50)->required()`. React type: `block-editor`.

### Core blocks

| Name | Content | Attributes |
| --- | --- | --- |
| paragraph | inline* | textAlign, dir |
| heading | inline* | level (`BlockEditor::get('heading')->levels([2,3])`), textAlign, dir |
| bulletList / orderedList | listItem+ | dir; orderedList: start, type |
| listItem | paragraph block* | |
| blockquote | block+ | dir |
| callout | inline* | variant: info, success, warning, error |
| codeBlock | text* | language |
| table / tableRow / tableHeader / tableCell | tableRow+ / cells / block+ | cells: colspan, rowspan, colwidth |
| horizontalRule | | |
| image | | src (required), alt, title, caption |
| embed | | src (required), title. YouTube, Vimeo; `Embed::provider()` |
| button | | text, url (required), variant (primary, secondary, outline), newTab, align |
| columns / column | column{1,6} / block+ | layout (1-1, 1-2, 2-1, 1-1-1, 1-2-1, 2-1-1, 1-1-2, 1-1-1-1), stackAt (sm, md, lg, never), gap, verticalAlign |
| html | | html (sanitized) |
| hardBreak | inline | |

Marks: bold, italic, underline, strike, code, link (href, target).

### Config (`config/block-editor.php`)

`blocks`, `marks`, `default_profile`, `profiles`, `thaana.{enabled,default_on,keymap,shortcut}`, `embeds.providers`, `sanitize.{on_save,max_depth,url_schemes,data_images,link_rel}`, `sanitize.html.{link_schemes,media_schemes,allow_attributes,iframe_hosts,max_length}`, `assets`.

## JS (`@javaabu/block-editor`, `@javaabu/block-editor/react`)

- `createBlockEditor(element, { config, content, onChange, editable, thaana, errors, errorPrefix, toolbar, attributes, extensions, autofocus, onReady })` → `{ editor, element, config, t, getJSON, setContent, setErrors, setEditable, focus, destroy }`.
- Blade entry: `window.JavaabuBlockEditor.mount(el)`, `.mountAll(root)`, `.get(el)`; event `block-editor:ready`.
- Registry: `defineBlock`, `registerBlock`, `forgetBlock`, `getBlock`, `registeredBlocks`, `CORE_BLOCKS`.
- Embeds: `registerEmbedProvider(name, fn)`, `toEmbedUrl(url)`.
- Helpers: `attributesFrom`, `dataAttrs`, `defaultAttrs`, `insertDefault`, `insertBlock`, `atomView`, `settingsPrompt`, `currentBlock`, `blockAt`, `moveBlock`, `duplicateBlock`, `deleteBlock`, `parseContent`, `isEmptyDocument`, `isSafeUrl`, `directionOf`, `defaultConfig(locale)`.
- React: `BlockEditor`, `BlockEditorField`, `StencilBlockEditor`, `BlockContent` (`content`, `html`, `config`, `renderers`, `marks`, `empty`), `CORE_RENDERERS`.
- Stylesheet: the manifest asset `block-editor::styles` (Blade components require it), imported by the React components themselves; `@javaabu/block-editor/block-editor.css` for anything else.
- npm: the assets scope (TipTap, `@javaabu/onu`, React, which Onu's editor module imports) for every Vite app; `@javaabu/forms` is `for: 'pages'`, asked for by `manifest:check` only in Inertia apps.
