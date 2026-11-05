<?php

namespace Javaabu\BlockEditor\Marks;

use Javaabu\BlockEditor\Blocks\Attribute;

/**
 * A link. Unsafe URLs (javascript:, data:, …) drop the link and keep its text.
 */
class Link extends Mark
{
    protected string $name = 'link';

    protected string $tag = 'a';

    public function attributes(): array
    {
        return [
            'href' => Attribute::url()->required(),
            'target' => Attribute::enum(['_blank'])->label(__('block-editor::strings.attributes.newTab')),
        ];
    }

    public function sanitize(array $attrs): ?array
    {
        return is_null($attrs['href'] ?? null) ? null : $attrs;
    }

    public function htmlAttributes(array $attrs): array
    {
        return [
            'href' => $attrs['href'] ?? null,
            'target' => ($attrs['target'] ?? null) === '_blank' ? '_blank' : null,
            'rel' => config('block-editor.sanitize.link_rel', 'noopener noreferrer nofollow'),
        ];
    }
}
