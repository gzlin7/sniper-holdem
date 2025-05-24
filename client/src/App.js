import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import io from "socket.io-client";
import { BlindsInfo } from "./components/BlindsInfo";
import { SnipesInfo } from "./components/SnipesInfo";
import { HistoryLog } from "./components/HistoryLog";
import { Table } from "./components/Table";
import { Players } from "./components/Players";
import { Controls } from "./components/Controls";
import { SnipingUI } from "./components/SnipingUI";
import { getHandRank, RANK_ORDER } from "./handHelper";

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
const SMALL_BLIND = 5;
const BIG_BLIND = 10;

function dealUniqueCards(count, exclude = []) {
  let deck = [];
  for (let s of SUITS) for (let r of RANKS) deck.push({ rank: r, suit: s });
  const used = new Set(exclude.map((c) => (c ? c.rank + c.suit : "")));
  deck = deck.filter((c) => !used.has(c.rank + c.suit));
  deck = deck.sort(() => Math.random() - 0.5);
  return deck.slice(0, count);
}

// Use the production backend URL for Socket.IO
const SOCKET_IO_URL = "https://sniper-holdem.onrender.com";
// const SOCKET_IO_URL = "http://localhost:3001";

function App() {
  const [history, setHistory] = useState([]);
  const [dealerIsP1, setDealerIsP1] = useState(true);
  const [betAmount, setBetAmount] = useState(0);
  const [whoseTurn, setWhoseTurn] = useState("player1");
  const [waiting, setWaiting] = useState(true);
  const [hideOpponent, setHideOpponent] = useState(true); // New state for hiding opponent's card

  // Internal state
  const [state, setState] = useState({
    p1: { chips: 100, cards: [], folded: false, bet: 0 },
    p2: { chips: 100, cards: [], folded: false, bet: 0 },
    community: [],
    pot: 0,
    snipes: { player1: null, player2: null },
    lastCheck: null,
    snipingPhase: false,
  });

  const socketRef = useRef(null);
  const [roomReady, setRoomReady] = useState(false);
  const [myRole, setMyRole] = useState(null); // "player1" or "player2"

  function addHistoryEntry(entry) {
    setHistory((prev) => [entry, ...prev]);
  }

  // --- Game over handler ---
  function handleGameOver({ state: finalState }) {
    let winner;
    let winnerKey = null;
    let isTie = false;

    if (finalState.p1.folded || finalState.p2.folded) {
      console.log("One player folded");
      let foldingPlayer = finalState.p1.folded ? "Player 1" : "Player 2";
      let winningPlayer = finalState.p1.folded ? "Player 2" : "Player 1";
      winner = `${foldingPlayer} folded, ${winningPlayer} wins!`;
      winnerKey = finalState.p1.folded ? "p2" : "p1";
    } else {
      // If both players are not folded, determine the winner based on hand ranks
      // Reveal both players' cards and hand ranks in the UI
      setHideOpponent(false);

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
      let p1Sniped = false,
        p2Sniped = false;

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
        function extractPrefixValue(rankObj) {
          if (!rankObj || !rankObj.name) return 0;
          const prefix = rankObj.name.split(" ")[0];
          return RANK_ORDER[prefix] || 0;
        }
        const p1Prefix = extractPrefixValue(p1Rank);
        const p2Prefix = extractPrefixValue(p2Rank);

        if (p1Prefix > p2Prefix) {
          winner = "Player 1 wins!";
          winnerKey = "p1";
        } else if (p2Prefix > p1Prefix) {
          winner = "Player 2 wins!";
          winnerKey = "p2";
        } else {
          winner = "It's a tie!";
          isTie = true;
        }
      }
    }

    setHistory((prev) => [`Game Over: ${winner}`, ...prev]);
    setTimeout(() => {
      alert(`Game Over: ${winner}`);
    }, 2000);

    // --- FIX: Use startRound to properly initialize the next round ---
    setTimeout(() => {
      setHideOpponent(true);
      setHistory([]);
      // Calculate new chips for blinds and pot
      setState((prev) => {
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
        // Alternate dealer for next round
        const nextDealerIsP1 = !dealerIsP1;
        // Deduct blinds for new round
        const p1Chips =
          newP1.chips - (nextDealerIsP1 ? SMALL_BLIND : BIG_BLIND);
        const p2Chips =
          newP2.chips - (nextDealerIsP1 ? BIG_BLIND : SMALL_BLIND);
        // Deal new cards
        const all = dealUniqueCards(6);
        const p1Cards = [all[0], all[1]];
        const p2Cards = [all[2], all[3]];
        const community = [all[4], all[5], null, null];
        // Dealer goes first: if dealer is p1, player1; else player2
        const nextWhoseTurn = nextDealerIsP1 ? "player1" : "player2";
        return {
          ...prev,
          p1: {
            ...newP1,
            chips: p1Chips,
            cards: p1Cards,
            folded: false,
            bet: nextDealerIsP1 ? SMALL_BLIND : BIG_BLIND,
          },
          p2: {
            ...newP2,
            chips: p2Chips,
            cards: p2Cards,
            folded: false,
            bet: nextDealerIsP1 ? BIG_BLIND : SMALL_BLIND,
          },
          community,
          pot: SMALL_BLIND + BIG_BLIND,
          snipes: { player1: null, player2: null },
          lastCheck: null,
          snipingPhase: false,
        };
      });
      setDealerIsP1((d) => !d);
      // Set whoseTurn to the new dealer
      setWhoseTurn(!dealerIsP1 ? "player1" : "player2");
      addHistoryEntry("New round started");
      // Sync state to server for both players
      if (socketRef.current) {
        setTimeout(() => {
          setState((prev) => {
            socketRef.current.emit("sync-state", {
              state: prev,
              dealerIsP1: dealerIsP1,
              whoseTurn: !dealerIsP1 ? "player1" : "player2",
              history: ["New round started"],
            });
            return prev;
          });
        }, 0);
      }
    }, 2500);
  }

  // --- Sockets setup ---
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_IO_URL, { transports: ["websocket"] });

      socketRef.current.emit("join-game");
      console.log("Emitted join game");

      socketRef.current.on("waiting", () => {
        setWaiting(true);
        setRoomReady(false);
      });

      socketRef.current.on("game-start", ({ role, room }) => {
        setMyRole(role);
        setWaiting(false);
        setRoomReady(true);
        setWhoseTurn("player1");
      });

      socketRef.current.on("sync-state", (data) => {
        setState(data.state);
        setDealerIsP1(data.dealerIsP1);
        setWhoseTurn(data.whoseTurn);
        setHistory(data.history);
      });

      socketRef.current.on("move", (data) => {
        setState(data.state);
        setWhoseTurn(data.whoseTurn);
        setHistory(data.history);
      });

      // Use the new handler function
      socketRef.current.on("game-over", handleGameOver);
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

  function emitMove(
    newState,
    newWhoseTurn,
    newHistory,
    gameOver = false
  ) {
    if (socketRef.current) {
      socketRef.current.emit(gameOver ? "game-over" : "move", {
        state: newState,
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
        chips: 100 - (dealerIsP1 ? SMALL_BLIND : BIG_BLIND),
        cards: p1Cards,
        folded: false,
        bet: dealerIsP1 ? SMALL_BLIND : BIG_BLIND,
      },
      p2: {
        chips: 100 - (dealerIsP1 ? BIG_BLIND : SMALL_BLIND),
        cards: p2Cards,
        folded: false,
        bet: dealerIsP1 ? BIG_BLIND : SMALL_BLIND,
      },
      community,
      pot: SMALL_BLIND + BIG_BLIND,
      snipes: { player1: null, player2: null },
      lastCheck: null,
      snipingPhase: false,
    };
    setState(newState);
    setWhoseTurn("player1"); // Always start with player1's turn
    setDealerIsP1((d) => !d);
    setHistory([]);
    addHistoryEntry("New round started");
    if (sync && socketRef.current) {
      socketRef.current.emit("sync-state", {
        state: newState,
        dealerIsP1: !dealerIsP1,
        whoseTurn: "player1",
        history: ["New round started"],
      });
    }
  }

  // --- Sniping UI state ---
  const [mySnipe, setMySnipe] = useState({ rank: "", type: "" });

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
        yourRole={myRole}
        oppRole={myRole === "player1" ? "player2" : "player1"}
        myTurn={whoseTurn === myRole}
        dealerIsP1={dealerIsP1}
        state={state}
        hideOpponent={hideOpponent}
      />
      {state.snipes.player1 || state.snipes.player2 || state.snipingPhase ? (
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
          emitMove={emitMove}
          dealerIsP1={dealerIsP1}
          addHistoryEntry={addHistoryEntry}
          history={history}
          setWhoseTurn={setWhoseTurn}
        />
      )}
    </div>
  );
}

export default App;
