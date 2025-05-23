import React from "react";
import { getHandRank } from "../handHelper";

export function SnipingUI({
  mySnipe,
  setMySnipe,
  myRole,
  whoseTurn,
  setWhoseTurn,
  emitMove,
  state,
  setState,
  p1Folded,
  p2Folded,
  history,
  socketRef,
}) {
  // Hide UI if not your turn
  if (myRole !== whoseTurn) return null;
  let snipes = state.snipes;

  const HAND_TYPES = [
    "High Card",
    "One Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
    "Royal Flush",
  ];
  const RANKS = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  function handleSnipe() {
    // Update snipes in state with mySnipe before emitting move
    const updatedSnipes = {
      ...state.snipes,
      [myRole]: `${mySnipe.rank} ${mySnipe.type}`,
    };
    const updatedState = { ...state, snipes: updatedSnipes };
    setState(updatedState);
    const nextTurn = myRole === "player1" ? "player2" : "player1";
    setWhoseTurn(nextTurn);
    emitMove(updatedState, p1Folded, p2Folded, nextTurn, [
      `${myRole} sniped ${mySnipe.rank} ${mySnipe.type}`,
      ...history,
    ]);
    setMySnipe({ rank: "", type: "" });

    console.log("Snipes:", updatedSnipes);

    // If both players have sniped, emit game-over
    if (updatedSnipes.player1 && updatedSnipes.player2) {
      console.log("Both players have sniped, game over");
      emitMove(
        updatedState,
        p1Folded,
        p2Folded,
        nextTurn,
        ["Both players have sniped, game over", ...history],
        true // Emit game-over
      );
    }
  }

  return (
    <div style={{ textAlign: "center", margin: 24 }}>
      <label>
        <strong>Snipe a hand:&nbsp;</strong>
        <select
          value={mySnipe.rank}
          onChange={(e) => setMySnipe((s) => ({ ...s, rank: e.target.value }))}
          disabled={snipes[myRole]}
        >
          <option value="">Rank</option>
          {RANKS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        &nbsp;
        <select
          value={mySnipe.type}
          onChange={(e) => setMySnipe((s) => ({ ...s, type: e.target.value }))}
          disabled={snipes[myRole]}
        >
          <option value="">Hand Type</option>
          {HAND_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <button
        style={{ marginLeft: 12 }}
        disabled={
          !mySnipe.rank ||
          !mySnipe.type ||
          !!snipes[myRole] ||
          myRole !== whoseTurn
        }
        onClick={handleSnipe}
      >
        Snipe
      </button>
    </div>
  );
}
