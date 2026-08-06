export type PasswordOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous?: boolean;
  excludedCharacters?: string;
};

export type PasswordPreset = "account" | "wifi" | "api" | "easy";

export type PassphraseOptions = {
  wordCount: number;
  separator: "-" | "." | "_" | " ";
  includeNumber: boolean;
};

const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;

const AMBIGUOUS_CHARACTERS = new Set("0O1lI|`'\".,:;()[]{}<>");

const PASSPHRASE_WORDS = [
  "amber", "anchor", "apple", "april", "arch", "arrow", "atlas", "autumn",
  "badge", "bamboo", "beach", "berry", "birch", "bird", "bloom", "blue",
  "boat", "breeze", "brick", "brook", "brush", "cabin", "cactus", "canyon",
  "cedar", "charm", "cherry", "circle", "clay", "clear", "cliff", "cloud",
  "coast", "comet", "coral", "cosmos", "crane", "creek", "crystal", "dawn",
  "delta", "dove", "dream", "drift", "dune", "eagle", "earth", "echo",
  "elm", "ember", "falcon", "fern", "field", "finch", "flame", "flora",
  "forest", "frost", "garden", "gem", "glade", "glass", "globe", "gold",
  "grain", "grape", "green", "grove", "harbor", "hawk", "hazel", "hill",
  "honey", "iris", "island", "ivory", "jade", "jasmine", "juniper", "kite",
  "lake", "lark", "leaf", "lemon", "light", "lilac", "lily", "lotus",
  "lunar", "maple", "marble", "meadow", "mint", "moon", "moss", "mountain",
  "navy", "north", "nova", "oak", "oasis", "ocean", "olive", "opal",
  "orange", "orchid", "otter", "owl", "palm", "peach", "pearl", "pine",
  "planet", "plum", "pond", "prairie", "quartz", "rain", "raven", "reef",
  "ridge", "river", "robin", "rose", "ruby", "sage", "sand", "sea",
  "shadow", "shell", "shore", "silver", "sky", "snow", "solar", "sparrow",
  "spring", "spruce", "star", "stone", "storm", "sun", "sunset", "swift",
  "tide", "tiger", "topaz", "trail", "tree", "tulip", "valley", "violet",
  "wave", "west", "willow", "wind", "winter", "wood", "wren", "zenith",
] as const;

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

  const excluded = new Set((options.excludedCharacters || "").slice(0, 64));
  const enabledSets = (
    Object.keys(CHARACTER_SETS) as Array<keyof typeof CHARACTER_SETS>
  )
    .filter((key) => options[key])
    .map((key) =>
      [...CHARACTER_SETS[key]]
        .filter(
          (character) =>
            !excluded.has(character) &&
            (!options.excludeAmbiguous || !AMBIGUOUS_CHARACTERS.has(character)),
        )
        .join(""),
    );
  if (enabledSets.length === 0) {
    throw new Error("At least one character set must be enabled");
  }
  if (enabledSets.some((set) => set.length === 0)) {
    throw new Error("An enabled character set has no characters available");
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

export function getPasswordPreset(preset: PasswordPreset): PasswordOptions {
  const presets: Record<PasswordPreset, PasswordOptions> = {
    account: { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true },
    wifi: { length: 24, uppercase: true, lowercase: true, numbers: true, symbols: false },
    api: { length: 40, uppercase: true, lowercase: true, numbers: true, symbols: true },
    easy: {
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeAmbiguous: true,
    },
  };
  return { ...presets[preset] };
}

export function generateSecurePassphrase(
  options: PassphraseOptions,
  cryptoSource: RandomValues = globalThis.crypto,
): string {
  if (!Number.isInteger(options.wordCount) || options.wordCount < 4 || options.wordCount > 8) {
    throw new RangeError("Passphrase word count must be between 4 and 8");
  }
  const words: string[] = Array.from({ length: options.wordCount }, () =>
    PASSPHRASE_WORDS[randomIndex(PASSPHRASE_WORDS.length, cryptoSource)],
  );
  if (options.includeNumber) {
    words.push(String(randomIndex(10_000, cryptoSource)).padStart(4, "0"));
  }
  return words.join(options.separator);
}
