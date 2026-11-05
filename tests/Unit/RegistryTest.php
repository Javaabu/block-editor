<?php

namespace Javaabu\BlockEditor\Tests\Unit;

use Javaabu\BlockEditor\Blocks\Heading;
use Javaabu\BlockEditor\Blocks\Paragraph;
use Javaabu\BlockEditor\Exceptions\UnknownBlockException;
use Javaabu\BlockEditor\Facades\BlockEditor;
use Javaabu\BlockEditor\Tests\Fixtures\Blocks\Alert;
use Javaabu\BlockEditor\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class RegistryTest extends TestCase
{
    #[Test]
    public function it_registers_the_core_blocks_and_marks_from_config(): void
    {
        $this->assertTrue(BlockEditor::has('paragraph'));
        $this->assertTrue(BlockEditor::has('columns'));
        $this->assertInstanceOf(Paragraph::class, BlockEditor::get('paragraph'));
        $this->assertEquals(['bold', 'italic', 'underline', 'strike', 'code', 'link'], array_keys(BlockEditor::marks()));
    }

    #[Test]
    public function it_registers_replaces_and_forgets_blocks(): void
    {
        BlockEditor::register(Alert::class);

        $this->assertInstanceOf(Alert::class, BlockEditor::get('alert'));

        $heading = (new Heading)->levels([2, 3]);
        BlockEditor::register($heading);

        $this->assertSame($heading, BlockEditor::get('heading'));

        BlockEditor::forget('alert');

        $this->assertFalse(BlockEditor::has('alert'));
    }

    #[Test]
    public function it_throws_for_unknown_blocks_marks_and_profiles(): void
    {
        $this->assertThrows(fn () => BlockEditor::get('nope'), UnknownBlockException::class);
        $this->assertThrows(fn () => BlockEditor::mark('nope'), UnknownBlockException::class);
        $this->assertThrows(fn () => BlockEditor::profile('nope'), UnknownBlockException::class);
    }

    #[Test]
    public function it_limits_blocks_and_marks_by_profile(): void
    {
        BlockEditor::profile('comment', ['paragraph', 'bulletList'], ['bold']);

        $blocks = array_map(fn ($block) => $block->name(), BlockEditor::blocksFor('comment'));

        $this->assertContains('paragraph', $blocks);
        $this->assertContains('bulletList', $blocks);
        $this->assertContains('listItem', $blocks, 'Child blocks come with their parents.');
        $this->assertNotContains('heading', $blocks);
        $this->assertEquals(['bold'], array_map(fn ($mark) => $mark->name(), BlockEditor::marksFor('comment')));
    }

    #[Test]
    public function it_reads_profiles_from_config(): void
    {
        $minimal = BlockEditor::profile('minimal');

        $this->assertContains('heading', $minimal->blocks);
        $this->assertTrue($minimal->allowsMark('link'));
        $this->assertFalse($minimal->allowsMark('code'));
        $this->assertEquals('default', BlockEditor::profile()->name);
    }

    #[Test]
    public function it_builds_the_editor_config(): void
    {
        BlockEditor::register(Alert::class);

        $config = BlockEditor::editorConfig();
        $alert = collect($config['blocks'])->firstWhere('name', 'alert');

        $this->assertEquals(1, $config['version']);
        $this->assertEquals('default', $config['profile']);
        $this->assertEquals('Alert', $alert['title']);
        $this->assertEquals('inline*', $alert['content']);
        $this->assertEquals(['bold'], $alert['marks']);
        $this->assertEquals('calm', $alert['attributes']->tone['default']);
        $this->assertEquals('select', $alert['attributes']->tone['input']);
        $this->assertEquals([['value' => 'calm', 'label' => 'Calm'], ['value' => 'loud', 'label' => 'Loud']], $alert['attributes']->tone['options']);
        $this->assertEquals(['acme::alert-block'], BlockEditor::scripts());
        $this->assertEquals([], BlockEditor::scripts('minimal'));
    }

    #[Test]
    public function it_translates_the_editor_config(): void
    {
        app()->setLocale('dv');

        $config = BlockEditor::editorConfig();
        $heading = collect($config['blocks'])->firstWhere('name', 'heading');

        $this->assertEquals('dv', $config['locale']);
        $this->assertEquals('ސުރުޚީ', $heading['title']);
    }
}
