<?php

namespace Javaabu\BlockEditor\Facades;

use Illuminate\Support\Facades\Facade;
use Javaabu\BlockEditor\BlockEditorManager;

/**
 * @method static BlockEditorManager register(string|\Javaabu\BlockEditor\Blocks\Block ...$blocks)
 * @method static BlockEditorManager forget(string ...$names)
 * @method static bool has(string $name)
 * @method static \Javaabu\BlockEditor\Blocks\Block get(string $name)
 * @method static array<string, \Javaabu\BlockEditor\Blocks\Block> blocks()
 * @method static BlockEditorManager registerMark(string|\Javaabu\BlockEditor\Marks\Mark ...$marks)
 * @method static BlockEditorManager forgetMark(string ...$names)
 * @method static bool hasMark(string $name)
 * @method static \Javaabu\BlockEditor\Marks\Mark mark(string $name)
 * @method static array<string, \Javaabu\BlockEditor\Marks\Mark> marks()
 * @method static \Javaabu\BlockEditor\Profile profile(?string $name = null, ?array $blocks = null, ?array $marks = null)
 * @method static array<string, \Javaabu\BlockEditor\Profile> profiles()
 * @method static array<int, \Javaabu\BlockEditor\Blocks\Block> blocksFor(?string $profile = null)
 * @method static array<int, \Javaabu\BlockEditor\Marks\Mark> marksFor(?string $profile = null)
 * @method static array<int, string> groupsOf(string $type)
 * @method static array<string, mixed> editorConfig(?string $profile = null)
 * @method static array<int, string> scripts(?string $profile = null)
 * @method static \Javaabu\BlockEditor\Document document(mixed $content)
 * @method static string render(mixed $content, ?string $profile = null)
 * @method static \Javaabu\BlockEditor\Document sanitize(mixed $content, ?string $profile = null)
 *
 * @see BlockEditorManager
 */
class BlockEditor extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return BlockEditorManager::class;
    }
}
