export function getHandRank(cards) {
    // cards: array of {rank, suit}
    // Returns: {name: string, value: number}
    const RANK_ORDER = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    const HANDS = [
        "High Card", "One Pair", "Two Pair", "Three of a Kind", "Straight",
        "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"
    ];

    // Helper: get all 5-card combinations
    function getCombinations(arr, k) {
        let results = [];
        function comb(path, start) {
            if (path.length === k) {
                results.push(path);
                return;
            }
            for (let i = start; i < arr.length; i++) {
                comb(path.concat([arr[i]]), i + 1);
            }
        }
        comb([], 0);
        return results;
    }

    // Helper: check if cards form a straight (optionally flush)
    function isStraight(cards) {
        let values = cards.map(c => RANK_ORDER[c.rank]).sort((a,b) => a-b);
        // Handle wheel (A-2-3-4-5)
        if (values[4] === 14 && values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5) {
            return true;
        }
        for (let i = 0; i < 4; i++) {
            if (values[i+1] - values[i] !== 1) return false;
        }
        return true;
    }

    function isFlush(cards) {
        return cards.every(c => c.suit === cards[0].suit);
    }

    function getCounts(cards) {
        let counts = {};
        for (let c of cards) {
            counts[c.rank] = (counts[c.rank] || 0) + 1;
        }
        return Object.values(counts).sort((a,b) => b-a);
    }

    // Evaluate all 5-card hands, return best
    let best = {name: "High Card", value: 0};
    let combos = getCombinations(cards, 5);
    for (let hand of combos) {
        let flush = isFlush(hand);
        let straight = isStraight(hand);
        let values = hand.map(c => RANK_ORDER[c.rank]).sort((a,b) => b-a);
        let counts = getCounts(hand);

        if (straight && flush && values[0] === 14 && values[1] === 13) {
            // Royal Flush
            if (best.value < 9) best = {name: HANDS[9], value: 9};
        } else if (straight && flush) {
            // Straight Flush
            if (best.value < 8) best = {name: HANDS[8], value: 8};
        } else if (counts[0] === 4) {
            // Four of a Kind
            if (best.value < 7) best = {name: HANDS[7], value: 7};
        } else if (counts[0] === 3 && counts[1] === 2) {
            // Full House
            if (best.value < 6) best = {name: HANDS[6], value: 6};
        } else if (flush) {
            // Flush
            if (best.value < 5) best = {name: HANDS[5], value: 5};
        } else if (straight) {
            // Straight
            if (best.value < 4) best = {name: HANDS[4], value: 4};
        } else if (counts[0] === 3) {
            // Three of a Kind
            if (best.value < 3) best = {name: HANDS[3], value: 3};
        } else if (counts[0] === 2 && counts[1] === 2) {
            // Two Pair
            if (best.value < 2) best = {name: HANDS[2], value: 2};
        } else if (counts[0] === 2) {
            // One Pair
            if (best.value < 1) best = {name: HANDS[1], value: 1};
        }
    }
    return best;
}
