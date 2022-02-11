import { ALL_WORDS } from "./dictionary";
import { ISolver, Status } from "./type";

type CharStatus =
  | {
      status: "UNUSED";
    }
  | {
      status: "NONE";
    }
  | {
      status: "BLOW";
    }
  | {
      status: "HIT";
      index: number;
    };

type Predicate = (word: string) => boolean;

export class NoCandidateError extends Error {}

const ALPHABETS = "abcdefghijklmnopqrstuvwxyz";

export class Solver implements ISolver {
  private candidateWords = new Set(ALL_WORDS.slice());
  private chars = new Map<string, CharStatus>(
    Array.from(ALPHABETS).map((ch) => [ch, { status: "UNUSED" }])
  );
  private usedWords = new Set<string>();
  private availableCharsByPosition: Map<number, Set<string>>;

  constructor() {
    this.availableCharsByPosition = new Map<number, Set<string>>();
    for (let i = 0; i < 5; i++) {
      this.availableCharsByPosition.set(i, new Set(ALPHABETS));
    }
  }

  public chooseWord(attemptNum: number): string {
    if (attemptNum === 0) {
      return "arise";
    } else if (attemptNum === 1) {
      return "cough";
    } else {
      return this.chooseInputByChars();
    }
  }

  private chooseInputByChars(): string {
    const words = Array.from(this.candidateWords);
    this.log(`choose from ${words.length} candidates`);

    if (words.length === 0) {
      throw new NoCandidateError();
    }

    return words[Math.floor(Math.random() * words.length)];
  }

  public getFeedback(input: string, result: Status[]): void {
    this.usedWords.add(input);
    const includedChars = new Set<string>();
    const excludedChars = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const ch = input[i];
      const res = result[i];
      const availableCharsByPosition = this.availableCharsByPosition.get(i)!;
      switch (res) {
        case "HIT":
          this.chars.set(ch, { status: "HIT", index: i });
          availableCharsByPosition.clear();
          availableCharsByPosition.add(ch);
          includedChars.add(ch);
          break;
        case "BLOW":
          this.chars.set(ch, { status: "BLOW" });
          availableCharsByPosition.delete(ch);
          includedChars.add(ch);
          break;
        case "NONE":
          this.chars.set(ch, { status: "NONE" });
          availableCharsByPosition.delete(ch);
          excludedChars.add(ch);
          break;
      }
    }
    excludedChars.forEach((ch) => {
      if (includedChars.has(ch)) {
        return;
      }
      this.availableCharsByPosition.forEach((chars) => chars.delete(ch));
    });
    this.filterCandidateWords();
  }

  private filterCandidateWords(): void {
    const pred = this.buildPredicate();
    this.candidateWords.forEach((word) => {
      if (!pred(word)) {
        this.candidateWords.delete(word);
      }
    });
  }

  private buildPredicate(): Predicate {
    const blowChars = Array.from(this.chars.entries())
      .filter(([_, s]) => s.status === "BLOW")
      .map(([ch]) => ch);

    let hitWordReStr = "";
    this.availableCharsByPosition.forEach((chars) => {
      hitWordReStr += `[${Array.from(chars.values()).join()}]`;
    });
    const hitWordRe = new RegExp(hitWordReStr);

    return (word) => {
      if (this.usedWords.has(word)) {
        return false;
      }

      if (!hitWordRe.test(word)) {
        return false;
      }

      for (const ch of blowChars) {
        if (!word.includes(ch)) {
          return false;
        }
      }

      return true;
    };
  }
}
