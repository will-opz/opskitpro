export type PasswordOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;

type RandomValues = Pick<Crypto, "getRandomValues">;

function randomIndex(max: number, cryptoSource: RandomValues): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const value = new Uint32Array(1);
  do {
    cryptoSource.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % max;
}

export function generateSecurePassword(
  options: PasswordOptions,
  cryptoSource: RandomValues = globalThis.crypto,
): string {
  if (
    !Number.isInteger(options.length) ||
    options.length < 4 ||
    options.length > 128
  ) {
    throw new RangeError("Password length must be an integer between 4 and 128");
  }

  const enabledSets = (
    Object.keys(CHARACTER_SETS) as Array<keyof typeof CHARACTER_SETS>
  )
    .filter((key) => options[key])
    .map((key) => CHARACTER_SETS[key]);
  if (enabledSets.length === 0) {
    throw new Error("At least one character set must be enabled");
  }
  if (options.length < enabledSets.length) {
    throw new RangeError("Password length is shorter than the enabled character sets");
  }

  const allCharacters = enabledSets.join("");
  const result = enabledSets.map(
    (set) => set[randomIndex(set.length, cryptoSource)],
  );
  while (result.length < options.length) {
    result.push(allCharacters[randomIndex(allCharacters.length, cryptoSource)]);
  }

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, cryptoSource);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result.join("");
}
