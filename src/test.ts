type OptionType = string | number;

type MyOptionsType = { someConfig: string; fooBar?: OptionType };

class MySomeClassForTesting {
  private someMyConfigStringOrNumber: OptionType | undefined;

  private someOptions: Record<string, OptionType> = {};

  constructor(private options: MyOptionsType) {
    this.someMyConfigStringOrNumber = options.fooBar ?? "my-option";
  }

  public getSomeConfig() {
    return this.someMyConfigStringOrNumber;
  }

  public setSomeOptions(key: string, value: OptionType) {
    this.someOptions[key] = this.#sanitizeOptionValue(value);
  }

  #sanitizeOptionValue(option: OptionType): string {
    return `${option}-all-good`;
  }
}
