<?php

namespace Javaabu\BlockEditor\Blocks;

use BackedEnum;
use Closure;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Validation\Rule;
use Javaabu\BlockEditor\Support\Url;
use UnitEnum;

/**
 * One attribute of a block (or a mark): its type, default, validation rules, and
 * the input the editor shows for it in the block's settings panel.
 */
class Attribute
{
    public const string STRING = 'string';

    public const string TEXT = 'text';

    public const string URL = 'url';

    public const string INTEGER = 'integer';

    public const string NUMBER = 'number';

    public const string BOOLEAN = 'boolean';

    public const string ENUM = 'enum';

    public const string JSON = 'json';

    protected mixed $default = null;

    protected bool $is_required = false;

    protected bool $is_editable = true;

    protected bool $has_thaana = false;

    protected string|Closure|null $label = null;

    protected string|Closure|null $help = null;

    protected ?string $input = null;

    protected int|float|null $min = null;

    protected int|float|null $max = null;

    /** @var array<int|string, mixed> */
    protected array $options = [];

    /** @var array<int, mixed> */
    protected array $rules = [];

    final public function __construct(protected string $type) {}

    public static function make(string $type): static
    {
        return new static($type);
    }

    /** A single line of text. */
    public static function string(): static
    {
        return static::make(self::STRING);
    }

    /** Several lines of text (a textarea in the settings panel). */
    public static function text(): static
    {
        return static::make(self::TEXT);
    }

    /** A link: only http(s), mailto, tel and relative URLs are kept. */
    public static function url(): static
    {
        return static::make(self::URL);
    }

    public static function integer(): static
    {
        return static::make(self::INTEGER);
    }

    public static function number(): static
    {
        return static::make(self::NUMBER);
    }

    public static function boolean(): static
    {
        return static::make(self::BOOLEAN)->default(false);
    }

    /**
     * One of a list of values: a list (`['info', 'warning']`), labels keyed by value,
     * or a backed enum class.
     *
     * @param  array<int|string, mixed>|class-string<UnitEnum>  $options
     */
    public static function enum(array|string $options): static
    {
        return static::make(self::ENUM)->options($options);
    }

    /** Any JSON value, kept as is and never shown in the settings panel. */
    public static function json(): static
    {
        return static::make(self::JSON)->hidden();
    }

    public function default(mixed $default): static
    {
        $this->default = $default;

        return $this;
    }

    public function required(bool $condition = true): static
    {
        $this->is_required = $condition;

        return $this;
    }

    /** Leave the attribute out of the settings panel (it's set by the block itself). */
    public function hidden(bool $condition = true): static
    {
        $this->is_editable = ! $condition;

        return $this;
    }

    /** Type Thaana from a Latin keyboard in the settings panel input. */
    public function thaana(bool $condition = true): static
    {
        $this->has_thaana = $condition;

        return $this;
    }

    public function label(string|Closure|null $label): static
    {
        $this->label = $label;

        return $this;
    }

    public function help(string|Closure|null $help): static
    {
        $this->help = $help;

        return $this;
    }

    /**
     * The settings panel input: text, textarea, url, number, checkbox, select or code.
     * Defaults to one that fits the type.
     */
    public function input(string $input): static
    {
        $this->input = $input;

        return $this;
    }

    /** The smallest number, or the shortest string. */
    public function min(int|float $min): static
    {
        $this->min = $min;

        return $this;
    }

    /** The largest number, or the longest string. */
    public function max(int|float $max): static
    {
        $this->max = $max;

        return $this;
    }

    /**
     * @param  array<int|string, mixed>|class-string<UnitEnum>  $options
     */
    public function options(array|string $options): static
    {
        $this->options = is_string($options) ? $this->enumOptions($options) : $options;

        return $this;
    }

