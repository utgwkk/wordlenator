import { ALL_WORDS } from "./dictionary";
import { Status } from "./type";

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

const ALPHABETS = "abcdefghijklmnopqrstuvwxyz";

export class Solver {
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
    const pred = this.buildPredicate();
    const words = Array.from(this.candidateWords).filter((word) => pred(word));

    if (words.length === 0) {
      throw new Error("no candidate words");
    }

    return words[Math.floor(Math.random() * words.length)];
  }

  public getFeedback(input: string, result: Status[]): void {
    this.usedWords.add(input);
    for (let i = 0; i < 5; i++) {
      const ch = input[i];
      const res = result[i];
      const availableCharsByPosition = this.availableCharsByPosition.get(i)!;
      switch (res) {
        case "HIT":
          this.chars.set(ch, { status: "HIT", index: i });
          availableCharsByPosition.clear();
          availableCharsByPosition.add(ch);
          break;
        case "BLOW":
          this.chars.set(ch, { status: "BLOW" });
          availableCharsByPosition.delete(ch);
          break;
        case "NONE":
          this.chars.set(ch, { status: "NONE" });
          availableCharsByPosition.delete(ch);
          break;
      }
    }
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
    const noneChars = Array.from(this.chars.entries())
      .filter(([_, s]) => s.status === "NONE")
      .map(([ch]) => ch);
    const noneCharsRe = new RegExp(`[${noneChars.join()}]`);
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

      if (noneChars.length > 0 && noneCharsRe.test(word)) {
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
