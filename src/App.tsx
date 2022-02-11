import React, {
  CSSProperties,
  Reducer,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from "react";

import styles from "./App.module.css";
import { NoCandidateError, Solver } from "./solver";
import { Status } from "./type";

type Result = { input: string; status: Status[] };

const solver = new Solver();

const isAnswer = (status: Status[]) => status.every((s) => s === "HIT");

export function App() {
  const [finished, setFinised] = useState(false);
  const [results, putResults] = useReducer<Reducer<Result[], Result>>(
    (results, newResult) => [...results, newResult],
    []
  );
  const [input, setInput] = useState(() => solver.chooseWord(0));
  const [attemptNum, setAttemptNum] = useState(0);
  const [inputStatus, changeInputStatus] = useReducer<
    Reducer<Status[], number>
  >(
    (inputStatus, index) => {
      if (index === -1) {
        // reset
        return ["NONE", "NONE", "NONE", "NONE", "NONE"];
      }
      const current = inputStatus[index];
      let next: Status;
      switch (current) {
        case "NONE":
          next = "HIT";
          break;
        case "HIT":
          next = "BLOW";
          break;
        case "BLOW":
          next = "NONE";
          break;
      }
      return [
        ...inputStatus.slice(0, index),
        next,
        ...inputStatus.slice(index + 1),
      ];
    },
    ["NONE", "NONE", "NONE", "NONE", "NONE"]
  );

  const restCharacterNum = useMemo(
    () => 25 - results.length * 5,
    [results.length]
  );

  const handleFeedback = useCallback(() => {
    if (isAnswer(inputStatus)) {
      window.alert("Wordlenator's win!");
      putResults({ input, status: inputStatus });
      changeInputStatus(-1);
      setAttemptNum((curr) => curr + 1);
      setInput("");
      setFinised(true);
      return;
    }
    if (attemptNum === 5) {
      window.alert("Wordlenator's lose...");
      putResults({ input, status: inputStatus });
      changeInputStatus(-1);
      setAttemptNum((curr) => curr + 1);
      setInput("");
      setFinised(true);
      return;
    }
    solver.getFeedback(input, inputStatus);
    let nextWord: string;
    try {
      nextWord = solver.chooseWord(attemptNum + 1);
    } catch (ex) {
      setFinised(true);
      if (ex instanceof NoCandidateError) {
        window.alert(
          "Looks like Wordlenator's dictionary doesn't contain your word."
        );
      } else {
        window.alert("Oops! Wordlenator got crashed...");
        console.error(ex);
      }
      return;
    }

    putResults({ input, status: inputStatus });
    changeInputStatus(-1);
    setInput(nextWord);
    setAttemptNum((curr) => curr + 1);
  }, [attemptNum, input, inputStatus]);

  const handleShare = useCallback(() => {
    if (!finished) {
      return;
    }

    const displayAttemptNum =
      results[results.length - 1] &&
      isAnswer(results[results.length - 1].status)
        ? attemptNum
        : "X";

    const resultsToStr = (results: Result[]) =>
      results
        .map((r) =>
          r.status
            .map((s) => {
              switch (s) {
                case "HIT":
                  return "🟩";
                case "BLOW":
                  return "🟨";
                default:
                  return "⬜";
              }
            })
            .join("")
        )
        .join("\n");
    const text = `Wordlenator ${displayAttemptNum}/6\n\n${resultsToStr(
      results
    )}`;
    navigator.clipboard.writeText(text).then(() => {
      window.alert("Copied to clipboard");
    });
  }, [attemptNum, finished, results]);

  return (
    <div>
      <div className={styles.container}>
        <div className={styles.board}>
          {results.map((result) =>
            Array.from(result.input).map((ch, i) => (
              <Character
                key={i}
                character={ch}
                status={result.status[i]}
                onClick={() => {}}
              />
            ))
          )}
          {input
            ? Array.from(input).map((ch, i) => (
                <Character
                  key={i}
                  character={ch}
                  status={inputStatus[i]}
                  onClick={() => !finished && changeInputStatus(i)}
                />
              ))
            : attemptNum <= 5 &&
              Array(5)
                .fill(0)
                .map((_, i) => <PendingCharacter key={i} />)}
          {Array(Math.max(restCharacterNum, 0))
            .fill(0)
            .map((_, i) => (
              <PendingCharacter key={i} />
            ))}
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <button
          className={styles.submitButton}
          onClick={handleFeedback}
          disabled={finished}
        >
          Submit
        </button>
      </div>
      {finished && navigator.clipboard && (
        <div className={styles.buttonContainer}>
          <button className={styles.shareButton} onClick={handleShare}>
            Share
          </button>
        </div>
      )}
    </div>
  );
}

function PendingCharacter() {
  return <button className={styles.tile} disabled></button>;
}

type CharacterProps = {
  character: string;
  status: Status;
  onClick: () => void;
};

function Character({ character, status, onClick }: CharacterProps) {
  const style = useMemo<CSSProperties>(() => {
    switch (status) {
      case "NONE":
        return {
          color: "white",
          backgroundColor: "#787c7e",
          border: "0",
        };
      case "HIT":
        return {
          color: "white",
          backgroundColor: "#6aaa64",
          border: "0",
        };
      case "BLOW":
        return {
          color: "white",
          backgroundColor: "#c9b458",
          border: "0",
        };
      default:
        return {
          color: "black",
          backgroundColor: "white",
        };
    }
  }, [status]);

  return (
    <button className={styles.tile} style={style} onClick={onClick}>
      {character}
    </button>
  );
}
