const _ = require('lodash');
const GAME_STATES = { CREATED: 'created', IN_PROGRESS: 'inProgress', COMPLETE: 'complete' };
const utils = require('./utils');
const boardUtils = require('./board-utils');

const NUM_CARDS = {
    2: 7,
    3: 6,
    4: 6,
    6: 5,
};
const HISTORY_LEVELS = {
    [utils.MSG_HEADERS.BROADCAST_PLAYER_REJOINED]: 20,
    [utils.MSG_HEADERS.BROADCAST_PLAYER_JOINED]: 20,
    [utils.MSG_HEADERS.BROADCAST_PLACE_COIN]: 40,
    [utils.MSG_HEADERS.BROADCAST_REMOVE_COIN]: 40,
    [utils.MSG_HEADERS.BROADCAST_REPLACE_CARD]: 40,
    [utils.MSG_HEADERS.BROADCAST_PLACE_COIN]: 40,
    [utils.MSG_HEADERS.BROADCAST_COIN_ACTION]: 40,
};
const logger = utils.getLogger({});

const REQUIRED_SEQUENCES = { 3: 1, 2: 2 };

function getPlayersToBroadCast(game) {
    return game.players.map(x => _.pick(x, 'playerId', 'name', 'team', 'inactive'));
}

function notifyPlayer(player, msg, payload) {
    if (player.socket) {
        player.socket.emit(msg, payload);
    }
}
function notifyAll(game, msg, payload, additionalParams, includeUserHistory) {
    game.history.push({ msg, payload: _.omit(payload, 'history', 'board', 'players'), additionalParams });
    if (includeUserHistory) {
        payload = { ...payload, history: getHistoryForUsers(game) };
    }
    for (const player of game.players) {
        if (!player.inactive) {
            notifyPlayer(player, msg, payload);
        }
    }
}
function getStateForPlayer(game, playerId) {
    let player = game.players.find(p => p.playerId === playerId);
    let hand;
    if (player) {
        // game.logger.info({gameId: game.id, playerId }, `Player has not joined the game`);
        // return;
        hand = player.hand;
    }
    return {
        hand: hand,
        turn: game.turn,
        board: _.cloneDeep(game.board),
        history: getHistoryForUsers(game),
        players: getPlayersToBroadCast(game),
    };
}

function getNextCard(game, playerId) {
    let deckElement = game.deck[game.deckPosition];
    deckElement.playerId = playerId;
    game.deckPosition++;
    return deckElement;
}

function getHistoryForUsers(game) {
    return game.history.filter(x => HISTORY_LEVELS[x.msg] >= 30);
}

function leave(game, playerId) {
    const player = game.players.find(p => p.playerId === playerId);
    if (!player) {
        throw `Player not in the game`;
    }
    player.inactive = true;
    logger.info({ gameId: game.id, playerId }, `Player ${playerId} left`);
    notifyAll(
        game,
        utils.MSG_HEADERS.BROADCAST_PLAYER_INACTIVE,
        {
            turn: game.turn,
            players: getPlayersToBroadCast(game),
        },
        {},
        true
    );
}
function rejoin(game, playerId, socket) {
    let player = game.players.find(p => p.playerId === playerId);
    if (!player) {
        logger.info({ gameId: game.id, playerId }, `Player has not joined the game`);
        throw `Player has not joined the game yet`;
    }
    logger.info({ gameId: game.id, playerId }, `Player ${playerId} rejoined on ${socket.id}`);
    player.inactive = false;
    player.socket = socket;
    socket.gameId = game.id;
    notifyAll(
        game,
        utils.MSG_HEADERS.BROADCAST_PLAYER_REJOINED,
        {
            turn: game.turn,
            players: getPlayersToBroadCast(game),
        },
        {},
        true
    );
    notifyPlayer(player, utils.MSG_HEADERS.PLAYER_RECONNECTED, getStateForPlayer(game, player.playerId));
    // game.playerSockets[player.id].join(game.id);
}

function newGamePlayer({ playerId, gameId, name, position, team, socket }) {
    const gamePlayer = {};
    gamePlayer.playerId = playerId;
    gamePlayer.gameId = gameId;
    gamePlayer.name = name;
    gamePlayer.socket = socket;
    gamePlayer.position = position;
    gamePlayer.hand = [];
    gamePlayer.inactive = false;
    gamePlayer.team = team;
    return gamePlayer;
}

