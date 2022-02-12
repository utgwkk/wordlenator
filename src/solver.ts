import { ALL_WORDS, ALPHABETS } from "./dictionary";
import { ISolver, NoCandidateError, Status } from "./type";

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

export class Solver implements ISolver {
  private candidateWords = new Set(ALL_WORDS.slice());
  private chars = new Map<string, CharStatus>(
    ALPHABETS.map((ch) => [ch, { status: "UNUSED" }])
  );
  private usedPositionsByChar: Map<string, Set<number>>;
  private usedWords = new Set<string>();
  private availableCharsByPosition: Map<number, Set<string>>;
  private excludedChars = new Set<string>();

  constructor() {
    this.usedPositionsByChar = new Map(
      ALPHABETS.map((ch) => [ch, new Set<number>()])
    );
    this.availableCharsByPosition = new Map<number, Set<string>>();
    for (let i = 0; i < 5; i++) {
      this.availableCharsByPosition.set(i, new Set(ALPHABETS));
    }
  }

  public chooseWord(attemptNum: number): string {
    if (process.env.NODE_ENV !== "test") {
      console.debug(`choose from ${this.candidateWords.size} words`);
    }

    if (attemptNum === 0) {
      return "tares";
    }

    if (this.shouldChooseWithEntropy(attemptNum)) {
      return this.chooseInputByEntropy();
    }

    return this.chooseInputByChars();
  }

  private shouldChooseWithEntropy(attemptNum: number) {
    return (
      this.candidateWords.size >= 10 ||
      (Array.from(this.chars.values()).filter((s) => s.status === "HIT")
        .length >= 4 &&
        attemptNum <= 4)
    );
  }

  private calculateEntropy(word: string): number {
    const chars = new Set(word);
    let entropy = chars.size * 20;
    Array.from(word).forEach((ch, i) => {
      const { status } = this.chars.get(ch)!;
      if (status === "HIT") {
        entropy -= 20;
      } else if (status === "BLOW") {
        if (this.usedPositionsByChar.get(ch)!.has(i)) {
          entropy -= 100;
        } else {
          entropy -= 5;
        }
      } else if (status === "NONE") {
        if (this.excludedChars.has(ch)) {
          entropy -= 100;
        }
      } else {
        entropy += 20;
      }
    });
    return entropy;
  }

  private chooseInputByEntropy(): string {
    const allWords = ALL_WORDS;
    const wordEntropyPairs = allWords.map((w) => ({
      word: w,
      entropy: this.calculateEntropy(w),
    }));

    if (allWords.length === 0) {
      throw new NoCandidateError();
    }

    wordEntropyPairs.sort((a, b) => b.entropy - a.entropy);
    const maxEntropy = wordEntropyPairs[0].entropy;
    const words = wordEntropyPairs
      .filter((p) => p.entropy === maxEntropy)
      .map((p) => p.word);
    return words[Math.floor(Math.random() * words.length)];
  }

  private chooseInputByChars(): string {
    const words = Array.from(this.candidateWords);

    if (words.length === 0) {
      throw new NoCandidateError();
    }

    return words[Math.floor(Math.random() * words.length)];
  }

  public getFeedback(input: string, result: Status[]): void {
    this.usedWords.add(input);
    const blowChars = new Set<string>();
    const excludedChars = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const ch = input[i];
      this.usedPositionsByChar.get(ch)!.add(i);
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
          blowChars.add(ch);
          break;
        case "NONE":
          this.chars.set(ch, { status: "NONE" });
          availableCharsByPosition.delete(ch);
          excludedChars.add(ch);
          break;
      }
    }
    excludedChars.forEach((ch) => {
      if (blowChars.has(ch)) {
        return;
      }
      this.availableCharsByPosition.forEach((chars) => {
        if (chars.size === 1) {
          return;
        }
        chars.delete(ch);
      });
      this.excludedChars.add(ch);
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
