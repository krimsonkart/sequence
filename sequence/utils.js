const _ = require('lodash');
const { createLogger } = require('bunyan');
const SINGLE_EYED_JACKS = ['JS', 'JH'];
const DOUBLE_EYED_JACKS = ['JD', 'JC'];

const MSG_HEADERS = {
    NEW_GAME: 'gameCreated',
    PLAY_CONFIRM: 'playConfirm',
    PLAYER_RECONNECTED: 'player_reconnected',
    START_GAME: 'start',
    PLAYER_INACTIVE: 'playerInactive',
    LOGGED_IN: 'userLoggedIn',
    CHAT_MESSAGE: 'newChatMessage',
    BROADCAST_PLAYER_INACTIVE: 'playerInactive',
    BROADCAST_PLAYER_JOINED: 'playerJoined',
    BROADCAST_PLAYER_REJOINED: 'playerRejoined',
    BROADCAST_PLAYER_DROPPED: 'playerDropped',
    BROADCAST_COIN_ACTION: 'coinAction',
    BROADCAST_WIN_ACTION: 'broadcastWin',
    PLAYER_WIN_ACTION: 'playerWin',
    BROADCAST_PLACE_COIN: 'placeCoin',
    BROADCAST_REMOVE_COIN: 'removeCoin',
    BROADCAST_REPLACE_CARD: 'replaceCard',
};

function getLogger(params = {}) {
    const logger = createLogger({
        name: 'GameLogger',
        streams: [
            {
                stream: process.stdout,
                level: process.env.LOG_LEVEL || 'debug', // Defaults to debug, on production set to info
            },
        ],
    });
    return logger.child(params, true);
}

function isDoubleEyedJack(cardIndex) {
    return DOUBLE_EYED_JACKS.includes(cardIndex);
}
function isSingleEyedJack(cardIndex) {
    return SINGLE_EYED_JACKS.includes(cardIndex);
}
function initializeDeck() {
    const deck = [];
    let suits = ['S', 'D', 'C', 'H'];
    let values = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A'];
    for (let i = 0; i < 2; i++) {
        for (let s = 0; s < suits.length; s++) {
            for (let v = 0; v < values.length; v++) {
                const card = {};
                card['value'] = values[v];
                card['suit'] = suits[s];
                card['index'] = `${values[v]}${suits[s]}`;
                card['index'] === 'AD' ? (card['image'] = 'aceDiamonds.png') : (card['image'] = card['index'] + '.png');
                // Put the card object in the deck.
                deck.push(card);
            }
        }
    }
    return deck;
}
function initializeDeckV2() {
    const deck = [];
    let suits = ['S', 'D', 'C', 'H'];
    let values = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A'];
    for (let i = 0; i < 2; i++) {
        for (let s = 0; s < suits.length; s++) {
            for (let v = 0; v < values.length; v++) {
                deck.push(`${values[v]}${suits[s]}`);
            }
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    let m = deck.length,
        t,
        i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = deck[m];
        deck[m] = deck[i];
        deck[i] = t;
    }
    console.log('Fisher-Yates shuffle');
}

module.exports = { initializeDeck, initializeDeckV2, shuffleDeck, isSingleEyedJack, isDoubleEyedJack, MSG_HEADERS, getLogger };