function join(game, player, position, socket) {
    if (game.players.find(p => p.playerId === player.id)) {
        throw `Player already joined the game`;
    }
    if (position < 0 || position >= game.numPlayers) {
        throw `Invalid position`;
    }
    // if (game.state !== GAME_STATES.CREATED) {
    //     throw 'Game already started. please join as a user playing the game';
    // }
    let currentPlayer = game.players[position];
    if (!currentPlayer) {
        game.players[position] = newGamePlayer({
            playerId: player.id,
            gameId: game.id,
            name: player.name,
            position,
            team: position % game.numTeams,
            socket,
        });
    } else {
        if (currentPlayer.playerId === player.id) {
            currentPlayer.inactive = false;
            currentPlayer.socket = socket;
            notifyPlayer(currentPlayer, utils.MSG_HEADERS.PLAYER_RECONNECTED, getStateForPlayer(game));
        } else if (!_.get(game.players, [position, 'inactive'])) {
            throw `Position already taken`;
        } else {
            currentPlayer.playerId = player.id;
            currentPlayer.inactive = false;
            currentPlayer.name = player.name;
            currentPlayer.socket = socket;
            notifyPlayer(currentPlayer, utils.MSG_HEADERS.PLAYER_RECONNECTED, getStateForPlayer(game));
        }
    }
    if (socket) {
        socket.gameId = game.id;
    }
    logger.info({ gameId: game.id, playerId: player.id }, `Joined game`);
    playerJoinedGame(player, game.id);
    notifyAll(
        game,
        utils.MSG_HEADERS.BROADCAST_PLAYER_JOINED,
        {
            turn: game.turn,
            players: getPlayersToBroadCast(game),
        },
        {},
        true
    );
    // game.playerSockets[player.id].join(game.id);
}
function playerJoinedGame(player, gameId) {
    player.games = player.games || [];
    player.games.push(gameId);
}
function start(game, playerId) {
    if (game.state !== GAME_STATES.CREATED) {
        throw `Game ${game.id} is not in created state`;
    }
    if (game.players.filter(x => !x.inactive).length !== game.numPlayers) {
        throw `Not enough players`;
    }
    // TODO: Check if player is admin or not
    logger.info({ gameId: game.id }, `${playerId} is starting the game`);
    game.deck = utils.initializeDeckV2();
    // game.board.initializeBoard();
    utils.shuffleDeck(game.deck);
    for (let cardNum = 0; cardNum < game.numCards; cardNum++) {
        for (const player of game.players) {
            player.hand.push(getNextCard(game, player.playerId));
        }
    }
    game.state = GAME_STATES.IN_PROGRESS;
    for (const player of game.players) {
        notifyPlayer(player, utils.MSG_HEADERS.START_GAME, getStateForPlayer(game, player.playerId));
    }
}
function undo(game, playerId) {}
function play(game, { playerId, position, card, action }) {
    if (game.state !== GAME_STATES.IN_PROGRESS) {
        throw `Game is not in progress`;
    }
    const currentPlayer = game.players[game.turn];
    if (currentPlayer.playerId !== playerId) {
        throw `Not players turn. Current turn to play is ${game.turn}`;
    }
    let handPosition = _.findIndex(currentPlayer.hand, x => x === card);
    if (handPosition < 0) {
        throw `Player does not have the card`;
    }
    if (action === 'replace') {
        if (!boardUtils.isDead(game.board, card)) {
            throw `${card} is not a dead card yet`;
        }
    } else {
        //TODO: validate position
        boardUtils.placeCoin(game.board, position, card, currentPlayer.team);
        if (boardUtils.getSequences(game.board, currentPlayer.team) >= REQUIRED_SEQUENCES[game.numTeams]) {
            game.state = GAME_STATES.COMPLETE;
            game.board.winner = currentPlayer.team;
            game.winner = currentPlayer.team;
            notifyAll(game, utils.MSG_HEADERS.BROADCAST_WIN_ACTION, { team: currentPlayer.team });
            // notifyPlayer(currentPlayer, utils.MSG_HEADERS.PLAYER_WIN_ACTION, { team: currentPlayer.team });
        }
        game.turn = (game.turn + 1) % game.numPlayers;
    }
    notifyAll(
        game,
        utils.MSG_HEADERS.BROADCAST_COIN_ACTION,
        {
            turn: game.turn,
            board: _.cloneDeep(game.board),
        },
        { playerId, position, action, cardIndex: card },
        true
    );
    currentPlayer.hand.splice(handPosition, 1);
    const newCard = getNextCard(game, currentPlayer.playerId);
    currentPlayer.hand.push(newCard);
    notifyPlayer(currentPlayer, utils.MSG_HEADERS.PLAY_CONFIRM, {
        hand: currentPlayer.hand,
    });
}
function newGame({ id, numPlayers, name, adminUser, adminUserName, numTeams }) {
    const game = {};
    game.board = boardUtils.newBoard();
    game.id = id;
    game.pk = 'game_state';
    game.sk = id;
    game.name = name;
    game.numPlayers = Number(numPlayers);
    game.numTeams = Number(numTeams);
    game.adminUsers = [adminUser];
    game.adminUserName = adminUserName;
    game.turn = 0;
    game.deckPosition = 0;
    game.state = GAME_STATES.CREATED;
    game.numCards = NUM_CARDS[game.numPlayers];
    game.history = [];
    // Custom objects
    game.players = [];
    return game;
}

function getGameDetails(game) {
    return {
        ..._.pick(game, ['id', 'name', 'turn', 'numPlayers', 'numTeams', 'state', 'numCards', 'board', 'winner', 'adminUserName']),
        players: game.players.map(p => _.pick(p, ['playerId', 'email', 'name'])),
    };
}

module.exports = { newGame, start, play, join, leave, rejoin, getGameDetails, GAME_STATES };
