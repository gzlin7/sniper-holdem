import React from "react";

// The Controls component now owns the action logic and receives all necessary state and setters as props.
export function Controls({
  betAmount,
  setBetAmount,
  disabled,
  myRole,
  whoseTurn,
  state,
  setState,
  p1Folded,
  setP1Folded,
  p2Folded,
  setP2Folded,
  emitMove,
  addHistoryEntry,
  history,
  setWhoseTurn,
  setSnipingPhase,
  dealerIsP1, // <-- add this prop to Controls in App.js
}) {
  let myChips = myRole === "player1" ? state.p1.chips : state.p2.chips;
  
  // TODO: Remove redefinition of constants from App.js
  const SMALL_BLIND = 5;
  const BIG_BLIND = 10;

  // Helper for dealing unique cards (copied from App.js)
  function dealUniqueCards(count, exclude = []) {
    const SUITS = ["♠", "♥", "♦", "♣"];
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
    let deck = [];
    for (let s of SUITS) for (let r of RANKS) deck.push({ rank: r, suit: s });
    const used = new Set(exclude.map((c) => (c ? c.rank + c.suit : "")));
    deck = deck.filter((c) => !used.has(c.rank + c.suit));
    deck = deck.sort(() => Math.random() - 0.5);
    return deck.slice(0, count);
  }

  // --- Advance to next phase ---
  function advanceToNextPhase(nextTurn, state) {
    const unrevealed = state.community.filter((c) => c === null).length;
    if (unrevealed > 0) {
      const used = [
        ...state.community.filter(Boolean),
        ...state.p1.cards,
        ...state.p2.cards,
      ];
      const toReveal = Math.min(2, unrevealed);
      const newCards = dealUniqueCards(toReveal, used);
      setState((prev) => {
        const newCommunity = prev.community.slice();
        let idx = 0;
        for (let i = 0; i < newCommunity.length && idx < newCards.length; ++i) {
          if (newCommunity[i] === null) {
            newCommunity[i] = newCards[idx++];
          }
        }
        const updatedState = { ...prev, community: newCommunity, lastCheck: null };
        emitMove(updatedState, p1Folded, p2Folded, nextTurn, [
          "Community cards revealed",
          ...history,
        ]);
        return updatedState;
      });
      addHistoryEntry("Community cards revealed");
    } else {
      setSnipingPhase(true);
      addHistoryEntry("Players may now snipe");
      // TODO: Should I reset lastCheck here to null as well? I don't think it's necessary
      emitMove(state, p1Folded, p2Folded, nextTurn, [
        "Players may now snipe",
        ...history,
      ]);
    }
  }

  // --- Controls logic ---
  function handleFold() {
    if (myRole === "player1") setP1Folded(true);
    else setP2Folded(true);
    addHistoryEntry(myRole + " folded");
    const nextTurn = myRole === "player1" ? "player2" : "player1";
    setWhoseTurn(nextTurn);
    emitMove(
      state,
      myRole === "player1" ? true : p1Folded,
      myRole === "player2" ? true : p2Folded,
      nextTurn,
      [myRole + " folded", ...history]
    );
  }

  function handleCheck() {
    addHistoryEntry(myRole + " checked");
    let bothBetEqualBigBlind = state.p1.bet === BIG_BLIND && state.p2.bet === BIG_BLIND;
    console.log("bothBetEqualBigBlind", bothBetEqualBigBlind);
    if ((state.lastCheck && state.lastCheck !== myRole) || bothBetEqualBigBlind) {
      const nextTurn = whoseTurn === "player1" ? "player2" : "player1";
      advanceToNextPhase(nextTurn, state);
      setWhoseTurn(nextTurn);
      const updatedState = { ...state, lastCheck: null };
      emitMove(updatedState, p1Folded, p2Folded, nextTurn, history);
    } else {
      const nextTurn = whoseTurn === "player1" ? "player2" : "player1";
      setWhoseTurn(nextTurn);
      const updatedState = { ...state, lastCheck: myRole };
      emitMove(updatedState, p1Folded, p2Folded, nextTurn, [
        myRole + " checked",
        ...history,
      ]);
    }
  }

  function handleRaise() {
    let newState;
    // Parse betAmount as integer
    const raiseAmt = parseInt(betAmount, 10) || 0;
    if (myRole === "player1") {
      if (raiseAmt > state.p1.chips) {
        alert("You cannot bet more than you have!");
        return;
      }
      if (raiseAmt <= state.p2.bet - state.p1.bet) {
        alert("Raise amount must make your bet greater than opponent bet.");
        return;
      }
      newState = {
        ...state,
        p1: {
          ...state.p1,
          chips: state.p1.chips - raiseAmt,
          bet: (state.p1.bet || 0) + raiseAmt, // increment bet value
        },
        pot: state.pot + raiseAmt,
      };
    } else {
      if (raiseAmt > state.p2.chips) {
        alert("You cannot bet more than you have!");
        return;
      }
      if (raiseAmt <= state.p1.bet - state.p2.bet) {
        alert("Raise amount must make your bet greater than opponent bet.");
        return;
      }
      newState = {
        ...state,
        p2: {
          ...state.p2,
          chips: state.p2.chips - raiseAmt,
          bet: (state.p2.bet || 0) + raiseAmt, // increment bet value
        },
        pot: state.pot + raiseAmt,
      };
    }
    addHistoryEntry(`${myRole} raised $${raiseAmt}`);
    const nextTurn = myRole === "player1" ? "player2" : "player1";
    setState(newState);
    setWhoseTurn(nextTurn);
    emitMove(newState, p1Folded, p2Folded, nextTurn, [
      `${myRole} raised $${raiseAmt}`,
      ...history,
    ]);
  }

  // --- New: Call logic ---
  function handleCall() {
    let callAmount;
    if (myRole === "player1") {
      callAmount = Math.max(0, state.p2.bet - state.p1.bet);
      if (callAmount > state.p1.chips) callAmount = state.p1.chips;
      if (callAmount <= 0) return;
      const newState = {
        ...state,
        p1: {
          ...state.p1,
          chips: state.p1.chips - callAmount,
          bet: state.p1.bet + callAmount,
        },
        pot: state.pot + callAmount,
      };
      addHistoryEntry(`${myRole} called $${callAmount}`);
      const nextTurn = "player2";
      setState(newState);
      setWhoseTurn(nextTurn);
      emitMove(newState, p1Folded, p2Folded, nextTurn, [
        `${myRole} called $${callAmount}`,
        ...history,
      ]);
      // Only advance phase if not the very first move (i.e. not both at blinds)
      const isFirstMove =
        state.p1.bet === SMALL_BLIND && state.p2.bet === BIG_BLIND;
      if (!isFirstMove) {
        advanceToNextPhase(nextTurn, newState);
      }
    } else {
      callAmount = Math.max(0, state.p1.bet - state.p2.bet);
      if (callAmount > state.p2.chips) callAmount = state.p2.chips;
      if (callAmount <= 0) return;
      const newState = {
        ...state,
        p2: {
          ...state.p2,
          chips: state.p2.chips - callAmount,
          bet: state.p2.bet + callAmount,
        },
        pot: state.pot + callAmount,
      };
      addHistoryEntry(`${myRole} called $${callAmount}`);
      const nextTurn = "player1";
      setState(newState);
      setWhoseTurn(nextTurn);
      emitMove(newState, p1Folded, p2Folded, nextTurn, [
        `${myRole} called $${callAmount}`,
        ...history,
      ]);
      // Only advance phase if not the very first move (i.e. not both at blinds)
      const isFirstMove =
        state.p2.bet === SMALL_BLIND && state.p1.bet === BIG_BLIND;
      if (!isFirstMove) {
        advanceToNextPhase(nextTurn, newState);
      }
    }
  }

  // canCheck = True means you can only check or raise (should be called bet)
  // canCheck = False means you can only fold, call, or raise
  let canCheck = true;
  if (myRole === "player1") {
    canCheck = (state.p2.bet - state.p1.bet) <= 0;
  } else if (myRole === "player2") {
    canCheck = (state.p1.bet - state.p2.bet) <= 0;
  }

  return (
    <div id="controls">
      <button
        id="fold-btn"
        onClick={handleFold}
        disabled={disabled || canCheck}
        style={(disabled || canCheck) ? { opacity: 0.5, pointerEvents: "none" } : {}}
      >
        Fold
      </button>
      <button
        id="check-btn"
        onClick={handleCheck}
        disabled={disabled || !canCheck}
        style={(disabled || !canCheck) ? { opacity: 0.5, pointerEvents: "none" } : {}}
      >
        Check
      </button>
      <button
        id="call-btn"
        onClick={handleCall}
        disabled={disabled || canCheck}
        style={(disabled || canCheck) ? { opacity: 0.5, pointerEvents: "none" } : {}}
      >
        Call
      </button>
      <button
        id="raise-btn"
        onClick={handleRaise}
        disabled={disabled || betAmount <= 0 || betAmount > myChips}
        style={disabled ? { opacity: 0.5, pointerEvents: "none" } : {}}
      >
        Raise
      </button>
      <input
        type="number"
        id="bet-amount"
        value={betAmount}
        min="1"
        style={{
          width: 60,
          background: disabled ? "#eee" : undefined,
          color: disabled ? "#888" : undefined,
        }}
        onChange={(e) => setBetAmount(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
