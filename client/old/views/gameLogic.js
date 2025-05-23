import { getHandRank } from './handHelper.js';

export function checkGameOver({
    state,
    snipes,
    sniped,
    oppRealCards,
    addHistoryEntry,
    postBlinds,
    startRound,
    updateUI
}) {
    if (sniped.you && sniped.opp) {
        // Reveal opponent cards in UI
        state.oppCards = oppRealCards;
        updateUI();

        // Determine actual hands
        const yourHand = getHandRank(state.yourCards.concat(state.community.filter(Boolean)));
        const oppHand = getHandRank(state.oppCards.concat(state.community.filter(Boolean)));

        // Parse snipes
        const youSnipe = parseSnipe(snipes.you);
        const oppSnipe = parseSnipe(snipes.opp);

        // Helper to check if a hand matches a snipe
        function handMatchesSnipe(hand, snipe) {
            if (!snipe) return false;
            return hand.name === `${snipe.rank} ${snipe.type}`;
        }

        // Check if either player "loses" by hitting a sniped hand
        const youLose = handMatchesSnipe(yourHand, youSnipe);
        const oppLose = handMatchesSnipe(oppHand, oppSnipe);

        let winner = null;
        let message = "";
        const potAmount = state.pot;

        if (youLose && oppLose) {
            winner = "tie";
            message = `Both players hit their sniped hand. It's a tie! Pot ($${potAmount}) is split.`;
            addHistoryEntry(message);
            state.yourChips += Math.floor(state.pot / 2);
            state.oppChips += Math.ceil(state.pot / 2);
        } else if (youLose) {
            winner = "opp";
            message = `You hit your sniped hand and lose! Opponent wins the pot ($${potAmount})!`;
            addHistoryEntry(message);
            state.oppChips += state.pot;
        } else if (oppLose) {
            winner = "you";
            message = `Opponent hit their sniped hand and loses! You win the pot ($${potAmount})!`;
            addHistoryEntry(message);
            state.yourChips += state.pot;
        } else {
            // Normal hand comparison
            if (yourHand.value > oppHand.value) {
                winner = "you";
                message = `You win the pot ($${potAmount})!`;
                addHistoryEntry(message);
                state.yourChips += state.pot;
            } else if (yourHand.value < oppHand.value) {
                winner = "opp";
                message = `Opponent wins the pot ($${potAmount})!`;
                addHistoryEntry(message);
                state.oppChips += state.pot;
            } else {
                // Same hand type, compare high card (name string)
                if (yourHand.name > oppHand.name) {
                    winner = "you";
                    message = `You win the pot ($${potAmount})!`;
                    addHistoryEntry(message);
                    state.yourChips += state.pot;
                } else if (yourHand.name < oppHand.name) {
                    winner = "opp";
                    message = `Opponent wins the pot ($${potAmount})!`;
                    addHistoryEntry(message);
                    state.oppChips += state.pot;
                } else {
                    winner = "tie";
                    message = `It's a tie! Pot ($${potAmount}) is split.`;
                    addHistoryEntry(message);
                    state.yourChips += Math.floor(state.pot / 2);
                    state.oppChips += Math.ceil(state.pot / 2);
                }
            }
        }

        state.pot = 0;
        updateUI();
        setTimeout(() => {
            window.alert(message);
            addHistoryEntry("New Round");
            // Reshuffle and redeal for new round
            postBlinds();
            startRound();
            updateUI();
        }, 100);
    }
}

function parseSnipe(snipe) {
    if (!snipe) return null;
    const idx = snipe.indexOf(' ');
    return { rank: snipe.slice(0, idx), type: snipe.slice(idx + 1) };
}
