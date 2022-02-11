import React, {
  CSSProperties,
  Reducer,
  useCallback,
  useMemo,
  useReducer,
  useState,
} from "react";

import styles from "./App.module.css";
import { Solver } from "./solver";
import { Status } from "./type";

type Result = { input: string; status: Status[] };

const solver = new Solver();

export function App() {
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
        return ["DEFAULT", "DEFAULT", "DEFAULT", "DEFAULT", "DEFAULT"];
      }
      const current = inputStatus[index];
      let next: Status;
      switch (current) {
        case "DEFAULT":
          next = "HIT";
          break;
        case "HIT":
          next = "BLOW";
          break;
        case "BLOW":
          next = "NONE";
          break;
        case "NONE":
          next = "HIT";
          break;
      }
      return [
        ...inputStatus.slice(0, index),
        next,
        ...inputStatus.slice(index + 1),
      ];
    },
    ["DEFAULT", "DEFAULT", "DEFAULT", "DEFAULT", "DEFAULT"]
  );

  const restCharacterNum = useMemo(
    () => 25 - results.length * 5,
    [results.length]
  );

  const handleFeedback = useCallback(() => {
    putResults({ input, status: inputStatus });
    changeInputStatus(-1);
    solver.getFeedback(input, inputStatus);
    setInput(solver.chooseWord(attemptNum + 1));
    setAttemptNum((curr) => curr + 1);
  }, [attemptNum, input, inputStatus]);

  return (
    <div>
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
        {Array.from(input).map((ch, i) => (
          <Character
            key={i}
            character={ch}
            status={inputStatus[i]}
            onClick={() => changeInputStatus(i)}
          />
        ))}
        {Array(restCharacterNum)
          .fill(0)
          .map((_, i) => (
            <PendingCharacter />
          ))}
      </div>
      <button onClick={handleFeedback}>Feedback result</button>
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
