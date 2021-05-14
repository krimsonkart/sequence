const fs = require('fs');
const _ = require('lodash');
const uuid = require('uuid4');
const gameUtils = require('./game-utils');
const utils = require('./utils');
const dynamo = require('../utils/dynamodb');

const logger = utils.getLogger({});

let DATA_FILE_PATH = __dirname + '/game.json';
let TableName = 'sequence_games';

class SequenceServer {
    constructor(dbClient) {
        this.dbClient = dbClient;
        if (fs.existsSync(DATA_FILE_PATH)) {
            // const { players, games } = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
            // this.games = games; //_.mapValues(games, game => Game.fromCopy(game));
            // this.players = players; //_.mapValues(players, p => Player.fromCopy(p));
        } else {
            // this.games = {};
            // this.players = {};
        }
        this.sockets = {};
        this.playerSockets = {};
    }
    async start(io) {
        this.games = {};
        await dynamo.queryAllRecords(
            {
                TableName,
                Select: 'ALL_ATTRIBUTES',
                KeyConditionExpression: 'pk=:pk',
                ExpressionAttributeValues: {
                    ':pk': `game_state`,
                },
            },
            entry => (this.games[entry.sk] = entry)
        );
        this.io = io;
        io.on('connection', socket => this.connectPlayer(socket));
    }
    async connectPlayer(socket) {
        try {
            const handlers = {
                login: { handler: this.loginUser },
                join: { handler: this.joinGame, persist: true },
                start: { handler: this.startGame, persist: true },
                play: { handler: this.playMove, persist: true },
                disconnect: { handler: this.disconnect, persist: false },
            };
            for (const key in handlers) {
                socket.on(key, async data => {
                    try {
                        handlers[key].handler.apply(this, [socket, data]);
                    } catch (e) {
                        console.error(`Error processing event: ${key}`, e);
                        socket.emit('error', { err: e });
                    } finally {
                        this.flushState();
                        if (socket.gameId && handlers[key].persist) {
                            await this.persistState(socket.gameId);
                        }
                    }
                });
            }
            let socketId = socket.id;
            const { playerId, userName, gameId } = socket.handshake.query;
            logger.info(`A user: ${playerId} connected on socket: ${socketId}`);
            this.sockets[socketId] = socket;
            // this.playerSockets[playerId] =
            if (!playerId) {
                throw `User not specified`;
            }
            this.loginUser(socket, { user: { playerId, userName } });
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
            // if (socket.gameId) {
            //     await this.persistState(socket.gameId);
            // }
        }
        //socket.emit('checkLogin');
    }

    mapGameState(g) {
        return {
            ..._.omit(g, ['players', 'logger']),
            players: g.players.map(p => _.omit(p, 'socket', 'logger')),
        };
    }

    flushState() {
        let mappedGames = _.mapValues(this.games, this.mapGameState);
        fs.writeFileSync(
            __dirname + '/game.json',
            JSON.stringify(
                {
                    games: mappedGames,
                    // players: this.players,
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

    getGame(gameId) {
        let game = this.games[gameId];
        if (!game) {
            throw 'Game not found';
        }
        return gameUtils.getGameDetails(game);
    }

    listGames() {
        return _.values(this.games).map(game => gameUtils.getGameDetails(gameUtils.getGameDetails(game)));
    }

    disconnect(socket) {
        if (socket.playerId) {
            _.remove(this.playerSockets[socket.playerId], x => x.id === socket.id);
            // player.disconnect(socket);
            const game = this.games[socket.gameId];
            if (game) {
                gameUtils.leave(game, socket.playerId);
            }
        }
        logger.info(`Socket ${socket.id} disconnected`);
        delete this.sockets[socket.id];
    }

    loginUser(socket, { user: { playerId, userName } } = {}) {
        if (!playerId) {
            console.error(`Something wrong. Bailing out!`);
            return;
        }
        logger.info(`Assigning ${socket.id} to ${playerId}`);
        socket.playerId = playerId;
        // if (!this.players[playerId]) {
        //     this.players[playerId] = { id: playerId, name: userName, games: [] };
        // }
        this.playerSockets[playerId] = this.playerSockets[playerId] || [];
        this.playerSockets[playerId].push(socket);
        // this.players[playerId].connect(socket);
        // fs.writeFileSync(__dirname + '/game.json', JSON.stringify({ games: this.games, players: this.players }));
    }
    logoutUser(socket, { user } = {}) {}
    async createGame({ game, forceCreate }) {
        const gameId = game.id || this.getUniqueGameId();
        if (this.games[gameId] && !forceCreate) {
            throw `Game with ${gameId} already exists`;
        }
        let gameObj = { ...game, id: gameId };
        this.games[gameId] = gameUtils.newGame(gameObj);
        await this.updateStatus(gameId);
        await this.persistState(gameId);
        logger.info({ game: gameObj }, `Created`);
        return { gameId };
        // this.io.emit(utils.MSG_HEADERS.NEW_GAME, { game: gameObj });
        // fs.writeFileSync(__dirname + '/game.json', JSON.stringify({ games: this.games, players: this.players }));
    }

    async updateStatus(gameId) {
        await dynamo.persistDbEntry({
            TableName,
            Item: { pk: 'games', sk: gameId, ..._.pick(this.games[gameId], ['numPlayers', 'numTeams', 'name']) },
        });
    }

    async persistState(gameId) {
        logger.debug({ gameId }, `Persisting state`);
        let game = this.games[gameId];
        let moveGame = false;
        if (game.pk === 'game_state' && game.state === gameUtils.GAME_STATES.COMPLETE) {
            moveGame = true;
            game.pk = 'game_state#complete';
        }
        await dynamo.persistDbEntry({
            TableName,
            Item: this.mapGameState(game),
        });
        if (moveGame) {
            await dynamo.deleteDbEntry({ TableName, Key: { pk: 'game_state', sk: game.sk } });
        }
    }

    getUniqueGameId() {
        let unique = uuid().split('-')[0];
        if (this.games[unique]) {
            return this.getUniqueGameId();
        }
        return unique;
    }

    joinGame(socket, { gameId, playerId, playerName, position }) {
        // let playerCached = this.players[playerId];
        // if (!this.playerSockets[playerId]) {
        //     throw `Player is not connected`;
        // }
        // if (!playerCached) {
        //     throw `Player not found.`;
        // }
        if (socket.playerId !== playerId) {
            // throw `Socket ${socket.id} not owned by ${playerId}`;
        }
        let currentGame = this.games[gameId];
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.join(
            currentGame,
            { id: playerId, name: playerName },
            position,
            socket.playerId === playerId ? socket : null
        );
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
