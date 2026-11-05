<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Javaabu\BlockEditor\Document;
use Javaabu\BlockEditor\Facades\BlockEditor;
use Javaabu\BlockEditor\Sanitizing\HtmlSanitizer;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;
use Javaabu\BlockEditor\Tests\Fixtures\Blocks\Alert;
use Javaabu\BlockEditor\Tests\Support\Content as C;
use Javaabu\BlockEditor\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

class SanitizerTest extends TestCase
{
    protected function sanitize(array $content, ?string $profile = null): array
    {
        return BlockEditor::sanitize($content, $profile)->toArray();
    }

    #[Test]
    public function it_drops_unknown_blocks_and_fills_default_attributes(): void
    {
        $sanitized = $this->sanitize(C::doc(
            C::node('mystery', [], 'gone'),
            C::paragraph('ދިވެހި'),
            ['not' => 'a node'],
        ));

        $this->assertEquals([
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'attrs' => ['textAlign' => null, 'dir' => null], 'content' => [['type' => 'text', 'text' => 'ދިވެހި']]],
            ],
        ], $sanitized);
    }

    #[Test]
    public function it_drops_unknown_attributes_and_casts_known_ones(): void
    {
        $sanitized = $this->sanitize(C::doc(
            C::node('heading', ['level' => '3', 'onclick' => 'x', 'textAlign' => 'left'], 'Hi'),
            C::node('orderedList', ['start' => 'abc'], C::node('listItem', [], C::paragraph('a'))),
        ));

        $this->assertEquals(['level' => 3, 'textAlign' => null, 'dir' => null], $sanitized['content'][0]['attrs']);
        $this->assertEquals(1, $sanitized['content'][1]['attrs']['start']);
    }

    #[Test]
    public function it_removes_unsafe_links_but_keeps_their_text(): void
    {
        $sanitized = $this->sanitize(C::doc(C::paragraph(
            C::text('click', [['type' => 'link', 'attrs' => ['href' => 'javascript:alert(1)']]]),
            C::text(' me', [['type' => 'bold'], ['type' => 'bold'], ['type' => 'sparkle']]),
        )));

        $this->assertEquals([
            ['type' => 'text', 'text' => 'click'],
            ['type' => 'text', 'text' => ' me', 'marks' => [['type' => 'bold']]],
        ], $sanitized['content'][0]['content']);
    }

    #[Test]
    public function it_merges_neighbouring_text_with_the_same_marks(): void
    {
        $sanitized = $this->sanitize(C::doc(C::paragraph('ދި', 'ވެހި', C::text('!', [['type' => 'italic']]))));

        $this->assertEquals([
            ['type' => 'text', 'text' => 'ދިވެހި'],
            ['type' => 'text', 'text' => '!', 'marks' => [['type' => 'italic']]],
        ], $sanitized['content'][0]['content']);
    }

    #[Test]
    public function it_strips_control_characters_and_empty_text(): void
    {
        $sanitized = $this->sanitize(C::doc(C::paragraph("a\x00b\x07c", ['type' => 'text', 'text' => ''], "\x01")));

        $this->assertEquals([['type' => 'text', 'text' => 'abc']], $sanitized['content'][0]['content']);
    }

    #[Test]
    public function it_drops_blocks_and_marks_outside_the_profile(): void
    {
        BlockEditor::profile('comment', ['paragraph'], ['bold']);

        $sanitized = $this->sanitize(C::doc(
            C::heading(2, 'Gone'),
            C::paragraph(C::text('kept', [['type' => 'bold'], ['type' => 'italic']])),
        ), 'comment');

        $this->assertCount(1, $sanitized['content']);
        $this->assertEquals([['type' => 'bold']], $sanitized['content'][0]['content'][0]['marks']);
    }

    #[Test]
    public function it_drops_blocks_in_the_wrong_place(): void
    {
        $sanitized = $this->sanitize(C::doc(
            C::node('listItem', [], C::paragraph('stray')),
            C::node('bulletList', [], C::paragraph('not an item'), C::node('listItem', [], C::paragraph('item'))),
            C::node('table', [], C::paragraph('no rows')),
            C::node('codeBlock', [], C::text('code', [['type' => 'bold']])),
        ));

        $this->assertEquals(['bulletList', 'codeBlock'], array_column($sanitized['content'], 'type'));
        $this->assertCount(1, $sanitized['content'][0]['content']);
        $this->assertArrayNotHasKey('marks', $sanitized['content'][1]['content'][0], 'Code blocks allow no marks.');
    }

    #[Test]
    public function it_honours_marks_allowed_by_a_block(): void
    {
        BlockEditor::register(Alert::class);

        $sanitized = $this->sanitize(C::doc(C::node('alert', ['tone' => 'shout'], C::text('x', [['type' => 'bold'], ['type' => 'italic']]))));

        $this->assertEquals('calm', $sanitized['content'][0]['attrs']['tone']);
        $this->assertEquals([['type' => 'bold']], $sanitized['content'][0]['content'][0]['marks']);
    }

    #[Test]
    public function it_drops_images_with_unsafe_sources_and_cleans_code_languages(): void
    {
        $sanitized = $this->sanitize(C::doc(
            C::node('image', ['src' => 'javascript:alert(1)']),
            C::node('image', ['src' => 'data:image/png;base64,iVBORw0KGgo=']),
            C::node('codeBlock', ['language' => '"><script>'], 'x'),
            C::node('embed', ['src' => 'javascript:x']),
        ));

        $this->assertEquals(['codeBlock'], array_column($sanitized['content'], 'type'));
        $this->assertNull($sanitized['content'][0]['attrs']['language']);
    }

    #[Test]
    public function it_sanitizes_html_blocks(): void
    {
        $sanitized = $this->sanitize(C::doc(
            C::node('html', ['html' => '<p onclick="steal()">Hi<script>alert(1)</script> <a href="javascript:x">x</a><img src="https://example.com/a.png" onerror="x"></p><style>body{}</style>']),
            C::node('html', ['html' => '<script>only()</script>']),
        ));

        $this->assertCount(1, $sanitized['content']);
        $this->assertEquals('<p>Hi <a>x</a><img src="https://example.com/a.png" /></p>', $sanitized['content'][0]['attrs']['html']);
    }

    #[Test]
    public function it_lets_apps_configure_the_html_sanitizer(): void
    {
        HtmlSanitizer::configureUsing(fn (HtmlSanitizerConfig $config) => $config->blockElement('strong'));
        $this->app->forgetInstance(HtmlSanitizer::class);
        $this->app->forgetInstance(Sanitizer::class);

        try {
            $sanitized = $this->sanitize(C::doc(C::node('html', ['html' => '<p><strong>x</strong></p>'])));

            $this->assertEquals('<p>x</p>', $sanitized['content'][0]['attrs']['html']);
        } finally {
            HtmlSanitizer::configureUsing(null);
        }
    }

    #[Test]
    public function it_limits_nesting(): void
    {
        config(['block-editor.sanitize.max_depth' => 3]);

        $deep = C::paragraph('deep');

        foreach (range(1, 5) as $level) {
            $deep = C::node('blockquote', [], $deep);
        }

        $this->assertEquals([], $this->sanitize(C::doc($deep))['content']);
    }

    #[Test]
    public function it_accepts_json_strings_lists_and_documents(): void
    {
        $json = json_encode(C::doc(C::paragraph('a')));

        $this->assertCount(1, Document::make($json)->sanitize()->blocks());
        $this->assertCount(1, Document::make([C::paragraph('a')])->blocks());
        $this->assertCount(0, Document::make('not json')->blocks());
        $this->assertCount(0, Document::make(null)->blocks());
        $this->assertCount(0, Document::make('')->blocks());
    }
}
