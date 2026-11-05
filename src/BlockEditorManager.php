<?php

namespace Javaabu\BlockEditor;

use Illuminate\Contracts\Container\Container;
use Javaabu\BlockEditor\Blocks\Block;
use Javaabu\BlockEditor\Exceptions\UnknownBlockException;
use Javaabu\BlockEditor\Marks\Mark;
use Javaabu\BlockEditor\Rendering\Renderer;
use Javaabu\BlockEditor\Sanitizing\Sanitizer;

/**
 * The registry of blocks, marks and profiles (the BlockEditor facade).
 */
class BlockEditorManager
{
    /** @var array<string, Block> */
    protected array $blocks = [];

    /** @var array<string, Mark> */
    protected array $marks = [];

    /** @var array<string, Profile> */
    protected array $profiles = [];

    public function __construct(protected Container $container)
    {
        $this->register(...config('block-editor.blocks', []));
        $this->registerMark(...config('block-editor.marks', []));

        foreach (config('block-editor.profiles', []) as $name => $profile) {
            $this->profile($name, $profile['blocks'] ?? ['*'], $profile['marks'] ?? ['*']);
        }
    }

    /**
     * Registers blocks, by class name or instance. A block with the name of one
     * that's already registered replaces it.
     */
    public function register(string|Block ...$blocks): static
    {
        foreach ($blocks as $block) {
            $block = is_string($block) ? $this->container->make($block) : $block;

            $this->blocks[$block->name()] = $block;
        }

        return $this;
    }

    public function forget(string ...$names): static
    {
        foreach ($names as $name) {
            unset($this->blocks[$name]);
        }

        return $this;
    }

    public function has(string $name): bool
    {
        return isset($this->blocks[$name]);
    }

    public function get(string $name): Block
    {
        return $this->blocks[$name] ?? throw UnknownBlockException::block($name);
    }

    /** @return array<string, Block> */
    public function blocks(): array
    {
        return $this->blocks;
    }

    public function registerMark(string|Mark ...$marks): static
    {
        foreach ($marks as $mark) {
            $mark = is_string($mark) ? $this->container->make($mark) : $mark;

            $this->marks[$mark->name()] = $mark;
        }

        return $this;
    }

    public function forgetMark(string ...$names): static
    {
        foreach ($names as $name) {
            unset($this->marks[$name]);
        }

        return $this;
    }

    public function hasMark(string $name): bool
    {
        return isset($this->marks[$name]);
    }

    public function mark(string $name): Mark
    {
        return $this->marks[$name] ?? throw UnknownBlockException::mark($name);
    }

    /** @return array<string, Mark> */
    public function marks(): array
    {
        return $this->marks;
    }

    /**
     * Defines a profile when blocks or marks are given, and returns it. Without a
     * name, the default profile (config `block-editor.default_profile`).
     *
     * @param  array<int, string>|null  $blocks
     * @param  array<int, string>|null  $marks
     */
    public function profile(?string $name = null, ?array $blocks = null, ?array $marks = null): Profile
    {
        $name ??= config('block-editor.default_profile', 'default');

        if (! is_null($blocks) || ! is_null($marks)) {
            return $this->profiles[$name] = new Profile($name, $blocks ?? ['*'], $marks ?? ['*']);
        }

        if (isset($this->profiles[$name])) {
            return $this->profiles[$name];
        }

        if ($name === 'default') {
            return $this->profiles[$name] = new Profile($name);
        }

        throw UnknownBlockException::profile($name);
    }

    /** @return array<string, Profile> */
    public function profiles(): array
    {
        return $this->profiles;
    }

    /**
     * The blocks a profile allows, in registration order.
     *
     * @return array<int, Block>
     */
    public function blocksFor(string|Profile|null $profile = null): array
    {
        $profile = $this->resolveProfile($profile);

        return array_values(array_filter($this->blocks, fn (Block $block) => $profile->allowsBlock($block)));
    }

    /** @return array<int, Mark> */
    public function marksFor(string|Profile|null $profile = null): array
    {
        $profile = $this->resolveProfile($profile);

        return array_values(array_filter($this->marks, fn (Mark $mark) => $profile->allowsMark($mark->name())));
    }

    public function resolveProfile(string|Profile|null $profile): Profile
    {
        return $profile instanceof Profile
            ? $profile
            : $this->profile($profile);
    }

    /**
     * A node type's groups: `inline` for text, the block's groups otherwise.
     *
     * @return array<int, string>
     */
    public function groupsOf(string $type): array
    {
        if ($type === 'text') {
            return ['inline'];
        }

        return $this->has($type)
            ? $this->get($type)->groups()
            : [];
    }

    /**
     * The JSON the editor is configured with: the profile's blocks and marks, the
     * UI strings in the current locale, and the Thaana settings.
     *
     * @return array<string, mixed>
     */
    public function editorConfig(string|Profile|null $profile = null): array
    {
        $profile = $this->resolveProfile($profile);

        return [
            'version' => 1,
            'profile' => $profile->name,
            'locale' => app()->getLocale(),
            'blocks' => array_map(fn (Block $block) => $block->toEditor(), $this->blocksFor($profile)),
            'marks' => array_map(fn (Mark $mark) => $mark->toEditor(), $this->marksFor($profile)),
            'strings' => (object) trans('block-editor::editor'),
            'thaana' => (object) config('block-editor.thaana', []),
        ];
    }

    /**
     * The javaabu/manifest script assets of the profile's blocks.
     *
     * @return array<int, string>
     */
    public function scripts(string|Profile|null $profile = null): array
    {
        $scripts = [];

        foreach ($this->blocksFor($profile) as $block) {
            if ($block->script()) {
                $scripts[] = $block->script();
            }
        }

        return array_values(array_unique($scripts));
    }

    public function document(mixed $content): Document
    {
        return Document::make($content);
    }

    /**
     * Sanitizes the content and renders it to HTML.
     */
    public function render(mixed $content, string|Profile|null $profile = null): string
    {
        return $this->container->make(Renderer::class)->render($this->sanitize($content, $profile)->root());
    }

    public function sanitize(mixed $content, string|Profile|null $profile = null): Document
    {
        return new Document($this->container->make(Sanitizer::class)->sanitize(Document::make($content)->root(), $this->resolveProfile($profile)));
    }
}
