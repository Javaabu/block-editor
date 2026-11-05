<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Illuminate\Support\Facades\Validator;
use Javaabu\BlockEditor\Facades\BlockEditor;
use Javaabu\BlockEditor\Rules\BlockContent;
use Javaabu\BlockEditor\Tests\Fixtures\Blocks\Alert;
use Javaabu\BlockEditor\Tests\Support\Content as C;
use Javaabu\BlockEditor\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class ValidationTest extends TestCase
{
    protected function errors(mixed $value, ?BlockContent $rule = null): array
    {
        return Validator::make(['body' => $value], ['body' => [$rule ?? new BlockContent]])->errors()->messages();
    }

    #[Test]
    public function it_passes_valid_content_in_thaana_and_english(): void
    {
        $content = json_decode(file_get_contents(dirname(__DIR__) . '/Fixtures/content/mixed-direction.json'), true);

        $this->assertEquals([], $this->errors($content));
        $this->assertEquals([], $this->errors(json_encode($content)));

        foreach (glob(dirname(__DIR__) . '/Fixtures/content/*.json') as $fixture) {
            $this->assertEquals([], $this->errors(file_get_contents($fixture)), basename($fixture));
        }
    }

    #[Test]
    public function it_rejects_values_that_arent_documents(): void
    {
        $this->assertEquals(['body' => ['The body must be block editor content.']], $this->errors('{"type":"paragraph"}'));
        $this->assertEquals(['body' => ['The body must be block editor content.']], $this->errors('nope'));
        $this->assertEquals(['body' => ['The body must be block editor content.']], $this->errors(['a', 'b']));
    }

    #[Test]
    public function it_reports_attribute_errors_on_the_field_and_the_block_path(): void
    {
        $errors = $this->errors(C::doc(
            C::paragraph('ފުރަތަމަ'),
            C::node('button', ['text' => 'Go', 'url' => 'javascript:alert(1)']),
        ));

        $this->assertEquals([
            'body' => ['Block 2 (Button): Use an http(s), mailto or tel link.'],
            'body.content.1.attrs.url' => ['Use an http(s), mailto or tel link.'],
        ], $errors);
    }

    #[Test]
    public function it_reports_nested_errors_with_the_top_level_block_position(): void
    {
        $errors = $this->errors(C::doc(
            C::paragraph('a'),
            C::node('columns', [], C::node('column', [], C::paragraph('ok')), C::node('column', [], C::node('image', ['alt' => 'no src']))),
        ));

        $this->assertEquals('Block 2 (Image): The URL field is required.', $errors['body'][0]);
        $this->assertArrayHasKey('body.content.1.content.1.content.0.attrs.src', $errors);
    }

    #[Test]
    public function it_rejects_unknown_and_misplaced_blocks(): void
    {
        $errors = $this->errors(C::doc(C::node('mystery'), C::node('listItem', [], C::paragraph('x'))));

        $this->assertEquals(['Unknown block type “mystery”.'], $errors['body.content.0']);
        $this->assertEquals(['The List item block isn\'t allowed here.'], $errors['body.content.1']);
        $this->assertEquals('Block 1 (Block): Unknown block type “mystery”.', $errors['body'][0]);
    }

    #[Test]
    public function it_rejects_children_that_dont_fit_the_content_expression(): void
    {
        $errors = $this->errors(C::doc(C::node('bulletList', [], C::node('listItem', [], C::heading(2, 'x')))));

        $this->assertEquals(['The content of this block isn\'t valid.'], $errors['body.content.0.content.0.content']);
    }

    #[Test]
    public function it_validates_marks(): void
    {
        BlockEditor::profile('plain', ['paragraph'], ['bold']);

        $errors = $this->errors(C::doc(C::paragraph(
            C::text('a', [['type' => 'italic']]),
            C::text('b', [['type' => 'link', 'attrs' => ['href' => 'javascript:x']]]),
            C::text('c', [['type' => 'glitter']]),
        )), new BlockContent('plain'));

        $this->assertEquals(['Italic isn\'t allowed here.'], $errors['body.content.0.content.0.marks.0']);
        $this->assertEquals(['Link isn\'t allowed here.'], $errors['body.content.0.content.1.marks.0']);
        $this->assertEquals(['Unknown formatting “glitter”.'], $errors['body.content.0.content.2.marks.0']);

        $errors = $this->errors(C::doc(C::paragraph(C::text('b', [['type' => 'link', 'attrs' => ['href' => 'javascript:x']]]))));

        $this->assertEquals(['Use an http(s), mailto or tel link.'], $errors['body.content.0.content.0.marks.0.attrs.href']);
    }

    #[Test]
    public function it_runs_block_rules(): void
    {
        BlockEditor::register(Alert::class);

        $errors = $this->errors(C::doc(C::node('alert', ['tone' => 'loud'], 'ހޭލާ')));

        $this->assertEquals(['The Link field is required when Tone is loud.'], $errors['body.content.0.attrs.link']);
        $this->assertEquals([], $this->errors(C::doc(C::node('alert', ['tone' => 'calm'], 'ހޭލާ'))));
    }

    #[Test]
    public function it_checks_the_profile(): void
    {
        $errors = $this->errors(C::doc(C::node('button', ['text' => 'x', 'url' => '/'])), new BlockContent('minimal'));

        $this->assertEquals(['The Button block isn\'t allowed here.'], $errors['body.content.0']);
    }

    #[Test]
    public function it_can_require_content_and_limit_blocks(): void
    {
        $required = BlockContent::make()->required();

        $this->assertEquals(['body' => ['The body field is required.']], $this->errors(C::doc(C::paragraph(), C::paragraph(' ')), $required));
        $this->assertEquals([], $this->errors(C::doc(C::node('horizontalRule')), $required));

        $this->assertEquals(['body' => ['The body may not have more than 1 blocks.']], $this->errors(C::doc(C::paragraph('a'), C::paragraph('b')), BlockContent::make()->maxBlocks(1)));
    }

    #[Test]
    public function it_translates_messages(): void
    {
        app()->setLocale('dv');

        $errors = $this->errors(C::doc(C::node('mystery')));

        $this->assertEquals('ބްލޮކް 1 (ބްލޮކް): “mystery” އަކީ ނޭނގޭ ބާވަތެއްގެ ބްލޮކެއް.', $errors['body'][0]);
    }
}