    /**
     * Extra validation rules, after the ones that come with the type.
     *
     * @param  array<int, mixed>|string  $rules
     */
    public function rules(array|string $rules): static
    {
        $this->rules = [...$this->rules, ...(is_string($rules) ? explode('|', $rules) : $rules)];

        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getDefault(): mixed
    {
        return $this->default instanceof Closure
            ? ($this->default)()
            : $this->default;
    }

    public function isRequired(): bool
    {
        return $this->is_required;
    }

    public function isEditable(): bool
    {
        return $this->is_editable;
    }

    public function getLabel(string $name): string
    {
        $label = $this->label instanceof Closure
            ? ($this->label)()
            : $this->label;

        if ($label) {
            return $label;
        }

        $key = "block-editor::strings.attributes.{$name}";
        $translated = __($key);

        return $translated === $key
            ? str($name)->snake(' ')->ucfirst()->toString()
            : $translated;
    }

    public function getHelp(): ?string
    {
        return $this->help instanceof Closure
            ? ($this->help)()
            : $this->help;
    }

    public function getInput(): string
    {
        if ($this->input) {
            return $this->input;
        }

        return match ($this->type) {
            self::TEXT => 'textarea',
            self::URL => 'url',
            self::INTEGER, self::NUMBER => 'number',
            self::BOOLEAN => 'checkbox',
            self::ENUM => 'select',
            default => 'text',
        };
    }

    /**
     * The allowed values, as `value => label`.
     *
     * @return array<string, string>
     */
    public function getOptions(): array
    {
        $options = [];

        foreach ($this->options as $value => $label) {
            if (is_int($value)) {
                $value = $label;
            }

            $options[(string) $value] = $this->optionLabel((string) $value, $label);
        }

        return $options;
    }

    /**
     * The validation rules for the attribute's value.
     *
     * @return array<int, mixed>
     */
    public function getRules(): array
    {
        $rules = [$this->is_required ? 'required' : 'nullable'];

        $rules = [...$rules, ...match ($this->type) {
            self::STRING, self::TEXT => ['string'],
            self::URL => ['string', $this->urlRule()],
            self::INTEGER => ['integer'],
            self::NUMBER => ['numeric'],
            self::BOOLEAN => ['boolean'],
            self::ENUM => [Rule::in(array_map('strval', array_keys($this->getOptions())))],
            default => [],
        }];

        if (! is_null($this->min)) {
            $rules[] = "min:{$this->min}";
        }

        if (! is_null($this->max)) {
            $rules[] = "max:{$this->max}";
        }

        return [...$rules, ...$this->rules];
    }

    /**
     * Coerces a stored value to the attribute's type. Values that can't be coerced
     * (an unsafe URL, a value outside the options) become the default.
     */
    public function cast(mixed $value): mixed
    {
        if (is_null($value)) {
            return $this->getDefault();
        }

        return match ($this->type) {
            self::STRING, self::TEXT => is_scalar($value) ? Url::stripControlCharacters((string) $value) : $this->getDefault(),
            self::URL => is_string($value) && Url::isSafe($value) ? trim($value) : $this->getDefault(),
            self::INTEGER => is_numeric($value) ? (int) $value : $this->getDefault(),
            self::NUMBER => is_numeric($value) ? $value + 0 : $this->getDefault(),
            self::BOOLEAN => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $this->getDefault(),
            self::ENUM => is_scalar($value) && array_key_exists((string) $value, $this->getOptions()) ? $value : $this->getDefault(),
            default => $value,
        };
    }

    /**
     * What the editor needs: the type, default and settings panel input.
     *
     * @return array<string, mixed>
     */
    public function toEditor(string $name): array
    {
        return array_filter([
            'type' => $this->type,
            'default' => $this->getDefault(),
            'editable' => $this->is_editable,
            'input' => $this->getInput(),
            'label' => $this->getLabel($name),
            'help' => $this->getHelp(),
            'required' => $this->is_required,
            'thaana' => $this->has_thaana,
            'min' => $this->min,
            'max' => $this->max,
            'options' => $this->type === self::ENUM ? $this->editorOptions() : null,
        ], fn ($value, $key) => ! is_null($value) || $key === 'default', ARRAY_FILTER_USE_BOTH);
    }

    /** @return array<int, array{value: string, label: string}> */
    protected function editorOptions(): array
    {
        $options = [];

        foreach ($this->getOptions() as $value => $label) {
            $options[] = ['value' => (string) $value, 'label' => $label];
        }

        return $options;
    }

    protected function optionLabel(string $value, mixed $label): string
    {
        if ($label instanceof Arrayable) {
            $label = $label->toArray();
        }

        if (is_string($label) && $label !== $value) {
            return $label;
        }

        $key = "block-editor::strings.options.{$value}";
        $translated = __($key);

        return $translated === $key
            ? str($value)->snake(' ')->ucfirst()->toString()
            : $translated;
    }

    /**
     * @param  class-string<UnitEnum>  $enum
     * @return array<string, string>
     */
    protected function enumOptions(string $enum): array
    {
        $options = [];

        foreach ($enum::cases() as $case) {
            $value = $case instanceof BackedEnum ? (string) $case->value : $case->name;

            $options[$value] = method_exists($case, 'getLabel')
                ? $case->getLabel()
                : $value;
        }

        return $options;
    }

    protected function urlRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! is_string($value)) {
                return;
            }

            if (Url::isSafe($value)) {
                return;
            }

            $fail(__('block-editor::strings.validation.url'));
        };
    }
}
