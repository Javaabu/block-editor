<?php

namespace Javaabu\BlockEditor\Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Javaabu\BlockEditor\Assets\Assets;
use Javaabu\BlockEditor\Tests\TestCase;
use Javaabu\Manifest\Enums\NpmScopes;
use Javaabu\Manifest\Manifest;
use Javaabu\Manifest\Package;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\Finder\Finder;

class NpmDependenciesTest extends TestCase
{
    protected function tearDown(): void
    {
        File::delete(base_path('package.json'));
        File::deleteDirectory(base_path('node_modules'));

        parent::tearDown();
    }

    protected function package(): Package
    {
        return app(Manifest::class)->packages()[Assets::PACKAGE];
    }

    /**
     * @param  array<string, mixed>  $options
     * @return array<string, array<string, mixed>>
     */
    protected function check(array $options = []): array
    {
        Artisan::call('manifest:check', ['--json' => true, ...$options]);

        return collect(json_decode(Artisan::output(), true))->keyBy('name')->all();
    }

    /**
     * An app whose package.json declares, and node_modules has, these packages.
     *
     * @param  array<string, string>  $dependencies
     */
    protected function app(array $dependencies): void
    {
        File::put(base_path('package.json'), json_encode(['devDependencies' => $dependencies]));

        foreach ($dependencies as $name => $constraint) {
            File::ensureDirectoryExists(base_path("node_modules/{$name}"));
            File::put(base_path("node_modules/{$name}/package.json"), json_encode([
                'name' => $name,
                'version' => preg_match('/\d+\.\d+\.\d+|\d+\.\d+|\d+/', $constraint, $match) ? $match[0] : '1.0.0',
            ]));
        }
    }

    /**
     * The npm packages that files import at runtime (type-only imports don't count).
     *
     * @return array<int, string>
     */
    protected function imports(Finder $files): array
    {
        $packages = [];

        foreach ($files as $file) {
            preg_match_all('/^import\s+(?!type\s)(?:[^"\']*?\sfrom\s+)?["\']([^."\'][^"\']*)["\']/m', $file->getContents(), $matches);

            foreach ($matches[1] as $specifier) {
                $parts = explode('/', $specifier);
                $packages[] = str_starts_with($specifier, '@') ? "{$parts[0]}/{$parts[1]}" : $parts[0];
            }
        }

        return array_values(array_unique($packages));
    }

    protected function source(): Finder
    {
        return Finder::create()->files()->in(__DIR__ . '/../../resources/js')->name(['*.ts', '*.tsx'])->notName('*.d.ts');
    }

    #[Test]
    public function it_declares_what_the_blade_entry_imports_for_the_assets(): void
    {
        $assets = [...$this->package()->npmDependencies(NpmScopes::ASSETS), ...$this->package()->npmPeerDependencies(NpmScopes::ASSETS)];

        $imports = $this->imports($this->source()->notPath('react'));

        $this->assertNotEmpty($imports);

        foreach ($imports as $name) {
            $this->assertArrayHasKey($name, $assets, "The Blade entry imports {$name}, but it isn't in the assets scope");
        }

        // @javaabu/onu/editor imports React, so the Blade entry needs it (Javaabu/onu#62)
        $this->assertArrayHasKey('react', $assets);
        $this->assertArrayNotHasKey('@javaabu/forms', $assets);
    }

    #[Test]
    public function it_declares_what_only_the_react_components_import_for_pages(): void
    {
        $declared = [...$this->package()->npmDependencies(), ...$this->package()->npmPeerDependencies()];
        $pages = [...$this->package()->npmDependencies(NpmScopes::PAGES), ...$this->package()->npmPeerDependencies(NpmScopes::PAGES)];

        foreach ($this->imports($this->source()->path('react')) as $name) {
            $this->assertArrayHasKey($name, $declared, "The React components import {$name}, but it isn't declared");
        }

        $this->assertEquals(['@javaabu/forms' => Assets::REACT_FORMS], $pages);
    }

    #[Test]
    public function it_does_not_ask_blade_apps_for_what_only_the_react_components_need(): void
    {
        $this->app([]);

        $needed = collect($this->check())->filter(fn (array $row) => in_array(Assets::PACKAGE, $row['needed_by']));

        $this->assertNotContains(Assets::PACKAGE, $this->check()['@javaabu/forms']['needed_by'] ?? []);
        $this->assertEquals(['assets'], $needed['@tiptap/core']['scopes']);

        // A Blade app with what's asked for passes
        $this->app(collect($this->check())->map(fn (array $row) => $row['constraints'][0] ?? '*')->all());

        $this->assertEquals(0, Artisan::call('manifest:check'));
        $this->assertStringContainsString("Package pages weren't checked", Artisan::output());
    }

    #[Test]
    public function it_asks_inertia_apps_for_what_the_react_components_need(): void
    {
        $this->app(['@inertiajs/react' => '^3.0']);

        $rows = $this->check();

        $this->assertEquals('missing', $rows['@javaabu/forms']['status']);

        $this->assertContains(Assets::PACKAGE, $rows['@javaabu/forms']['needed_by']);

        // Block editor asks for it for pages, not for the assets (other packages may ask for either)
        $this->assertContains(Assets::PACKAGE, $this->check(['--scope' => ['pages']])['@javaabu/forms']['needed_by']);
        $this->assertNotContains(Assets::PACKAGE, $this->check(['--scope' => ['assets']])['@javaabu/forms']['needed_by'] ?? []);
    }
}
