import React from "react";
export function renderCard(card) {
  // Show red back if card is missing, empty, or has "?" or "??"
  if (
    !card ||
    card.rank === "" ||
    card.suit === "" ||
    card.rank === "?" ||
    card.suit === "?" ||
    card.rank === "??" ||
    card.suit === "??"
  ) {
    return (
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #b71c1c 60%, #e57373 100%)", // deep red to light red
          color: "#fff",
          border: "2px solid #880808",
          boxShadow: "0 2px 8px rgba(0,64,0,0.18)",
        }}
      ></div>
    );
  }
  return <div className="card">{card.rank}{card.suit}</div>;
}
