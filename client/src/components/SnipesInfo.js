import React from "react";
export function SnipesInfo({ snipes }) {
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
      Sniped Hands<br /><br />
      {snipes.you ? `You: ${snipes.you}` : "You: (none)"}<br />
      {snipes.opp ? `Opp: ${snipes.opp}` : "Opponent: (none)"}
    </div>
  );
}
