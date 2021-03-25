const fs = require('fs');
const _ = require('lodash');
const uuid = require('uuid4');
const gameUtils = require('./game-utils');
const dynamodb = require('../utils/dynamodb');
const logger = require('../utils/logger');

let DATA_FILE_PATH = __dirname + '/game.json';

class SequenceServer {
    constructor(dbClient) {
        this.dbClient = dbClient;
        if (fs.existsSync(DATA_FILE_PATH)) {
            const { players, games } = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
            this.games = {};//games; //_.mapValues(games, game => Game.fromCopy(game));
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
    async connectPlayer(socket) {
        try {
            const handlers = {
                // login: this.loginUser,
                join: this.joinGame,
                start: this.startGame,
                disconnect: this.disconnect,
                play: this.playMove,
            };
            for (const key in handlers) {
                socket.on(key, async data => {
                    try {
                        await handlers[key].apply(this, [socket, data]);
                    } catch (err) {
                        console.error(`Error processing event: ${key}`, err);
                        socket.emit('error', { err });
                    } finally {
                        if (socket.gameId) {
                            await this.updateGame(socket.gameId).catch(err=>socket.emit('error', { err }));
                        }
                        this.flushState();
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
            if (!gameId) {
                throw `Game id not specified`;
            }
            let game = await this.getGameState(gameId);
            if (!game) {
                throw `Invalid game`;
            }
            if (game) {
                gameUtils.rejoin(game, playerId, socket);
                await this.updateGame(gameId);
            }
        } catch (err) {
            logger.info(err);
            socket.emit('error', { err });
        } finally {
            this.flushState();
        }
        //socket.emit('checkLogin');
    }

    getGameState(gameId) {
        if(!gameId)return ;
        return this.games[gameId] || this.getGameFromDB(gameId);
    }

    async updateGame(gameId) {
        let game1 = await this.getGameState(gameId);
        if (!game1) {
            throw `Game ${gameId} does not exist`;
        }

        let game = this.getGameStateToPersist(game1);
        let deleteEntry;
        if (game.status === gameUtils.GAME_STATES.COMPLETE && !game.moved) {
            game.pk = gameUtils.SEQUENCE_COMPLETE_PK;
            game.moved = true;
            deleteEntry = true;
        }
        await dynamodb.persistDbEntry(
            {
                TableName: gameUtils.GAMES_TABLE,
                Item: game,
            },
            ``
        );
        if (deleteEntry) {
            await dynamodb.batchDeleteDbEntries(
                [
                    {
                        DeleteRequest: {
                            Key: {
                                pk: 'sequence_games',
                                sk: game.sk,
                            },
                        },
                    },
                ],
                gameUtils.GAMES_TABLE
            );
        }
    }

    async updatePlayer(playerId) {}

    flushState() {
        let mappedGames = _.mapValues(this.games, this.getGameStateToPersist);
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

    getGameStateToPersist(g) {
        return {
            ..._.omit(g, ['players', 'logger']),
            players: g.players.map(p => _.omit(p, 'socket', 'logger')),
        };
    }

    async playMove(socket, params = {}) {
        let currentGame = await this.getGameState(socket.gameId);
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.play(currentGame, { ...params, playerId: socket.playerId });
    }

    async getGame(gameId) {
        let game = await this.getGameState(gameId);
        if (!game) {
            throw 'Game not found';
        }
        return gameUtils.getGameDetails(game);
    }

    async listGames() {
        const games = [];
        await dynamodb.queryAllRecords({
            TableName: gameUtils.GAMES_TABLE,
            KeyConditionExpression: `pk = :pk`,
            ExpressionAttributeValues: {':pk':gameUtils.SEQUENCE_PK},
        },item=>games.push(item))
        return _.values(games).map(game => gameUtils.getGameDetails(gameUtils.getGameDetails(game)));
    }

    async disconnect(socket) {
        const player = this.players[socket.playerId];
        if (player) {
            _.remove(this.playerSockets[socket.playerId], x => x.id === socket.id);
            // player.disconnect(socket);
            let game = await this.getGameState(socket.gameId);
            // const game = this.games[socket.gameId];
            if (game) {
                gameUtils.leave(game, player.id);
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
        if (!this.players[playerId]) {
            this.players[playerId] = { id: playerId, name: userName, games: [] };
        }
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
        logger.info({ game: gameObj }, `Created`);
        await this.updateGame(gameId);
        return { gameId };
        // this.io.emit(utils.MSG_HEADERS.NEW_GAME, { game: gameObj });
        // fs.writeFileSync(__dirname + '/game.json', JSON.stringify({ games: this.games, players: this.players }));
    }

    getUniqueGameId() {
        let unique = uuid().split('-')[0];
        if (this.games[unique]) {
            return this.getUniqueGameId();
        }
        return unique;
    }

    async joinGame(socket, { gameId, playerId, position }) {
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
        let currentGame = await this.getGameState(gameId);
        // let currentGame = this.games[gameId];
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.join(currentGame, playerCached, position, socket.playerId === playerId ? socket : null);
        // this.io.in(gameId).emit('playerJoined', { player: _.omit(playerCached, 'sockets') });
    }
    async startGame(socket, { gameId }) {
        let currentGame = await this.getGameState(socket.gameId);
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.start(currentGame, socket.playerId);
        // fs.writeFileSync(__dirname + '/game.json', JSON.stringify({ games, players }));
    }
    async leaveGame(socket, { playerId, gameId }) {
        let currentGame = await this.getGameState(socket.gameId);
        if (!currentGame) {
            throw 'Game does not exist';
        }
        gameUtils.leave(currentGame, playerId);
    }
    async endGame() {}
    async heartBeat() {}

    async getGameFromDB(gameId) {
        let entry = await dynamodb.querySingle({
            TableName: 'games',
            Select: 'ALL_ATTRIBUTES',
            KeyConditionExpression: 'pk = :pk AND sk = :sk',
            ExpressionAttributeValues: { ':pk': gameUtils.SEQUENCE_PK, ':sk': gameId },
        });
        this.games[gameId]=entry;
        return entry;
    }
}

module.exports = { SequenceServer };
