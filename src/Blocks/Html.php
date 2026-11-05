<?php

namespace Javaabu\BlockEditor\Blocks;

use Javaabu\BlockEditor\Node;
use Javaabu\BlockEditor\Rendering\Renderer;
use Javaabu\BlockEditor\Sanitizing\HtmlSanitizer;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;

/**
 * Raw HTML, cleaned by the HTML sanitizer when it's saved and again when it renders:
 * no scripts, styles, event handlers or unsafe URLs.
 */
class Html extends Block
{
    protected string $name = 'html';

    protected string $category = 'advanced';

    protected string $icon = 'code-xml';

    protected array $keywords = ['html', 'markup', 'raw', 'custom'];

    public function attributes(): array
    {
        return [
            'html' => Attribute::text()->required()->input('code'),
        ];
    }

    public function sanitize(Node $node, Sanitizer $sanitizer): ?Node
    {
        $html = $sanitizer->html($node->attr('html'));

        return $html === ''
            ? null
            : $node->withAttrs(['html' => $html]);
    }

    public function render(Node $node, Renderer $renderer): string
    {
        $html = app(HtmlSanitizer::class)->sanitize((string) $node->attr('html', ''));

        if ($html === '') {
            return '';
        }

        return trim(view($this->view(), [...$this->viewData($node, $renderer), 'html' => $html])->render());
    }

    public function toText(Node $node, Renderer $renderer): string
    {
        return trim(html_entity_decode(strip_tags((string) $node->attr('html', '')), ENT_QUOTES | ENT_HTML5));
    }
}
