import React from "react";
export function SnipesInfo({ state }) {
  return (
    <div
      id="snipes-info"
      style={{
        position: "absolute",
        top: 18,
        left: 32,
        background: "rgba(0,0,0,0.25)",
        color: "#ffe082",
        padding: "7px 18px",
        borderRadius: 8,
        fontSize: "1.1em",
        fontWeight: "bold",
        zIndex: 10,
      }}
    >
      Sniped Hands
      <br />
      <br />
      Player1: {state.snipes.player1 ? `${state.snipes.player1}` : "(none)"} <br />
      Player2: {state.snipes.player2 ? `${state.snipes.player2}` : "(none)"}
    </div>
  );
}
