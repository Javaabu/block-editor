<?php

namespace Javaabu\BlockEditor\Blocks;

class Heading extends Block
{
    protected string $name = 'heading';

    protected string $content = 'inline*';

    protected string $icon = 'heading';

    protected array $keywords = ['title', 'h1', 'h2', 'h3', 'h4'];

    /** @var array<int, int> */
    protected array $levels = [1, 2, 3, 4, 5, 6];

    /**
     * The heading levels the editor offers, e.g. [2, 3, 4] when the page has its own h1.
     *
     * @param  array<int, int>  $levels
     */
    public function levels(array $levels): static
    {
        $this->levels = array_values($levels);

        return $this;
    }

    /** @return array<int, int> */
    public function getLevels(): array
    {
        return $this->levels;
    }

    public function attributes(): array
    {
        return [
            'level' => Attribute::enum($this->levels)->default($this->levels[0] ?? 2)->required()->hidden(),
            'textAlign' => static::alignment(),
            'dir' => static::direction(),
        ];
    }

    public function castAttributes(array $attrs): array
    {
        $attrs = parent::castAttributes($attrs);
        $attrs['level'] = (int) $attrs['level'];

        return $attrs;
    }
}
