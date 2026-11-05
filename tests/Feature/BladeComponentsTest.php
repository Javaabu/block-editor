<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;
use Javaabu\BlockEditor\Facades\BlockEditor;
use Javaabu\BlockEditor\Tests\Fixtures\Blocks\Alert;
use Javaabu\BlockEditor\Tests\Fixtures\Models\Post;
use Javaabu\BlockEditor\Tests\Support\Content as C;
use Javaabu\BlockEditor\Tests\TestCase;
use Javaabu\Manifest\Facades\Manifest;
use PHPUnit\Framework\Attributes\Test;

class BladeComponentsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpDatabase();
    }

    protected function attribute(string $html, string $name): ?string
    {
        if (preg_match('/' . preg_quote($name, '/') . '="([^"]*)"/', $html, $matches) !== 1) {
            return null;
        }

        return html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5);
    }

    #[Test]
    public function it_renders_content(): void
    {
        $post = Post::create(['body' => C::doc(C::heading(2, 'ސުރުޚީ'), C::paragraph('<i>x</i>'))]);

        $html = Blade::render('<x-block-editor::content :content="$post->body" class="prose" />', ['post' => $post->fresh()]);

        $this->assertEquals('<div class="block-content prose"><h2 dir="auto">ސުރުޚީ</h2><p dir="auto">&lt;i&gt;x&lt;/i&gt;</p></div>', trim($html));
    }

    #[Test]
    public function it_shows_the_slot_when_there_is_no_content(): void
    {
        $html = Blade::render('<x-block-editor::content :content="null">ކޮންޓެންޓެއް ނެތް</x-block-editor::content>');

        $this->assertEquals('ކޮންޓެންޓެއް ނެތް', trim($html));
    }

    #[Test]
    public function it_requires_the_stylesheet_for_content(): void
    {
        Manifest::fake();

        Blade::render('<x-block-editor::content :content="$content" />', ['content' => C::doc(C::paragraph('a'))]);

        Manifest::assertAssetRequired('block-editor::styles');
    }

    #[Test]
    public function it_renders_the_editor_field_bound_to_a_model(): void
    {
        $post = Post::create(['body' => C::doc(C::paragraph('ދިވެހި'))]);

        $html = Blade::render('<x-block-editor::editor name="body" :model="$post" required />', ['post' => $post->fresh()]);

        $this->assertStringContainsString('data-block-editor', $html);
        $this->assertStringContainsString('data-input-id="body"', $html);
        $this->assertStringContainsString('data-label="Body"', $html);
        $this->assertStringContainsString('data-required', $html);

        $value = $this->attribute($html, 'value');
        $this->assertEquals('ދިވެހި', json_decode($value, true)['content'][0]['content'][0]['text']);

        $config = json_decode($this->attribute($html, 'data-config'), true);
        $this->assertEquals('default', $config['profile']);
        $this->assertContains('columns', array_column($config['blocks'], 'name'));
    }

    #[Test]
    public function it_prefers_old_input(): void
    {
        $this->app['session.store']->put('_old_input', ['body' => json_encode(C::doc(C::paragraph('old')))]);
        request()->setLaravelSession($this->app['session.store']);

        $html = Blade::render('<x-block-editor::editor name="body" :default="$default" />', ['default' => C::doc(C::paragraph('default'))]);

        $this->assertStringContainsString('old', $this->attribute($html, 'value'));
    }

    #[Test]
    public function it_passes_errors_on_blocks_to_the_editor(): void
    {
        $errors = (new ViewErrorBag)->put('default', new MessageBag([
            'body' => ['ބްލޮކް 2 (ބަޓަން): ލިންކް ރަނގަޅެއް ނޫން'],
            'body.content.1.attrs.url' => ['ލިންކް ރަނގަޅެއް ނޫން'],
            'title' => ['x'],
        ]));
        $this->app['session']->put('errors', $errors);
        view()->share('errors', $errors);

        $html = Blade::render('<x-block-editor::editor name="body" label="ކޮންޓެންޓް" />');

        $this->assertStringContainsString('data-invalid', $html);
        $this->assertEquals(['body.content.1.attrs.url' => ['ލިންކް ރަނގަޅެއް ނޫން']], json_decode($this->attribute($html, 'data-errors'), true));
        $this->assertStringContainsString('ބްލޮކް 2 (ބަޓަން)', $html);
        $this->assertEquals('body', $this->attribute($html, 'data-error-prefix'));
    }

    #[Test]
    public function it_uses_the_profile_and_thaana_options(): void
    {
        $html = Blade::render('<x-block-editor::editor name="summary" profile="minimal" thaana :toolbar="false" />');
        $config = json_decode($this->attribute($html, 'data-config'), true);

        $this->assertEquals('minimal', $config['profile']);
        $this->assertNotContains('button', array_column($config['blocks'], 'name'));
        $this->assertTrue($config['thaana']['default_on']);
        $this->assertStringContainsString('data-toolbar="false"', $html);

        $html = Blade::render('<x-block-editor::editor name="summary" :thaana-keyboard="false" />');

        $this->assertEquals(['enabled' => false], json_decode($this->attribute($html, 'data-config'), true)['thaana']);
    }

    #[Test]
    public function it_requires_the_editor_assets_and_the_profile_block_scripts(): void
    {
        Manifest::package('acme', dirname(__DIR__) . '/Fixtures')->script('alert-block', 'alert-block.ts');
        Manifest::fake();
        BlockEditor::register(Alert::class);

        Blade::render('<x-block-editor::editor name="body" />');

        Manifest::assertAssetRequired('block-editor::editor');
        Manifest::assertAssetRequired('block-editor::styles');
        Manifest::assertAssetRequired('acme::alert-block');
    }

    #[Test]
    public function it_translates_the_editor(): void
    {
        app()->setLocale('dv');

        $html = Blade::render('<x-block-editor::editor name="body" />');
        $config = json_decode($this->attribute($html, 'data-config'), true);

        $this->assertEquals('dv', $config['locale']);
        $this->assertEquals('ބްލޮކެއް އިތުރުކުރައްވާ', $config['strings']['addBlock']);
    }
}
