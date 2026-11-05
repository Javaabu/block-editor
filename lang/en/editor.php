<?php

/*
 * Strings of the editor's interface. They're sent to the editor in its config, so
 * a translation here (or in lang/vendor/block-editor) reaches Blade and React.
 */

return [
    'label' => 'Content',
    'placeholder' => 'Type / for blocks',
    'headingPlaceholder' => 'Heading :level',
    'emptyBlockPlaceholder' => 'Type something',

    'toolbar' => 'Formatting',
    'turnInto' => 'Block type',
    'bold' => 'Bold',
    'italic' => 'Italic',
    'underline' => 'Underline',
    'strike' => 'Strikethrough',
    'code' => 'Code',
    'link' => 'Link',
    'alignStart' => 'Align to the start',
    'alignCenter' => 'Align to the center',
    'alignEnd' => 'Align to the end',
    'undo' => 'Undo',
    'redo' => 'Redo',
    'thaana' => 'Type Thaana',

    'linkUrl' => 'Link URL',
    'linkNewTab' => 'Open in a new tab',
    'linkApply' => 'Apply',
    'linkRemove' => 'Remove link',
    'linkInvalid' => 'Use an http(s), mailto or tel link.',

    'addBlock' => 'Add a block',
    'searchBlocks' => 'Search blocks',
    'noBlocks' => 'No matching blocks',
    'blockActions' => 'Block actions (:block)',
    'dragBlock' => 'Drag to move, or press Enter for actions',
    'settings' => 'Settings',
    'moveUp' => 'Move up',
    'moveDown' => 'Move down',
    'duplicate' => 'Duplicate',
    'delete' => 'Delete',
    'blockMoved' => 'Moved to position :position',
    'blockDeleted' => 'Block deleted',
    'blockInserted' => ':block added',
    'close' => 'Close',
    'blockSettings' => ':block settings',

    'categories' => [
        'text' => 'Text',
        'media' => 'Media',
        'embed' => 'Embeds',
        'layout' => 'Layout',
        'advanced' => 'Advanced',
    ],

    'headingLevel' => 'Heading :level',

    'table' => 'Table',
    'addRowBefore' => 'Add a row above',
    'addRowAfter' => 'Add a row below',
    'addColumnBefore' => 'Add a column before',
    'addColumnAfter' => 'Add a column after',
    'deleteRow' => 'Delete the row',
    'deleteColumn' => 'Delete the column',
    'toggleHeaderRow' => 'Header row',
    'deleteTable' => 'Delete the table',

    'column' => 'Column :number',
    'imageEmpty' => 'Add the image link in the settings',
    'embedEmpty' => 'Add the video link in the settings',
    'embedPreview' => 'Video: :url',
    'buttonEmpty' => 'Set the button text and link in the settings',
    'htmlEmpty' => 'Write the HTML in the settings',
    'genericEmpty' => 'Set this block up in the settings',
    'editSettings' => 'Edit settings',

    'embeddedContent' => 'Embedded content',

    'errors' => 'This block has errors',
    'required' => ':field is required.',
];
