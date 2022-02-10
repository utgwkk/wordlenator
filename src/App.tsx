import React, { CSSProperties, useMemo, useReducer } from "react";

import styles from "./App.module.css";

export function App() {
  return (
    <div className={styles.board}>
      {Array.from("arisecough....................").map((ch, i) => (
        <Character key={i} character={ch} />
      ))}
    </div>
  );
}

type Status = "DEFAULT" | "NONE" | "HIT" | "BLOW";

type CharacterProps = {
  character: string;
};

function Character({ character }: CharacterProps) {
  const [status, reduce] = useReducer((current: Status) => {
    switch (current) {
      case "DEFAULT":
        return "HIT";
      case "HIT":
        return "BLOW";
      case "BLOW":
        return "NONE";
      case "NONE":
        return "DEFAULT";
    }
  }, "DEFAULT");

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
