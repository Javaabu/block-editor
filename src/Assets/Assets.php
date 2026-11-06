<?php

namespace Javaabu\BlockEditor\Assets;

use Javaabu\Manifest\Package;

/**
 * The package's frontend assets, registered with javaabu/manifest.
 */
class Assets
{
    public const string PACKAGE = 'block-editor';

    /** The editor and content stylesheet. */
    public const string STYLES = 'block-editor::styles';

    /** The Blade entry: mounts every [data-block-editor]. */
    public const string EDITOR = 'block-editor::editor';

    public const string TIPTAP = '^3.32.3';

    /** javaabu/react-forms, which BlockEditorField and the stencil field use. */
    public const string REACT_FORMS = 'github:Javaabu/react-forms#next-gen';

    public static function register(Package $package): void
    {
        $package
            ->js('js')
            ->dist('../dist')
            ->style('styles', 'css/block-editor.css')
            ->script('editor', 'js/blade/editor.ts', depends_on: ['styles'])
            // The Blade entry imports these. @javaabu/onu/editor is one module that also imports
            // React, @tiptap/react and @tiptap/static-renderer, so Blade apps building the entry
            // need them too until Onu has a React-free entry (Javaabu/onu#62).
            ->npm([
                '@javaabu/onu' => '^0.2.1',
                '@tiptap/core' => self::TIPTAP,
                '@tiptap/extension-image' => self::TIPTAP,
                '@tiptap/extension-placeholder' => self::TIPTAP,
                '@tiptap/extension-table' => self::TIPTAP,
                '@tiptap/extension-text-align' => self::TIPTAP,
                '@tiptap/extensions' => self::TIPTAP,
                '@tiptap/pm' => self::TIPTAP,
                '@tiptap/react' => self::TIPTAP,
                '@tiptap/starter-kit' => self::TIPTAP,
                '@tiptap/static-renderer' => self::TIPTAP,
                '@tiptap/suggestion' => self::TIPTAP,
            ], [
                'react' => '^19.0',
                'react-dom' => '^19.0',
            ])
            // Only the React components (imported through @javaabu/block-editor) use these.
            ->npm(
                ['@javaabu/forms' => self::REACT_FORMS],
                for: 'pages',
            );
    }
}
