<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Javaabu\BlockEditor\Document;
use Javaabu\BlockEditor\Rules\BlockContent;
use Javaabu\BlockEditor\Stencil\BlockEditorField;
use Javaabu\BlockEditor\Tests\Fixtures\Models\Post;
use Javaabu\BlockEditor\Tests\Support\Content as C;
use Javaabu\BlockEditor\Tests\TestCase;
use Javaabu\Stencil\Fields\TextInput;
use Javaabu\Stencil\Form;
use PHPUnit\Framework\Attributes\Test;

class StencilFieldTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpDatabase();
    }

    protected function form(?Post $post = null): Form
    {
        return Form::make()
            ->model($post ?? new Post)
            ->action('/posts')
            ->schema([
                TextInput::make('title')->thaana(),
                BlockEditorField::make('body')->label('ކޮންޓެންޓް')->profile('minimal')->required(),
            ]);
    }

    #[Test]
    public function it_serializes_for_the_react_renderer(): void
    {
        $post = Post::create(['title' => 'x', 'body' => C::doc(C::paragraph('ދިވެހި'))]);

        $schema = $this->form($post->fresh())->toArray();
        $node = collect($schema['components'])->firstWhere('key', 'body');

        $this->assertEquals('block-editor', $node['type']);
        $this->assertEquals('ކޮންޓެންޓް', $node['props']['label']);
        $this->assertEquals('minimal', $node['props']['profile']);
        $this->assertEquals('minimal', $node['props']['config']['profile']);
        $this->assertEquals('ދިވެހި', $schema['state']['body']['content'][0]['content'][0]['text']);
    }

    #[Test]
    public function it_renders_the_blade_editor(): void
    {
        $post = Post::create(['title' => 'x', 'body' => C::doc(C::paragraph('ދިވެހި'))]);

        $html = $this->form($post->fresh())->render()->toHtml();

        $this->assertStringContainsString('data-block-editor', $html);
        $this->assertStringContainsString('name="body"', $html);
        $this->assertStringContainsString('ދިވެހި', html_entity_decode($html));
        $this->assertStringContainsString('&quot;profile&quot;:&quot;minimal&quot;', $html);
    }

    #[Test]
    public function it_validates_with_the_profile(): void
    {
        $rules = $this->form()->rules()['body'];

        $this->assertContains('required', $rules);
        $this->assertInstanceOf(BlockContent::class, collect($rules)->first(fn ($rule) => $rule instanceof BlockContent));

        $this->form()->assertable()
            ->assertInvalid(['body' => json_encode(C::doc(C::node('button', ['text' => 'x', 'url' => '/'])))], 'body')
            ->assertInvalid(['body' => json_encode(C::doc(C::paragraph()))], 'body');
    }

    #[Test]
    public function it_returns_the_content_as_an_array_and_saves_it(): void
    {
        request()->merge(['title' => 'ސުރުޚީ', 'body' => json_encode(C::doc(C::paragraph('ބޮޑީ')))]);

        $form = $this->form();
        $data = $form->validate();

        $this->assertEquals('ބޮޑީ', $data['body']['content'][0]['content'][0]['text']);

        $post = $form->save();

        $this->assertInstanceOf(Document::class, $post->fresh()->body);
        $this->assertEquals('ބޮޑީ', $post->fresh()->body->toText());
    }
}
