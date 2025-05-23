export function getHandRank(cards) {
    // cards: array of {rank, suit}
    // Returns: {name: string, value: number}
    const RANK_ORDER = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    const HANDS = [
        "High Card", "One Pair", "Two Pair", "Three of a Kind", "Straight",
        "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"
    ];

    // Remove suit info for all cards
    const cardsNoSuit = cards.map(c => ({ rank: c.rank }));

    // Helper: get all k-card combinations (k <= cards.length, k >= 1)
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

    // Helper: check if cards form a straight (must be 5 cards)
    function isStraight(cards) {
        if (cards.length !== 5) return false;
        let values = cards.map(c => RANK_ORDER[c.rank]).sort((a,b) => a-b);
        // Remove duplicates
        values = [...new Set(values)];
        if (values.length !== 5) return false;
        // Handle wheel (A-2-3-4-5)
        if (values[4] === 14 && values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5) {
            return true;
        }
        for (let i = 0; i < 4; i++) {
            if (values[i+1] - values[i] !== 1) return false;
        }
        return true;
    }

    // Ignore suit for flush and straight flush detection
    function isFlush(cards) {
        return false;
    }

    function getCounts(cards) {
        let counts = {};
        for (let c of cards) {
            counts[c.rank] = (counts[c.rank] || 0) + 1;
        }
        return Object.values(counts).sort((a,b) => b-a);
    }

    // Evaluate all possible hands (from 1 up to 5 cards), return best
    let best = {name: "High Card", value: 0, high: null};
    let maxK = Math.min(5, cardsNoSuit.length);
    for (let k = 1; k <= maxK; k++) {
        let combos = getCombinations(cardsNoSuit, k);
        for (let hand of combos) {
            let flush = false; // ignore flush
            let straight = isStraight(hand);
            let values = hand.map(c => RANK_ORDER[c.rank]).sort((a,b) => b-a);
            let counts = getCounts(hand);
            // Build a map of rank values to their counts
            let rankCounts = {};
            hand.forEach(c => {
                let v = RANK_ORDER[c.rank];
                rankCounts[v] = (rankCounts[v] || 0) + 1;
            });
            let uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);

            if (hand.length === 5 && straight && flush && values[0] === 14 && values[1] === 13) {
                if (best.value < 9) best = {name: "Royal Flush", value: 9, high: 14};
            } else if (hand.length === 5 && straight && flush) {
                if (best.value < 8 || (best.value === 8 && values[0] > best.high))
                    best = {name: "Straight Flush", value: 8, high: values[0]};
            } else if (counts[0] === 4) {
                // Four of a Kind: high is the rank of the quads
                let quadRank = uniqueRanks.find(r => rankCounts[r] === 4);
                if (best.value < 7 || (best.value === 7 && quadRank > best.high))
                    best = {name: "Four of a Kind", value: 7, high: quadRank};
            } else if (counts[0] === 3 && counts[1] === 2 && hand.length === 5) {
                // Full House: high is the rank of the trips, only if 5 cards
                let tripsRank = uniqueRanks.find(r => rankCounts[r] === 3);
                if (best.value < 6 || (best.value === 6 && tripsRank > best.high))
                    best = {name: "Full House", value: 6, high: tripsRank};
            } else if (flush && hand.length === 5) {
                if (best.value < 5 || (best.value === 5 && values[0] > best.high))
                    best = {name: "Flush", value: 5, high: values[0]};
            } else if (straight && hand.length === 5) {
                if (best.value < 4 || (best.value === 4 && values[0] > best.high))
                    best = {name: "Straight", value: 4, high: values[0]};
            } else if (counts[0] === 3) {
                // Three of a Kind: high is the rank of the trips
                let tripsRank = uniqueRanks.find(r => rankCounts[r] === 3);
                if (best.value < 3 || (best.value === 3 && tripsRank > best.high))
                    best = {name: "Three of a Kind", value: 3, high: tripsRank};
            } else if (counts[0] === 2 && counts[1] === 2) {
                // Two Pair: high is the higher of the two pairs
                let pairRanks = uniqueRanks.filter(r => rankCounts[r] === 2);
                let highPair = pairRanks[0];
                if (best.value < 2 || (best.value === 2 && highPair > best.high))
                    best = {name: "Two Pair", value: 2, high: highPair};
            } else if (counts[0] === 2) {
                // One Pair: high is the rank of the pair
                let pairRank = uniqueRanks.find(r => rankCounts[r] === 2);
                if (best.value < 1 || (best.value === 1 && pairRank > best.high))
                    best = {name: "One Pair", value: 1, high: pairRank};
            } else {
                // High Card: high is the highest card
                if (best.value < 0 || (best.value === 0 && values[0] > best.high))
                    best = {name: "High Card", value: 0, high: values[0]};
            }
        }
    }

    // Map high card value to rank string
    const RANK_NAMES = {2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K',14:'A'};
    let prefix = (typeof best.high === "number" && best.high in RANK_NAMES) ? `${RANK_NAMES[best.high]} ` : '';
    return { name: prefix + best.name, value: best.value };
}
