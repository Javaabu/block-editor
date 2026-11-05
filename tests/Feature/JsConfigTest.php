<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Javaabu\BlockEditor\Facades\BlockEditor;
use Javaabu\BlockEditor\Tests\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

/**
 * The editor's built-in config (resources/js/generated/config.{locale}.json) is
 * BlockEditor::editorConfig() for the default profile, so the JS works without the
 * PHP config (tests, examples) and stays in step with the PHP blocks.
 *
 * BLOCK_EDITOR_UPDATE_FIXTURES=1 vendor/bin/phpunit --filter JsConfigTest
 */
class JsConfigTest extends TestCase
{
    /** @return array<string, array{0: string}> */
    public static function locales(): array
    {
        return ['en' => ['en'], 'dv' => ['dv']];
    }

    #[Test]
    #[DataProvider('locales')]
    public function it_matches_the_generated_js_config(string $locale): void
    {
        app()->setLocale($locale);

        $json = json_encode(BlockEditor::editorConfig(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
        $path = dirname(__DIR__, 2) . "/resources/js/generated/config.{$locale}.json";

        if (getenv('BLOCK_EDITOR_UPDATE_FIXTURES')) {
            file_put_contents($path, $json);
        }

        $this->assertFileExists($path);
        $this->assertEquals(file_get_contents($path), $json, 'Run BLOCK_EDITOR_UPDATE_FIXTURES=1 vendor/bin/phpunit --filter JsConfigTest');
    }
}
