<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Javaabu\BlockEditor\Facades\BlockEditor;
use Javaabu\BlockEditor\Tests\Support\CanonicalHtml;
use Javaabu\BlockEditor\Tests\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

/**
 * Renders tests/Fixtures/content/*.json with the Blade views and compares them to
 * the .html next to them. The React renderer is tested against the same files
 * (tests/js/fixtures.test.tsx), so both stacks render the same markup.
 *
 * BLOCK_EDITOR_UPDATE_FIXTURES=1 vendor/bin/phpunit --filter RenderingFixturesTest
 */
class RenderingFixturesTest extends TestCase
{
    /** @return array<string, array{0: string}> */
    public static function fixtures(): array
    {
        $fixtures = [];

        foreach (glob(dirname(__DIR__) . '/Fixtures/content/*.json') as $path) {
            $fixtures[basename($path, '.json')] = [$path];
        }

        return $fixtures;
    }

    #[Test]
    #[DataProvider('fixtures')]
    public function it_renders_the_fixture(string $path): void
    {
        $html = CanonicalHtml::from(BlockEditor::render(file_get_contents($path)));
        $expected_path = preg_replace('/\.json$/', '.html', $path);

        if (getenv('BLOCK_EDITOR_UPDATE_FIXTURES')) {
            file_put_contents($expected_path, $html);
        }

        $this->assertFileExists($expected_path);
        $this->assertEquals(file_get_contents($expected_path), $html);
    }
}
