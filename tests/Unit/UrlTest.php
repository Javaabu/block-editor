<?php

namespace Javaabu\BlockEditor\Tests\Unit;

use Javaabu\BlockEditor\Support\Url;
use Javaabu\BlockEditor\Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class UrlTest extends TestCase
{
    #[Test]
    public function it_allows_safe_links(): void
    {
        foreach (['https://javaabu.com', 'http://example.mv/a?b=c', 'mailto:info@javaabu.com', 'tel:+9603000000', '/about', '#top', '?page=2', 'page', '//cdn.example.com/a.png'] as $url) {
            $this->assertTrue(Url::isSafe($url), $url);
        }
    }

    #[Test]
    public function it_rejects_scripts_and_other_schemes(): void
    {
        foreach (['javascript:alert(1)', ' JavaScript:alert(1)', "java\x00script:alert(1)", "java\tscript:alert(1)", "java\nscript:x", 'data:text/html;base64,AAAA', 'vbscript:x', '', null, 'file:///etc/passwd'] as $url) {
            $this->assertFalse(Url::isSafe($url), (string) $url);
        }
    }

    #[Test]
    public function it_checks_image_urls(): void
    {
        $this->assertTrue(Url::isSafeImage('https://example.com/a.png'));
        $this->assertFalse(Url::isSafeImage('mailto:a@b.c'));
        $this->assertFalse(Url::isSafeImage('data:image/png;base64,iVBORw0KGgo='));

        config(['block-editor.sanitize.data_images' => true]);

        $this->assertTrue(Url::isSafeImage('data:image/png;base64,iVBORw0KGgo='));
        $this->assertFalse(Url::isSafeImage('data:image/svg+xml;base64,PHN2Zz4='));
    }
}
