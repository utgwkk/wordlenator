import { ALL_WORDS } from "./dictionary";
import { Solver } from "./solver";
import { Status } from "./type";

class Questioner {
  private answer: string;

  constructor(answer: string) {
    this.answer = answer;
  }

  public feedback(input: string): Status[] {
    const result: Status[] = [];

    const consumeMap = new Map<string, number>();
    Array.from(this.answer).forEach((ch) => {
      const cnt = consumeMap.get(ch);
      if (typeof cnt === "number") {
        consumeMap.set(ch, cnt + 1);
      } else {
        consumeMap.set(ch, 1);
      }
    });

    Array.from(input).forEach((ch, i) => {
      if (ch === this.answer[i]) {
        result.push("HIT");
      } else if (this.answer.includes(ch) && consumeMap.get(ch)! > 0) {
        result.push("BLOW");
        consumeMap.set(ch, consumeMap.get(ch)! - 1);
      } else {
        result.push("NONE");
      }
    });

    return result;
  }
}

describe("Solver", () => {
  test.each(ALL_WORDS.map((x) => [x]))("solve(%s)", (answer) => {
    const questioner = new Questioner(answer);
    const solver = new Solver();
    for (let attemptNum = 0; attemptNum < 50; attemptNum++) {
      const input = solver.chooseWord(attemptNum);
      if (input === answer) {
        return;
      }
      const feedback = questioner.feedback(input);
      solver.getFeedback(input, feedback);
    }
    throw new Error(`Couldn't solve ${answer}`);
  });
});
