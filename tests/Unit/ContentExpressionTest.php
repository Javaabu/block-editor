<?php

namespace Javaabu\BlockEditor\Tests\Unit;

use InvalidArgumentException;
use Javaabu\BlockEditor\Support\ContentExpression;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class ContentExpressionTest extends TestCase
{
    #[Test]
    public function it_matches_repeated_groups(): void
    {
        $expression = ContentExpression::parse('inline*');

        $this->assertTrue($expression->matches([]));
        $this->assertTrue($expression->matches([['text', ['inline']], ['hardBreak', ['inline']]]));
        $this->assertFalse($expression->matches([['paragraph', ['block']]]));
    }

    #[Test]
    public function it_matches_sequences(): void
    {
        $expression = ContentExpression::parse('paragraph block*');

        $this->assertTrue($expression->matches([['paragraph', ['block']]]));
        $this->assertTrue($expression->matches([['paragraph', ['block']], ['bulletList', ['block']]]));
        $this->assertFalse($expression->matches([['bulletList', ['block']]]));
        $this->assertFalse($expression->matches([]));
    }

    #[Test]
    public function it_matches_choices_and_ranges(): void
    {
        $cells = ContentExpression::parse('(tableCell | tableHeader)+');

        $this->assertTrue($cells->matches([['tableHeader', []], ['tableCell', []]]));
        $this->assertFalse($cells->matches([]));
        $this->assertTrue($cells->allows('tableCell'));
        $this->assertFalse($cells->allows('paragraph', ['block']));

        $columns = ContentExpression::parse('column{2,3}');

        $this->assertFalse($columns->matches([['column', []]]));
        $this->assertTrue($columns->matches([['column', []], ['column', []]]));
        $this->assertFalse($columns->matches(array_fill(0, 4, ['column', []])));

        $this->assertTrue(ContentExpression::parse('heading | paragraph')->matches([['paragraph', ['block']]]));
        $this->assertTrue(ContentExpression::parse('column{2,}')->matches(array_fill(0, 5, ['column', []])));
        $this->assertTrue(ContentExpression::parse('image?')->matches([]));
    }

    #[Test]
    public function it_treats_an_empty_expression_as_a_leaf(): void
    {
        $expression = ContentExpression::parse('');

        $this->assertTrue($expression->isEmpty());
        $this->assertTrue($expression->matches([]));
        $this->assertFalse($expression->matches([['text', ['inline']]]));
    }

    #[Test]
    public function it_rejects_invalid_expressions(): void
    {
        $this->expectException(InvalidArgumentException::class);

        ContentExpression::parse('* paragraph');
    }
}
