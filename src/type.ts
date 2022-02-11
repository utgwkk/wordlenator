export type Status = "NONE" | "NONE" | "HIT" | "BLOW";

export interface ISolver {
  chooseWord(attemptNum: number): string;
  getFeedback(input: string, result: Status[]): void;
}
