<?php

namespace Javaabu\BlockEditor\Tests;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Javaabu\BlockEditor\BlockEditorServiceProvider;
use Javaabu\Forms\FormsServiceProvider;
use Javaabu\Manifest\ManifestServiceProvider;
use Javaabu\Stencil\StencilServiceProvider;
use Orchestra\Testbench\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function getPackageProviders($app): array
    {
        return [
            ManifestServiceProvider::class,
            FormsServiceProvider::class,
            StencilServiceProvider::class,
            BlockEditorServiceProvider::class,
        ];
    }

    protected function defineEnvironment($app): void
    {
        $app['view']->addNamespace('fixtures', __DIR__ . '/Fixtures/views');

        $app['config']->set('app.key', 'base64:yWa/ByhLC/GUvfToOuaPD7zDwB64qkc/QkaQOrT5IpE=');
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);
    }

    protected function setUpDatabase(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->json('body')->nullable();
            $table->json('summary')->nullable();
            $table->timestamps();
        });
    }
}
