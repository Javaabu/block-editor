{{--
    javaabu/block-editor guidelines for AI code assistants

    Maintained by: Javaabu (https://javaabu.com)
--}}

@verbatim
## javaabu/block-editor

- Rich content (page bodies, posts, descriptions) is block editor content: a `json` column cast with `Javaabu\BlockEditor\Casts\AsBlockDocument`, validated with `Javaabu\BlockEditor\Rules\BlockContent` (`['required', BlockContent::make()->required()]`), edited with `<x-block-editor::editor name="body" :model="$post" />` (Blade), `<BlockEditorField name="body" config={editor} />` (React, with `BlockEditor::editorConfig()` from the controller) or `BlockEditorField::make('body')` (stencil), and rendered with `<x-block-editor::content :content="$post->body" />` or `<BlockContent content={post.body} />`.
- Never echo the stored JSON raw, render nodes by hand, or validate the JSON with your own rules: the package sanitizes and validates per block.
- New blocks extend `Javaabu\BlockEditor\Blocks\Block` with `Attribute::…` attributes and a Blade view, registered with `BlockEditor::register()` in a service provider. Follow Javaabu codestyle and pass every title and label through `__()`.
- Always activate the `javaabu-block-editor` skill when storing, validating, editing or rendering block content, defining profiles, or writing custom blocks.
@endverbatim
