<?php

namespace Javaabu\BlockEditor;

use Illuminate\Support\ServiceProvider;
use Javaabu\BlockEditor\Rendering\Renderer;
use Javaabu\BlockEditor\Sanitizing\HtmlSanitizer;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;

class BlockEditorServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/block-editor.php', 'block-editor');

        $this->app->singleton(BlockEditorManager::class);
        $this->app->singleton(HtmlSanitizer::class);
        $this->app->singleton(Sanitizer::class);
        $this->app->singleton(Renderer::class);
    }

    public function boot(): void
    {
        $this->loadTranslationsFrom(__DIR__ . '/../lang', 'block-editor');

        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'block-editor');

        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->publishes([
            __DIR__ . '/../config/block-editor.php' => config_path('block-editor.php'),
        ], 'block-editor-config');

        $this->publishes([
            __DIR__ . '/../lang' => lang_path('vendor/block-editor'),
        ], 'block-editor-translations');

        $this->publishes([
            __DIR__ . '/../resources/views' => resource_path('views/vendor/block-editor'),
        ], 'block-editor-views');
    }
}
