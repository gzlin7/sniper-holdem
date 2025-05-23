import React from "react";
export function renderCard(card) {
  if (!card) return <div className="card"></div>;
  return <div className="card">{card.rank}{card.suit}</div>;
}
