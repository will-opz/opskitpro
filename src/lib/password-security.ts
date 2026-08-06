export type StrengthFinding =
  | "short"
  | "long"
  | "diverse"
  | "limited"
  | "repeat"
  | "sequence"
  | "keyboard"
  | "common";

export type PasswordStrength = {
  score: 1 | 2 | 3 | 4 | 5;
  label: "weak" | "fair" | "good" | "strong" | "very_strong";
  findings: StrengthFinding[];
};

const COMMON_PASSWORDS = new Set([
  "123456",
  "12345678",
  "123456789",
  "password",
  "password1",
  "qwerty",
  "qwerty123",
  "admin",
  "letmein",
  "welcome",
  "abc123",
  "iloveyou",
  "111111",
]);

const SEQUENCES = [
  "0123456789",
  "9876543210",
  "abcdefghijklmnopqrstuvwxyz",
  "zyxwvutsrqponmlkjihgfedcba",
];

const KEYBOARD_RUNS = ["qwerty", "asdfgh", "zxcvbn", "qazwsx", "1qaz2wsx"];

export function analyzePasswordStrength(password: string): PasswordStrength {
  const normalized = password.toLowerCase();
  const findings: StrengthFinding[] = [];
  let score = 1;

  if (password.length >= 16) {
    score += 2;
    findings.push("long");
  } else if (password.length >= 12) {
    score += 1;
  } else {
    findings.push("short");
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((rule) =>
    rule.test(password),
  ).length;
  if (classes >= 3) {
    score += 1;
    findings.push("diverse");
  } else {
    findings.push("limited");
  }
  if (password.length >= 20 && classes >= 3) score += 1;

  if (/(.)\1{2,}/i.test(password)) {
    score -= 1;
    findings.push("repeat");
  }
  if (SEQUENCES.some((sequence) => sequence.includes(normalized.slice(0, 4))) || /(?:0123|1234|2345|3456|4567|5678|6789)/.test(normalized)) {
    score -= 1;
    findings.push("sequence");
  }
  if (KEYBOARD_RUNS.some((run) => normalized.includes(run))) {
    score -= 1;
    findings.push("keyboard");
  }
  if (COMMON_PASSWORDS.has(normalized)) {
    score = 1;
    findings.push("common");
  }

  const bounded = Math.max(1, Math.min(5, score)) as PasswordStrength["score"];
  const labels: PasswordStrength["label"][] = [
    "weak",
    "fair",
    "good",
    "strong",
    "very_strong",
  ];
  return { score: bounded, label: labels[bounded - 1], findings };
}
