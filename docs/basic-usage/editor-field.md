---
title: The editor field
sidebar_position: 2
---

The field posts the content as a JSON string, in a hidden input named after the field. It works like the other javaabu/forms fields: model binding, old input, label, help, errors and inline layout.

<table>
<tr><th>Blade</th><th>Inertia React</th></tr>
<tr><td>

```blade
<x-forms::form :model="$post" method="PATCH" :action="route('posts.update', $post)">
    <x-forms::text name="title" thaana />

    <x-block-editor::editor name="body" required>
        <x-slot:help>{{ __('Type / for blocks') }}</x-slot:help>
    </x-block-editor::editor>

    <x-forms::submit />
</x-forms::form>
```

</td><td>

```tsx
import { Form, Submit, Text } from "@javaabu/forms"
import { BlockEditorField } from "@javaabu/block-editor/react"

<Form model={post} method="patch" action={route("posts.update", post)}>
  <Text name="title" thaana />
  <BlockEditorField name="body" config={editor} required help={__("Type / for blocks")} />
  <Submit />
</Form>
```

</td></tr>
</table>

Pass `editor` from the controller with `BlockEditor::editorConfig()` (or `BlockEditor::editorConfig('minimal')` for a profile). Without `config`, the React field uses the built-in default profile in English, or Dhivehi with `locale="dv"`.

# Options

| Blade | React | Default | What |
| --- | --- | --- | --- |
| `name` | `name` | | The input name. Old input, the bound value and errors are read with it. |
| `label` | `label` | from the name | The label. |
| `:model` | `model` | the form's | The model to read the value from. |
| `:default` / `:value` | `default` / `value` | | A starting value, or the value (React: controlled, with `onChange`). |
| `profile` | `config` | default | The [profile](../advanced-usage/profiles.md): which blocks and marks the editor offers. React takes the whole config. |
| `required` | `required` | `false` | Marks the field as required (add the rule yourself, see [Validation](./validation.md)). |
| `readonly` | `readOnly`, `disabled` | `false` | Shows the content without editing. |
| `thaana` | `thaana={{ default_on: true }}` | locale | Starts with Thaana typing on. See [Thaana and RTL](./thaana-and-rtl.md). |
| `:thaana-keyboard="false"` | `thaana={false}` | on | Removes Thaana typing. |
| `:toolbar="false"` | `toolbar={false}` | on | Hides the formatting toolbar ("/" and the handle still work). |
| `inline`, `show-label`, `show-errors`, `form-group-class` | the same, camelCase | | As for every javaabu/forms field. |
| `help` slot | `help` | | Help text, linked to the editor with `aria-describedby`. |

React only: `onChange(value, instance)`, `onReady(instance)`, `extensions` (extra TipTap extensions) and `autofocus`.

# Errors

When validation fails, the field shows the first error under the editor (`Block 3 (Button): The Link field is required.`), and the editor outlines the blocks that have errors and shows their messages under them. A block's error goes away as soon as it's edited. See [Validation](./validation.md).

# Inertia's useForm

`BlockEditorField` keeps its own state and posts its hidden input, which works with `<Form>` and plain form posts. With Inertia's `useForm()`, bind it yourself:

```tsx
const form = useForm({ title: post.title, body: post.body })

<Form form={form} action={route("posts.update", post)} method="patch">
  <BlockEditorField name="body" config={editor} value={form.data.body} onChange={(value) => form.setData("body", value)} />
</Form>
```

# The editor without a form

```tsx
import { BlockEditor } from "@javaabu/block-editor/react"

<BlockEditor config={editor} value={content} onChange={setContent} aria-label={__("Content")} />
```

`BlockEditor` takes the same props as the field, without the form group. In plain JavaScript, use [`createBlockEditor()`](../advanced-usage/javascript-api.md).

# Stencil

```php
use Javaabu\BlockEditor\Stencil\BlockEditorField;

Form::make()->model($post)->schema([
    TextInput::make('title')->required()->thaana(),
    BlockEditorField::make('body')
        ->label(__('Content'))
        ->profile('default')
        ->required()
        ->maxBlocks(200)
        ->toolbar(),
]);
```

The field adds the [`BlockContent` rule](./validation.md) for its profile (required when the field is), returns the content as an array from `$form->validate()`, and saves it through the model's cast. The Blade driver renders `<x-block-editor::editor>`. For the React renderer, register the component once:

```tsx
import { StencilProvider } from "@javaabu/stencil"
import { StencilBlockEditor } from "@javaabu/block-editor/react"

<StencilProvider components={{ "block-editor": StencilBlockEditor }}>
  <StencilForm schema={form} />
</StencilProvider>
```
