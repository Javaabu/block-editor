<?php

namespace Javaabu\BlockEditor\Views\Components;

use Illuminate\View\Component;
use Javaabu\BlockEditor\Assets\Assets;
use Javaabu\BlockEditor\BlockEditorManager;
use Javaabu\Manifest\Contracts\DeclaresAssets;

/**
 * Renders block editor content, sanitized: `<x-block-editor::content :content="$post->body" />`.
 * The slot is shown when there's no content.
 */
class Content extends Component implements DeclaresAssets
{
    public function __construct(
        public mixed $content = null,
        public ?string $profile = null,
        public bool $styles = true,
    ) {}

    public function html(): string
    {
        return app(BlockEditorManager::class)->render($this->content, $this->profile);
    }

    /** @return array<int, string> */
    public function requiredAssets(): array
    {
        if (! $this->styles || ! config('block-editor.assets', true)) {
            return [];
        }

        return [Assets::STYLES];
    }

    public function render()
    {
        return view('block-editor::components.content');
    }
}
