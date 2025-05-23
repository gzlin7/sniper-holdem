import React from "react";
import { renderCard } from "./renderCard";
import { getHandRank } from "../handHelper.js";

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
  yourRole = "Player 1",
  oppRole = "Player 2",
  myTurn,
  dealerIsP1,
  state,
  hideOpponent
}) {
  // Determine which cards to show for you and opponent
  let showYourCards, showOppCards, yourChips, oppChips, yourBet, oppBet;

  if (yourRole === "player1") {
    showYourCards = state.p1.cards;
    showOppCards = (!hideOpponent)
      ? state.p2.cards
      : state.p2.cards.map(() => ({ rank: "?", suit: "?" }));
    yourChips = state.p1.chips;
    oppChips = state.p2.chips;
    yourBet = state.p1.bet || 0;
    oppBet = state.p2.bet || 0;
  } else if (yourRole === "player2") {
    showYourCards = state.p2.cards;
    showOppCards = (!hideOpponent)
      ? state.p1.cards
      : state.p1.cards.map(() => ({ rank: "?", suit: "?" }));
    yourChips = state.p2.chips;
    oppChips = state.p1.chips;
    yourBet = state.p2.bet || 0;
    oppBet = state.p1.bet || 0;
  } else {
    showYourCards = [];
    showOppCards = [];
    yourChips = 0;
    oppChips = 0;
    yourBet = 0;
    oppBet = 0;
  }

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
          {showYourCards.map((c, i) => (
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
          {getHandRankText(showYourCards, state)}
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
          {showOppCards.map((c, i) => (
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
          {(!hideOpponent) ? getHandRankText(showOppCards, state) : null}
        </div>
      </div>
    </div>
  );
}
