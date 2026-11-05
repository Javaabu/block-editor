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

    public static function register(Package $package): void
    {
        $package
            ->js('js')
            ->dist('../dist')
            ->style('styles', 'css/block-editor.css')
            ->script('editor', 'js/blade/editor.ts', depends_on: ['styles'])
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
            ]);
    }
}
