<?php

namespace Javaabu\BlockEditor\Blocks;

use Javaabu\BlockEditor\Node;

class Columns extends Block
{
    public const array LAYOUTS = ['1-1', '1-2', '2-1', '1-1-1', '1-2-1', '2-1-1', '1-1-2', '1-1-1-1'];

    protected string $name = 'columns';

    protected string $content = 'column{1,6}';

    protected string $category = 'layout';

    protected string $icon = 'columns';

    protected array $keywords = ['layout', 'grid', 'row', 'side by side'];

    public function attributes(): array
    {
        return [
            'layout' => Attribute::enum(static::layoutOptions())->default('1-1')->required(),
            'stackAt' => Attribute::enum([
                'sm' => __('block-editor::strings.stack.sm'),
                'md' => __('block-editor::strings.stack.md'),
                'lg' => __('block-editor::strings.stack.lg'),
                'never' => __('block-editor::strings.stack.never'),
            ])->default('md')->required(),
            'gap' => Attribute::enum([
                'none' => __('block-editor::strings.gaps.none'),
                'sm' => __('block-editor::strings.gaps.sm'),
                'md' => __('block-editor::strings.gaps.md'),
                'lg' => __('block-editor::strings.gaps.lg'),
            ])->default('md')->required(),
            'verticalAlign' => Attribute::enum(['stretch', 'start', 'center', 'end'])->default('stretch')->required(),
        ];
    }

    /**
     * The layouts as percentages: `1-2` is 33 / 67.
     *
     * @return array<string, string>
     */
    public static function layoutOptions(): array
    {
        $options = [];

        foreach (static::LAYOUTS as $layout) {
            $fractions = array_map('intval', explode('-', $layout));
            $total = array_sum($fractions);

            $options[$layout] = implode(' / ', array_map(fn (int $fraction) => (string) round($fraction / $total * 100), $fractions));
        }

        return $options;
    }

    /**
     * The CSS grid columns: the layout's fractions when they match the number of
     * columns, else equal columns.
     */
    public function template(Node $node): string
    {
        $fractions = explode('-', (string) $node->attr('layout', '1-1'));
        $count = count($node->content);

        if (count($fractions) !== $count) {
            $fractions = array_fill(0, max(1, $count), '1');
        }

        return implode(' ', array_map(fn ($fraction) => "minmax(0, {$fraction}fr)", $fractions));
    }
}
