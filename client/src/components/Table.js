import React from "react";
import { renderCard } from "./renderCard";
export function Table({ community, pot }) {
  return (
    <div id="table">
      <div id="community-cards" style={{ visibility: "visible" }}>
        {[0, 1, 2, 3].map(i => renderCard(community[i]))}
      </div>
      <div id="pot" style={{ visibility: "visible" }}>
        Pot: $<span id="pot-amount">{pot}</span>
      </div>
    </div>
  );
}
