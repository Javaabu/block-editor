<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Illuminate\Support\Facades\Blade;
use Javaabu\BlockEditor\Document;
use Javaabu\BlockEditor\Tests\Fixtures\Models\Post;
use Javaabu\BlockEditor\Tests\Support\Content as C;
use Javaabu\BlockEditor\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class DocumentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpDatabase();
    }

    #[Test]
    public function it_casts_a_json_column_to_a_sanitized_document(): void
    {
        $post = Post::create(['body' => C::doc(
            C::paragraph(C::text('ދިވެހި', [['type' => 'link', 'attrs' => ['href' => 'javascript:alert(1)']]])),
            C::node('mystery'),
        )]);

        $stored = json_decode($post->getRawOriginal('body') ?? $post->getAttributes()['body'], true);

        $this->assertEquals([['type' => 'text', 'text' => 'ދިވެހި']], $stored['content'][0]['content']);
        $this->assertCount(1, $stored['content']);

        $post = $post->fresh();

        $this->assertInstanceOf(Document::class, $post->body);
        $this->assertEquals('ދިވެހި', $post->body->toText());
        $this->assertEquals(['type' => 'doc', 'content' => $stored['content']], $post->toArray()['body']);
    }

    #[Test]
    public function it_sanitizes_for_the_cast_profile(): void
    {
        $post = Post::create(['summary' => C::doc(C::paragraph('kept'), C::node('button', ['text' => 'x', 'url' => '/']))]);

        $this->assertCount(1, $post->fresh()->summary->blocks());
    }

    #[Test]
    public function it_reads_null_as_an_empty_document_and_stores_null(): void
    {
        $post = Post::create(['title' => 'x']);

        $this->assertTrue($post->fresh()->body->isEmpty());

        $post->update(['body' => null]);

        $this->assertDatabaseHas('posts', ['id' => $post->id, 'body' => null]);
    }

    #[Test]
    public function it_can_skip_sanitizing_on_save(): void
    {
        config(['block-editor.sanitize.on_save' => false]);

        $post = Post::create(['body' => C::doc(C::node('mystery'))]);

        $this->assertEquals('mystery', json_decode($post->getAttributes()['body'], true)['content'][0]['type']);
        $this->assertEquals('', $post->fresh()->body->toHtml(), 'Rendering still sanitizes.');
    }

    #[Test]
    public function it_renders_when_echoed_in_blade(): void
    {
        $post = Post::create(['body' => C::doc(C::heading(2, 'ސުރުޚީ'), C::paragraph('<b>escaped</b>'))]);

        $html = Blade::render('{{ $post->body }}', ['post' => $post->fresh()]);

        $this->assertEquals('<h2 dir="auto">ސުރުޚީ</h2><p dir="auto">&lt;b&gt;escaped&lt;/b&gt;</p>', $html);
    }

    #[Test]
    public function it_knows_when_it_is_empty(): void
    {
        $this->assertTrue(Document::make(C::doc())->isEmpty());
        $this->assertTrue(Document::make(C::doc(C::paragraph(), C::paragraph(' ', C::node('hardBreak'))))->isEmpty());
        $this->assertTrue(Document::make(C::doc(C::node('bulletList', [], C::node('listItem', [], C::paragraph()))))->isEmpty());
        $this->assertFalse(Document::make(C::doc(C::paragraph('a')))->isEmpty());
        $this->assertFalse(Document::make(C::doc(C::node('image', ['src' => '/a.png'])))->isEmpty());
        $this->assertTrue(Document::make(C::doc(C::node('image', ['src' => '/a.png'])))->isNotEmpty());
    }

    #[Test]
    public function it_converts_to_text_and_excerpts(): void
    {
        $document = Document::make(file_get_contents(dirname(__DIR__) . '/fixtures/content/lists.json'));

        $this->assertEquals("One\n\nTwo\n\nNested\n\nThree\n\nFour\n\nދިވެހި ލިސްޓު\n\nEnglish", $document->toText());
        $this->assertEquals('One Two…', $document->excerpt(7));

        $html = Document::make(C::doc(C::node('html', ['html' => '<p>Hi &amp; <b>bye</b></p>']), C::node('codeBlock', [], 'x = 1')));

        $this->assertEquals("Hi & bye\n\nx = 1", $html->toText());
    }

    #[Test]
    public function it_serializes_to_json(): void
    {
        $document = Document::make(C::doc(C::paragraph('ދިވެހި/English')));

        $this->assertEquals('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"ދިވެހި/English"}]}]}', $document->toJson());
        $this->assertEquals('{"type":"doc","content":[]}', Document::empty()->toJson());
        $this->assertEquals($document->toArray(), json_decode(json_encode($document), true));
    }
}
