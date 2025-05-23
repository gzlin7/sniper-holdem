import React from "react";
export function renderCard(card) {
  // Show blue back if card is missing, empty, or has "?" or "??"
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
          background: "linear-gradient(135deg, #1976d2 60%, #64b5f6 100%)",
          color: "#1976d2",
          border: "1px solid #1976d2",
        }}
      ></div>
    );
  }
  return <div className="card">{card.rank}{card.suit}</div>;
}
