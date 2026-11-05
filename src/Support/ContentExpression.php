<?php

namespace Javaabu\BlockEditor\Support;

use InvalidArgumentException;

/**
 * A ProseMirror content expression (`inline*`, `paragraph block*`, `(tableCell | tableHeader)+`,
 * `column{2,4}`), checked against a node's children. Names are node types or groups.
 */
class ContentExpression
{
    /** @var array<string, self> */
    protected static array $cache = [];

    /**
     * @param  array<int, array{names: array<int, string>, min: int, max: ?int}>  $terms
     */
    final protected function __construct(
        protected string $expression,
        protected array $terms,
    ) {}

    public static function parse(string $expression): static
    {
        $expression = trim($expression);

        if (isset(static::$cache[$expression])) {
            return static::$cache[$expression];
        }

        $source = static::hasTopLevelChoice($expression) ? "({$expression})" : $expression;

        preg_match_all('/\(([^()]*)\)|([A-Za-z_][\w-]*)|([*+?])|\{\s*(\d+)\s*(,\s*(\d*)\s*)?\}|(\S)/', $source, $matches, PREG_SET_ORDER);

        $terms = [];

        foreach ($matches as $match) {
            if (($match[7] ?? '') !== '') {
                throw new InvalidArgumentException("Invalid content expression [{$expression}].");
            }

            if (($match[1] ?? '') !== '' || ($match[2] ?? '') !== '') {
                $names = ($match[1] ?? '') !== ''
                    ? array_values(array_filter(array_map('trim', explode('|', $match[1]))))
                    : [$match[2]];

                $terms[] = ['names' => $names, 'min' => 1, 'max' => 1];

                continue;
            }

            $last = array_key_last($terms);

            if (is_null($last)) {
                throw new InvalidArgumentException("Invalid content expression [{$expression}].");
            }

            [$min, $max] = match ($match[3] ?? '') {
                '*' => [0, null],
                '+' => [1, null],
                '?' => [0, 1],
                default => [(int) $match[4], isset($match[5]) && $match[5] !== '' ? (($match[6] ?? '') === '' ? null : (int) $match[6]) : (int) $match[4]],
            };

            $terms[$last]['min'] = $min;
            $terms[$last]['max'] = $max;
        }

        return static::$cache[$expression] = new static($expression, $terms);
    }

    protected static function hasTopLevelChoice(string $expression): bool
    {
        $depth = 0;

        foreach (str_split($expression) as $character) {
            $depth += match ($character) {
                '(' => 1,
                ')' => -1,
                default => 0,
            };

            if ($character === '|' && $depth === 0) {
                return true;
            }
        }

        return false;
    }

    public function isEmpty(): bool
    {
        return $this->terms === [];
    }

    /**
     * Every type or group name the expression mentions.
     *
     * @return array<int, string>
     */
    public function names(): array
    {
        $names = [];

        foreach ($this->terms as $term) {
            $names = [...$names, ...$term['names']];
        }

        return array_values(array_unique($names));
    }

    /**
     * True when a child of this type (with these groups) may appear somewhere in the content.
     *
     * @param  array<int, string>  $groups
     */
    public function allows(string $type, array $groups = []): bool
    {
        foreach ($this->names() as $name) {
            if ($name === $type || in_array($name, $groups, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * True when the children, given as a list of [type, groups], match the expression.
     *
     * @param  array<int, array{0: string, 1: array<int, string>}>  $children
     */
    public function matches(array $children): bool
    {
        $index = 0;
        $count = count($children);

        foreach ($this->terms as $term) {
            $matched = 0;

            while ($index < $count && (is_null($term['max']) || $matched < $term['max'])) {
                [$type, $groups] = $children[$index];

                if (! $this->termAllows($term['names'], $type, $groups)) {
                    break;
                }

                $matched++;
                $index++;
            }

            if ($matched < $term['min']) {
                return false;
            }
        }

        return $index === $count;
    }

    /**
     * @param  array<int, string>  $names
     * @param  array<int, string>  $groups
     */
    protected function termAllows(array $names, string $type, array $groups): bool
    {
        foreach ($names as $name) {
            if ($name === $type || in_array($name, $groups, true)) {
                return true;
            }
        }

        return false;
    }

    public function __toString(): string
    {
        return $this->expression;
    }
}
