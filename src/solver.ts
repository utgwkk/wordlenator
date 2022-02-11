export class Solver {
  public chooseWord(attemptNum: number): string {
    if (attemptNum === 0) {
      return "arise";
    } else if (attemptNum === 1) {
      return "cough";
    } else {
      throw new Error("not implemented");
    }
  }
}
