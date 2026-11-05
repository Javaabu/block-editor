<?php

namespace Javaabu\BlockEditor;

use Javaabu\BlockEditor\Blocks\Block;

/**
 * A named set of blocks and marks an editor offers and its content may contain
 * (`default`, `minimal`, `comment`, …). Child blocks such as list items and
 * columns come with their parent.
 */
class Profile
{
    /**
     * @param  array<int, string>  $blocks  Block names, or ['*'] for every registered block.
     * @param  array<int, string>  $marks  Mark names, or ['*'] for every registered mark.
     */
    public function __construct(
        public readonly string $name,
        public readonly array $blocks = ['*'],
        public readonly array $marks = ['*'],
    ) {}

    public function allowsBlock(Block $block): bool
    {
        if (! in_array('block', $block->groups(), true)) {
            return true;
        }

        return in_array('*', $this->blocks, true) || in_array($block->name(), $this->blocks, true);
    }

    public function allowsMark(string $mark): bool
    {
        return in_array('*', $this->marks, true) || in_array($mark, $this->marks, true);
    }
}
