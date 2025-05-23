import React from "react";
import { renderCard } from "./renderCard";
export function Players({
  yourCards, oppCards, yourChips, oppChips,
  yourRank, oppRank, youBlind, oppBlind, yourRole = "Player 1", oppRole = "Player 2", myTurn,
  yourBet = 0, oppBet = 0
}) {
  return (
    <div id="players">
      <div
        className="player"
        id="player-1"
        style={{
          visibility: "visible",
          border: myTurn ? "3px solid #ffe082" : undefined,
          borderRadius: "8px"
        }}
      >
        <div>
          <strong>
            {yourRole} <br /> <span id="you-blind">{youBlind}</span>
          </strong>
        </div>
        <div className="hole-cards" id="your-cards">
          {yourCards.map((c, i) => <span key={i}>{renderCard(c)}</span>)}
        </div>
        <div>
          Chips: $<span id="your-chips">{yourChips}</span>
        </div>
        <div>
          Bet: $<span id="your-bet">{yourBet}</span>
        </div>
        <div id="your-rank" style={{ marginTop: 5, fontSize: "0.95em" }}>{yourRank}</div>
      </div>
      <div
        className="player"
        id="player-2"
        style={{
          visibility: "visible",
          border: !myTurn ? "3px solid #ffe082" : undefined,
          borderRadius: "8px"
        }}
      >
        <div>
          <strong>
            {oppRole} <br /> <span id="opp-blind">{oppBlind}</span>
          </strong>
        </div>
        <div className="hole-cards" id="opp-cards">
          {oppCards.map((c, i) => <span key={i}>{renderCard(c)}</span>)}
        </div>
        <div>
          Chips: $<span id="opp-chips">{oppChips}</span>
        </div>
        <div>
          Bet: $<span id="opp-bet">{oppBet}</span>
        </div>
        <div id="opp-rank" style={{ marginTop: 5, fontSize: "0.95em" }}>{oppRank}</div>
      </div>
    </div>
  );
}
