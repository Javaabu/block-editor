<?php

namespace Javaabu\BlockEditor\Exceptions;

use InvalidArgumentException;

class UnknownBlockException extends InvalidArgumentException
{
    public static function block(string $name): static
    {
        return new static("The block [{$name}] isn't registered with javaabu/block-editor.");
    }

    public static function mark(string $name): static
    {
        return new static("The mark [{$name}] isn't registered with javaabu/block-editor.");
    }

    public static function profile(string $name): static
    {
        return new static("The block editor profile [{$name}] isn't defined.");
    }
}
