const fs = require('fs');
const _ = require('lodash');
const uuid = require('uuid4');
const gameUtils = require('./game-utils');
const utils = require('./utils');

const logger = utils.getLogger({});

let DATA_FILE_PATH = __dirname + '/game.json';
class SequenceServer {
    constructor(dbClient) {
        this.dbClient = dbClient;
        if (fs.existsSync(DATA_FILE_PATH)) {
            const { players, games } = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
            this.games = games; //_.mapValues(games, game => Game.fromCopy(game));
            this.players = players; //_.mapValues(players, p => Player.fromCopy(p));
        } else {
            this.games = {};
            this.players = {};
        }
        this.sockets = {};
        this.playerSockets = {};
    }
    start(io) {
        this.io = io;
        io.on('connection', socket => this.connectPlayer(socket));
    }
    connectPlayer(socket) {
        try {
            const handlers = {
                login: this.loginUser,
                join: this.joinGame,
                start: this.startGame,
                create: this.createGame,
                disconnect: this.disconnect,
                play: this.playMove,
            };
            for (const key in handlers) {
                socket.on(key, data => {
                    try {
                        handlers[key].apply(this, [socket, data]);
                    } catch (e) {
                        console.error(`Error processing event: ${key}`, e);
                        socket.emit('error', { err: e });
                    } finally {
                        this.flushState();
                    }
                });
            }
            let socketId = socket.id;
            const { playerId, userName, gameId } = socket.handshake.query;
            logger.info(`A user: ${playerId} connected on socket: ${socketId}`);
            this.sockets[socketId] = socket;
            if (!playerId) {
                throw `User id not specified`;
            }
            this.loginUser(socket, { user: { id: playerId, name: userName } });
            // if (!gameId) {
            //     throw `Game id not specified`;
            // }
            // if (!this.games[gameId]) {
            //     throw `Invalid game`;
            // }
            if (this.games[gameId]) {
                gameUtils.rejoin(this.games[gameId], playerId, socket);
            }
        } catch (err) {
            logger.info(err);
            socket.emit('error', { err });
        } finally {
            this.flushState();
        }
        //socket.emit('checkLogin');
    }

    flushState() {
        let mappedGames = _.mapValues(this.games, g => ({
            ..._.omit(g, ['players', 'logger']),
            players: g.players.map(p => _.omit(p, 'socket', 'logger')),
        }));
        fs.writeFileSync(
            __dirname + '/game.json',
            JSON.stringify(
                {
                    games: mappedGames,
                    players: this.players,
                },
                null,
                2
            )
        );
    }

    playMove(socket, params = {}) {
        let currentGame = this.games[socket.gameId];
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.play(currentGame, { ...params, playerId: socket.playerId });
    }

    disconnect(socket) {
        const player = this.players[socket.playerId];
        if (player) {
            _.remove(this.playerSockets[socket.playerId], x => x.id === socket.id);
            // player.disconnect(socket);
            const game = this.games[socket.gameId];
            if (game) {
                gameUtils.leave(game, player.id);
            }
        }
        logger.info(`Socket ${socket.id} disconnected`);
        delete this.sockets[socket.id];
    }

    loginUser(socket, { user: { id: playerId, name: userName } } = {}) {
        if (!playerId) {
            console.error(`Something wrong. Bailing out!`);
            return;
        }
        logger.info(`Assigning ${socket.id} to ${playerId}`);
        socket.playerId = playerId;
        if (!this.players[playerId]) {
            this.players[playerId] = { id: playerId, name: userName, games: [] };
        }
        this.playerSockets[playerId] = this.playerSockets[playerId] || [];
        this.playerSockets[playerId].push(socket);
        // this.players[playerId].connect(socket);
        // fs.writeFileSync(__dirname + '/game.json', JSON.stringify({ games: this.games, players: this.players }));
    }
    logoutUser(socket, { user } = {}) {}
    createGame(socket, { game, forceCreate }) {
        const gameId = game.id || uuid();
        if (this.games[gameId] && !forceCreate) {
            throw `Game with ${gameId} already exists`;
        }
        let gameObj = { ...game, id: gameId };
        this.games[gameId] = gameUtils.newGame(gameObj);
        logger.info({ game: gameObj }, `Created`);
        // this.io.emit(utils.MSG_HEADERS.NEW_GAME, { game: gameObj });
        // fs.writeFileSync(__dirname + '/game.json', JSON.stringify({ games: this.games, players: this.players }));
    }
    joinGame(socket, { gameId, playerId, position }) {
        let playerCached = this.players[playerId];
        // if (!this.playerSockets[playerId]) {
        //     throw `Player is not connected`;
        // }
        if (!playerCached) {
            throw `Player not found.`;
        }
        if (socket.playerId !== playerId) {
            // throw `Socket ${socket.id} not owned by ${playerId}`;
        }
        let currentGame = this.games[gameId];
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.join(currentGame, playerCached, position, socket);
        // this.io.in(gameId).emit('playerJoined', { player: _.omit(playerCached, 'sockets') });
    }
    startGame(socket, { gameId }) {
        let currentGame = this.games[gameId];
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.start(currentGame, socket.playerId);
        // fs.writeFileSync(__dirname + '/game.json', JSON.stringify({ games, players }));
    }
    leaveGame(socket, { playerId, gameId }) {
        let currentGame = this.games[gameId];
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.leave(currentGame, playerId);
    }
    endGame() {}
    heartBeat() {}
}

module.exports = { SequenceServer };
