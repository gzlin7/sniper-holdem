import React, { useState, useEffect, useRef } from "react";
import './App.css';
import io from "socket.io-client"
import { BlindsInfo } from "./components/BlindsInfo";
import { SnipesInfo } from "./components/SnipesInfo";
import { HistoryLog } from "./components/HistoryLog";
import { Table } from "./components/Table";
import { Players } from "./components/Players";
import { Controls } from "./components/Controls";
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
  const [snipes, setSnipes] = useState([]);
  const [history, setHistory] = useState([]);
  const [dealerIsP1, setDealerIsP1] = useState(true);
  const [betAmount, setBetAmount] = useState(0);
  const [p1Folded, setP1Folded] = useState(false);
  const [p2Folded, setP2Folded] = useState(false);
  const [whoseTurn, setWhoseTurn] = useState("player1");
  const [waiting, setWaiting] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  // Internal state: p1/p2 instead of you/opp
  const [state, setState] = useState({
    p1: { chips: 100, cards: [], folded: false, bet: 0 },
    p2: { chips: 100, cards: [], folded: false, bet: 0 },
    community: [],
    pot: 0,
  });

  const socketRef = useRef(null);
  const [roomReady, setRoomReady] = useState(false);
  const [myRole, setMyRole] = useState(null); // "player1" or "player2"

  function addHistoryEntry(entry) {
    setHistory(prev => [entry, ...prev]);
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
        console.log("Game started, role:", role, "room:", room);
        setMyRole(role);
        setWaiting(false);
        setRoomReady(true);
        setWhoseTurn("player1"); // Always start with player1's turn
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

  function emitMove(newState, newP1Folded, newP2Folded, newWhoseTurn, newHistory) {
    if (socketRef.current) {
      socketRef.current.emit("move", {
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
      p1: { chips: 100 - (dealerIsP1 ? BIG_BLIND : SMALL_BLIND), cards: p1Cards, folded: false, bet: dealerIsP1 ? BIG_BLIND : SMALL_BLIND },
      p2: { chips: 100 - (dealerIsP1 ? SMALL_BLIND : BIG_BLIND), cards: p2Cards, folded: false, bet: dealerIsP1 ? SMALL_BLIND : BIG_BLIND },
      community,
      pot: SMALL_BLIND + BIG_BLIND,
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

  // For UI, map p1/p2 to you/opp based on myRole
  let your, opp, youBlind, oppBlind, yourBet, oppBet;
  if (myRole === "player1") {
    your = state.p1;
    opp = { ...state.p2, cards: state.p2.cards.map(() => ({ rank: "?", suit: "?" })) };
    youBlind = dealerIsP1 ? '(Big Blind)' : '(Small Blind)';
    oppBlind = dealerIsP1 ? '(Small Blind)' : '(Big Blind)';
    yourBet = state.p1.bet || 0;
    oppBet = state.p2.bet || 0;
  } else if (myRole === "player2") {
    your = state.p2;
    opp = { ...state.p1, cards: state.p1.cards.map(() => ({ rank: "?", suit: "?" })) };
    youBlind = !dealerIsP1 ? '(Big Blind)' : '(Small Blind)';
    oppBlind = !dealerIsP1 ? '(Small Blind)' : '(Big Blind)';
    yourBet = state.p2.bet || 0;
    oppBet = state.p1.bet || 0;
  } else {
    your = { chips: 0, cards: [], folded: false, bet: 0 };
    opp = { chips: 0, cards: [], folded: false, bet: 0 };
    youBlind = "";
    oppBlind = "";
    yourBet = 0;
    oppBet = 0;
  }

  // --- Hand rank logic using handHelper ---
  let rankText = "";
  let oppRankText = "";
  if (your.cards && state.community) {
    const allYourCards = [...your.cards, ...state.community.filter(Boolean)];
    if (allYourCards.length >= 5 && allYourCards.every(c => c && c.rank && c.suit)) {
      rankText = getHandRank(allYourCards).name;
    }
    // For opponent, only show if all cards are revealed (no '?')
    const allOppCards = [...opp.cards, ...state.community.filter(Boolean)];
    if (
      allOppCards.length >= 5 &&
      allOppCards.every(c => c && c.rank && c.suit && c.rank !== "?" && c.suit !== "?")
    ) {
      oppRankText = getHandRank(allOppCards).name;
    }
  }

  return (
    <div>
      <BlindsInfo smallBlind={SMALL_BLIND} bigBlind={BIG_BLIND} />
      <SnipesInfo snipes={snipes} />
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
        yourRank={rankText}
        oppRank={oppRankText}
        youBlind={youBlind}
        oppBlind={oppBlind}
        yourRole={myRole}
        oppRole={myRole === "player1" ? "player2" : "player1"}
        myTurn={whoseTurn === myRole}
        yourBet={yourBet}
        oppBet={oppBet}
      />
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
      />
    </div>
  );
}

export default App;
