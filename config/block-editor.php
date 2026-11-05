<?php

use Javaabu\BlockEditor\Blocks;
use Javaabu\BlockEditor\Marks;

return [

    /*
    |--------------------------------------------------------------------------
    | Blocks
    |--------------------------------------------------------------------------
    |
    | The block classes registered when the app boots, in menu order. Add your
    | own here or with BlockEditor::register() in a service provider; remove one
    | to take it out of every editor. Child blocks (list items, table rows and
    | cells, columns) come with their parents and aren't in the menus.
    |
    */

    'blocks' => [
        Blocks\Paragraph::class,
        Blocks\Heading::class,
        Blocks\BulletList::class,
        Blocks\OrderedList::class,
        Blocks\ListItem::class,
        Blocks\Blockquote::class,
        Blocks\Callout::class,
        Blocks\CodeBlock::class,
        Blocks\Table::class,
        Blocks\TableRow::class,
        Blocks\TableHeader::class,
        Blocks\TableCell::class,
        Blocks\HorizontalRule::class,
        Blocks\Image::class,
        Blocks\Embed::class,
        Blocks\Button::class,
        Blocks\Columns::class,
        Blocks\Column::class,
        Blocks\Html::class,
        Blocks\HardBreak::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Marks
    |--------------------------------------------------------------------------
    |
    | Inline formatting, in toolbar order.
    |
    */

    'marks' => [
        Marks\Bold::class,
        Marks\Italic::class,
        Marks\Underline::class,
        Marks\Strike::class,
        Marks\Code::class,
        Marks\Link::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Profiles
    |--------------------------------------------------------------------------
    |
    | Named sets of blocks and marks. An editor, a cast and the validation rule
    | take a profile, so a comment field can offer less than a page body. Use
    | ['*'] for everything registered. Define more with BlockEditor::profile().
    |
    */

    'default_profile' => 'default',

    'profiles' => [
        'default' => [
            'blocks' => ['*'],
            'marks' => ['*'],
        ],

        'minimal' => [
            'blocks' => ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote'],
            'marks' => ['bold', 'italic', 'underline', 'link'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Thaana typing
    |--------------------------------------------------------------------------
    |
    | Phonetic (JTK) Thaana typing from a Latin keyboard, toggled from the
    | toolbar or with the shortcut. "default_on" null turns it on when the app
    | locale is dv. Keymaps: phonetic (JTK), typewriter.
    |
    */

    'thaana' => [
        'enabled' => true,
        'default_on' => null,
        'keymap' => 'phonetic',
        'shortcut' => 'Alt-Shift-t',
    ],

    /*
    |--------------------------------------------------------------------------
    | Embeds
    |--------------------------------------------------------------------------
    |
    | Providers the embed block frames. Others render as a link. Add your own
    | with Embed::provider() (and registerEmbedProvider() in JS).
    |
    */

    'embeds' => [
        'providers' => ['youtube', 'vimeo'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Sanitizing
    |--------------------------------------------------------------------------
    |
    | Content is sanitized when it's saved through the cast and again when it
    | renders. Unknown blocks, marks and attributes are dropped, URLs must use
    | one of the schemes below, and the HTML block is cleaned by
    | symfony/html-sanitizer (HtmlSanitizer::configureUsing() for more control).
    |
    */

    'sanitize' => [
        'on_save' => true,
        'max_depth' => 20,
        'url_schemes' => ['http', 'https', 'mailto', 'tel'],
        'data_images' => false,
        'link_rel' => 'noopener noreferrer nofollow',

        'html' => [
            'link_schemes' => ['http', 'https', 'mailto', 'tel'],
            'media_schemes' => ['http', 'https'],
            'allow_attributes' => ['class', 'dir', 'lang'],
            // Allowing iframes limits every media URL (img too) to these hosts.
            'iframe_hosts' => [],
            'max_length' => 100000,
        ],
    ],

];
