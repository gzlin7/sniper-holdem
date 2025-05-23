import React from "react";
import { renderCard } from "./renderCard";
import {getHandRank} from "../handHelper.js";

function getHandRankText(cards, state) {
      if (cards && state.community) {
        const allYourCards = [
          ...cards,
          ...state.community.filter(Boolean),
        ];
        if (
          allYourCards.length > 2 &&
          allYourCards.every(c => c && c.rank && c.suit && c.rank !== "?" && c.suit !== "?")
        ) {
          return getHandRank(allYourCards).name;
        }
}
}

export function Players({
  yourCards, oppCards, yourChips, oppChips,
  yourRole = "Player 1", oppRole = "Player 2", myTurn,
  yourBet = 0, oppBet = 0, dealerIsP1, state
}) {
  return (
    <div id="players">
      <div
        className="player"
        id="player-1"
        style={{
          visibility: "visible",
          border: myTurn ? "3px solid #ffe082" : undefined,
          borderRadius: "8px",
        }}
      >
        <div>
          <strong>
            {yourRole}{" "}
            <span id="you-blind">
              {(yourRole === "Player 1") === dealerIsP1 ? "(SB)" : "(BB)"}
            </span>
          </strong>
        </div>
        <div className="hole-cards" id="your-cards">
          {yourCards.map((c, i) => (
            <span key={i}>{renderCard(c)}</span>
          ))}
        </div>
        <div>
          Chips: $<span id="your-chips">{yourChips}</span>
        </div>
        <div>
          Bet: $<span id="your-bet">{yourBet}</span>
        </div>
        <div id="your-rank" style={{ marginTop: 5, fontSize: "0.95em" }}>
          {getHandRankText(yourCards, state)}
        </div>
      </div>
      <div
        className="player"
        id="player-2"
        style={{
          visibility: "visible",
          border: !myTurn ? "3px solid #ffe082" : undefined,
          borderRadius: "8px",
        }}
      >
        <div>
          <strong>
            {oppRole}{" "}
            <span id="opp-blind">
              {(yourRole === "Player 1") === dealerIsP1 ? "(BB)" : "(SB)"}
            </span>
          </strong>
        </div>
        <div className="hole-cards" id="opp-cards">
          {oppCards.map((c, i) => (
            <span key={i}>{renderCard(c)}</span>
          ))}
        </div>
        <div>
          Chips: $<span id="opp-chips">{oppChips}</span>
        </div>
        <div>
          Bet: $<span id="opp-bet">{oppBet}</span>
        </div>
        <div id="opp-rank" style={{ marginTop: 5, fontSize: "0.95em" }}>
          {getHandRankText(oppCards, state)}
        </div>
      </div>
    </div>
  );
}
