import React, { CSSProperties, useMemo, useReducer } from "react";

import styles from "./App.module.css";

export function App() {
  const restCharacterNum = 25;
  return (
    <div>
      <div className={styles.board}>
        {Array.from("arise").map((ch, i) => (
          <Character key={i} character={ch} />
        ))}
        {Array(restCharacterNum)
          .fill(0)
          .map((_, i) => (
            <PendingCharacter />
          ))}
      </div>
      <button>Not in word list</button>
    </div>
  );
}

function PendingCharacter() {
  return <button className={styles.tile} disabled></button>;
}

type Status = "DEFAULT" | "NONE" | "HIT" | "BLOW";

type CharacterProps = {
  character: string;
};

function Character({ character }: CharacterProps) {
  const [status, reduce] = useReducer<(c: Status) => Status, null>(
    (current) => {
      switch (current) {
        case "DEFAULT":
          return "HIT";
        case "HIT":
          return "BLOW";
        case "BLOW":
          return "NONE";
        case "NONE":
          return "HIT";
      }
    },
    null,
    () => "DEFAULT"
  );

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
    <button className={styles.tile} onClick={reduce} style={style}>
      {character}
    </button>
  );
}
