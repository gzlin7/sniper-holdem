import React, { useState, useEffect, useRef } from "react";
import './App.css';
import io from "socket.io-client"
import { BlindsInfo } from "./components/BlindsInfo";
import { SnipesInfo } from "./components/SnipesInfo";
import { HistoryLog } from "./components/HistoryLog";
import { Table } from "./components/Table";
import { Players } from "./components/Players";
import { Controls } from "./components/Controls";
import { SnipingUI } from "./components/SnipingUI";
import { getHandRank } from "./handHelper";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SMALL_BLIND = 5;
const BIG_BLIND = 10;

function dealUniqueCards(count, exclude = []) {
  let deck = [];
  for (let s of SUITS) for (let r of RANKS) deck.push({ rank: r, suit: s });
  const used = new Set(exclude.map(c => c ? c.rank + c.suit : ''));
  deck = deck.filter(c => !used.has(c.rank + c.suit));
  deck = deck.sort(() => Math.random() - 0.5);
  return deck.slice(0, count);
}

function App() {
  const [history, setHistory] = useState([]);
  const [dealerIsP1, setDealerIsP1] = useState(true);
  const [betAmount, setBetAmount] = useState(0);
  const [p1Folded, setP1Folded] = useState(false);
  const [p2Folded, setP2Folded] = useState(false);
  const [whoseTurn, setWhoseTurn] = useState("player1");
  const [waiting, setWaiting] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [snipingPhase, setSnipingPhase] = useState(false);

  // Internal state: p1/p2 instead of you/opp
  const [state, setState] = useState({
    p1: { chips: 100, cards: [], folded: false, bet: 0 },
    p2: { chips: 100, cards: [], folded: false, bet: 0 },
    community: [],
    pot: 0,
    snipes: {player1 : null, player2 :null} 
  });

  const socketRef = useRef(null);
  const [roomReady, setRoomReady] = useState(false);
  const [myRole, setMyRole] = useState(null); // "player1" or "player2"

  function addHistoryEntry(entry) {
    setHistory(prev => [entry, ...prev]);
  }

  // --- Game over handler ---
  function handleGameOver({ state: finalState }) {
    // Reveal both players' cards and hand ranks in the UI

    const p1Hand = [
      ...finalState.p1.cards,
      ...finalState.community.filter(Boolean),
    ];
    const p2Hand = [
      ...finalState.p2.cards,
      ...finalState.community.filter(Boolean),
    ];
    const p1Rank = getHandRank(p1Hand);
    const p2Rank = getHandRank(p2Hand);

    // Sniping logic
    const snipes = finalState.snipes || {};
    let p1Sniped = false, p2Sniped = false;

    // Check if p1's hand matches either snipe
    for (const snipe of [snipes.player1, snipes.player2]) {
      if (snipe) {
        const [snipeRank, ...snipeTypeArr] = snipe.split(" ");
        const snipeType = snipeTypeArr.join(" ");
        if (
          p1Rank.name &&
          p1Rank.name.startsWith(snipeRank) &&
          p1Rank.name.endsWith(snipeType)
        ) {
          p1Sniped = true;
        }
        if (
          p2Rank.name &&
          p2Rank.name.startsWith(snipeRank) &&
          p2Rank.name.endsWith(snipeType)
        ) {
          p2Sniped = true;
        }
      }
    }

    let winner;
    let winnerKey = null;
    let isTie = false;
    if (p1Sniped && p2Sniped) {
      winner = "It's a tie! Both players were sniped.";
      isTie = true;
    } else if (p1Sniped) {
      winner = "Player 2 wins! Player 1 was sniped.";
      winnerKey = "p2";
    } else if (p2Sniped) {
      winner = "Player 1 wins! Player 2 was sniped.";
      winnerKey = "p1";
    } else if (p1Rank.value > p2Rank.value) {
      winner = "Player 1 wins!";
      winnerKey = "p1";
    } else if (p2Rank.value > p1Rank.value) {
      winner = "Player 2 wins!";
      winnerKey = "p2";
    } else {
      // If same hand type, compare high card
      if (p1Rank.high > p2Rank.high) {
        winner = "Player 1 wins!";
        winnerKey = "p1";
      } else if (p2Rank.high > p1Rank.high) {
        winner = "Player 2 wins!";
        winnerKey = "p2";
      } else {
        winner = "It's a tie!";
        isTie = true;
      }
    }
    setHistory((prev) => [`Game Over: ${winner}`, ...prev]);
    alert(`Game Over: ${winner}`);

    // Give the winner the pot chips (if not a tie), or split if tie
    setState(prev => {
      let newP1 = { ...prev.p1 };
      let newP2 = { ...prev.p2 };
      let newPot = prev.pot;
      if (isTie && prev.pot > 0) {
        const half = Math.round(prev.pot / 2);
        newP1.chips += half;
        newP2.chips += prev.pot - half;
        newPot = 0;
      } else if (winnerKey === "p1") {
        newP1.chips += prev.pot;
        newPot = 0;
      } else if (winnerKey === "p2") {
        newP2.chips += prev.pot;
        newPot = 0;
      }
      // Reset snipes and snipingPhase, keep chips and pot as above
      return {
        ...prev,
        p1: { ...newP1, cards: [], folded: false, bet: 0 },
        p2: { ...newP2, cards: [], folded: false, bet: 0 },
        community: [],
        pot: newPot,
        snipes: { player1: null, player2: null }
      };
    });
    setSnipingPhase(false);

    // Start a new round, but keep chips and pot the same
    setTimeout(() => {
      setState(prev => {
        // Deal new cards, keep chips and pot
        const all = dealUniqueCards(6);
        const p1Cards = [all[0], all[1]];
        const p2Cards = [all[2], all[3]];
        const community = [all[4], all[5], null, null];
        return {
          ...prev,
          p1: { ...prev.p1, cards: p1Cards, folded: false, bet: 0 },
          p2: { ...prev.p2, cards: p2Cards, folded: false, bet: 0 },
          community,
          snipes: { player1: null, player2: null }
        };
      });
      setP1Folded(false);
      setP2Folded(false);
      setWhoseTurn("player1");
      setHistory([]);
      addHistoryEntry("New round started");
      // Sync state to server for both players
      if (socketRef.current) {
        socketRef.current.emit("sync-state", {
          state,
          dealerIsP1,
          p1Folded: false,
          p2Folded: false,
          whoseTurn: "player1",
          history: ["New round started"]
        });
      }
    }, 1200);
  }

  // --- Sockets setup ---
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io.connect("http://localhost:3001");
      socketRef.current = socket;

      socket.emit("join-game");
      console.log("Emitted join game");

      socket.on("waiting", () => {
        setWaiting(true);
        setRoomReady(false);
      });

      socket.on("game-start", ({ role, room }) => {
        setMyRole(role);
        setWaiting(false);
        setRoomReady(true);
        setWhoseTurn("player1");
      });

      socket.on("sync-state", (data) => {
        setState(data.state);
        setDealerIsP1(data.dealerIsP1);
        setP1Folded(data.p1Folded);
        setP2Folded(data.p2Folded);
        setWhoseTurn(data.whoseTurn);
        setHistory(data.history);
      });

      socket.on("move", (data) => {
        setState(data.state);
        setP1Folded(data.p1Folded);
        setP2Folded(data.p2Folded);
        setWhoseTurn(data.whoseTurn);
        setHistory(data.history);
      });

      // Use the new handler function
      socket.on("game-over", handleGameOver);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (roomReady && myRole === "player1") {
      startRound(true, true);
    }
    // eslint-disable-next-line
  }, [roomReady, myRole]);

  // Update betAmount to 0.5 * pot whenever pot changes and betAmount is 0
  useEffect(() => {
    if (state.pot > 0 && betAmount === 0) {
      setBetAmount(Math.floor(state.pot * 0.5));
    }
    // eslint-disable-next-line
  }, [state.pot]);

  function emitMove(newState, newP1Folded, newP2Folded, newWhoseTurn, newHistory, gameOver = false) {
    if (socketRef.current) {
      console.log("Emitting move", newState);
      socketRef.current.emit(gameOver ? "game-over" : "move", {
        state: newState,
        p1Folded: newP1Folded,
        p2Folded: newP2Folded,
        whoseTurn: newWhoseTurn,
        history: newHistory,
      });
    }
  }

  function startRound(isFirst = false, sync = false) {
    // Deal 2 cards to each player, 4 unique community cards, only reveal first 2
    const all = dealUniqueCards(6);
    const p1Cards = [all[0], all[1]];
    const p2Cards = [all[2], all[3]];
    const community = [all[4], all[5], null, null];
    const newState = {
      p1: {
        chips: 100 - (dealerIsP1 ? BIG_BLIND : SMALL_BLIND),
        cards: p1Cards,
        folded: false,
        bet: dealerIsP1 ? BIG_BLIND : SMALL_BLIND,
      },
      p2: {
        chips: 100 - (dealerIsP1 ? SMALL_BLIND : BIG_BLIND),
        cards: p2Cards,
        folded: false,
        bet: dealerIsP1 ? SMALL_BLIND : BIG_BLIND,
      },
      community,
      pot: SMALL_BLIND + BIG_BLIND,
      snipes: { player1: null, player2: null },
    };
    setState(newState);
    setP1Folded(false);
    setP2Folded(false);
    setWhoseTurn("player1"); // Always start with player1's turn
    setDealerIsP1(d => !d);
    setHistory([]);
    addHistoryEntry("New round started");
    if (sync && socketRef.current) {
      socketRef.current.emit("sync-state", {
        state: newState,
        dealerIsP1: !dealerIsP1,
        p1Folded: false,
        p2Folded: false,
        whoseTurn: "player1",
        history: ["New round started"]
      });
    }
  }

  // --- Sniping UI state ---
  const [mySnipe, setMySnipe] = useState({ rank: "", type: "" });

  // For UI, map p1/p2 to you/opp based on myRole
  let your, opp, yourBet, oppBet;
  if (myRole === "player1") {
    your = state.p1;
    opp = { ...state.p2, cards: state.p2.cards.map(() => ({ rank: "?", suit: "?" })) };
    yourBet = state.p1.bet || 0;
    oppBet = state.p2.bet || 0;
  } else if (myRole === "player2") {
    your = state.p2;
    opp = { ...state.p1, cards: state.p1.cards.map(() => ({ rank: "?", suit: "?" })) };
    yourBet = state.p2.bet || 0;
    oppBet = state.p1.bet || 0;
  } else {
    your = { chips: 0, cards: [], folded: false, bet: 0 };
    opp = { chips: 0, cards: [], folded: false, bet: 0 };
    yourBet = 0;
    oppBet = 0;
  }

  return (
    <div>
      <BlindsInfo smallBlind={SMALL_BLIND} bigBlind={BIG_BLIND} />
      <SnipesInfo state={state} />
      <HistoryLog history={history} />
      <h1 style={{ textAlign: "center" }}>Sniper Hold'em Poker</h1>
      {waiting && (
        <div style={{ textAlign: "center", color: "#fff", margin: 24 }}>
          Waiting for an opponent to join...
        </div>
      )}
      <Table community={state.community} pot={state.pot} />
      <Players
        yourCards={your.cards}
        oppCards={opp.cards}
        yourChips={your.chips}
        oppChips={opp.chips}
        yourRole={myRole}
        oppRole={myRole === "player1" ? "player2" : "player1"}
        myTurn={whoseTurn === myRole}
        yourBet={yourBet}
        oppBet={oppBet}
        dealerIsP1={dealerIsP1}
        state={state}
      />
      {state.snipes.player1 || state.snipes.player2 || snipingPhase ? (
        <SnipingUI
          mySnipe={mySnipe}
          setMySnipe={setMySnipe}
          myRole={myRole}
          whoseTurn={whoseTurn}
          setWhoseTurn={setWhoseTurn}
          emitMove={emitMove}
          history={history}
          state={state}
          setState={setState}
          addHistoryEntry={addHistoryEntry}
        />
      ) : (
        <Controls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          disabled={myRole !== whoseTurn}
          myRole={myRole}
          whoseTurn={whoseTurn}
          state={state}
          setState={setState}
          p1Folded={p1Folded}
          setP1Folded={setP1Folded}
          p2Folded={p2Folded}
          setP2Folded={setP2Folded}
          emitMove={emitMove}
          dealerIsP1={dealerIsP1}
          addHistoryEntry={addHistoryEntry}
          history={history}
          setWhoseTurn={setWhoseTurn}
          lastCheck={lastCheck}
          setLastCheck={setLastCheck}
          setSnipingPhase={setSnipingPhase}
        />
      )}
    </div>
  );
}

export default App;
