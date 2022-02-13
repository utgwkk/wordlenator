import { ALL_WORDS } from "./dictionary";
import { ISolver, NoCandidateError, Status } from "./type";

// based on https://github.com/yotam-gafni/wordle_solver/blob/main/comb.py
export class MinmaxSolver implements ISolver {
  private candidateWords = ALL_WORDS.slice();
  private responseVectorCache = new Map<string, Status[]>();
  private srMat = new Map<string, string[]>();

  public chooseWord(attemptNum: number): string {
    if (this.candidateWords.length === 1) {
      return this.candidateWords[0];
    }

    let chosenWord = "aesir";
    let minWc = 100000;

    const candidates = attemptNum === 0 ? ["aesir"] : ALL_WORDS;

    candidates.forEach((w1) => {
      const mat = new Map<string, Status[]>();
      const rmat = new Map<string, string[]>();

      this.candidateWords.forEach((w2) => {
        const msum = this.calcResponseVector(w1, w2);
        const rmatKey = msum.join();
        if (!rmat.has(rmatKey)) {
          rmat.set(rmatKey, [w2]);
        } else {
          rmat.get(rmatKey)!.push(w2);
        }
        const matKey = `${w1},${w2}`;
        mat.set(matKey, msum);
      });

      const M = Math.max(...Array.from(rmat.values()).map((v) => v.length));
      if (M < minWc) {
        minWc = M;
        chosenWord = w1;
        this.srMat = rmat;
      }
    });

    return chosenWord;
  }

  private calcResponseVector(w1: string, w2: string): Status[] {
    const cacheKey = `${w1},${w2}`;

    if (this.responseVectorCache.has(cacheKey)) {
      return this.responseVectorCache.get(cacheKey)!;
    }

    const tw2 = Array.from(w2);
    const msum = Array<Status>(5).fill("NONE");
    for (let cInd = 0; cInd < 5; cInd++) {
      if (w1[cInd] === tw2[cInd]) {
        msum[cInd] = "HIT";
        tw2[cInd] = "*";
      }
    }
    for (let cInd = 0; cInd < 5; cInd++) {
      if (tw2.includes(w1[cInd]) && msum[cInd] === "NONE") {
        msum[cInd] = "BLOW";
        const indApp = tw2.indexOf(w1[cInd]);
        tw2[indApp] = "*";
      }
    }
    return msum;
  }

  public getFeedback(input: string, result: Status[]): void {
    const matKey = result.join();
    const words = this.srMat.get(matKey);

    if (!words) {
      throw new NoCandidateError();
    }

    if (process.env.NODE_ENV !== "test") {
      console.debug(words);
    }
    this.candidateWords = words;
  }
}
