const _ = require('lodash');
const sampleGame = require('./test-data/sample-game');
const gameUtils = require('./game-utils');
describe('game tests', () => {
    it('test play', () => {
        const socket1 = { emit: jest.fn() };
        const socket2 = { emit: jest.fn() };
        const game = _.cloneDeep(sampleGame);
        gameUtils.rejoin(game, 1, socket1);
        gameUtils.rejoin(game, 2, socket2);
        expect(() => gameUtils.play(game, { playerId: 1, position: '8-8', cardIndex: '5D' })).toThrow(
            'Incorrect coin placed at 8-8 for index 5D where it should be 3H'
        );
        expect(() => gameUtils.play(game, { playerId: 2, position: '8-9', cardIndex: '5H' })).toThrow(
            'Not players turn. Current turn to play is 0'
        );
        expect(() => gameUtils.play(game, { playerId: 1, position: '8-9', cardIndex: '4H' })).toThrow(
            'Player does not have the card'
        );
        gameUtils.play(game, { playerId: 1, position: '8-9', cardIndex: '5D' });
        expect(() => gameUtils.play(game, { playerId: 1, position: '1-8', cardIndex: '0H' })).toThrow(
            'Not players turn. Current turn to play is 1'
        );
        gameUtils.play(game, { playerId: 2, position: '0-8', cardIndex: '9S' });
        const socket1Calls = socket1.emit.mock.calls;
        expect(socket1Calls[3]).toEqual([
            'coinAction',
            {
                board: {
                    cardsLocked: {},
                    selectedByIndex: {
                        '5D': 1,
                    },
                    selectedPositions: {
                        '0-0': '*',
                        '0-9': '*',
                        '8-9': 0,
                        '9-0': '*',
                        '9-9': '*',
                    },
                    teamSequences: {},
                },
                history: [
                    {
                        additionalParams: {
                            cardIndex: '5D',
                            playerId: 1,
                            position: '8-9',
                        },
                        msg: 'coinAction',
                        payload: {
                            turn: 1,
                        },
                    },
                ],
                turn: 1,
            },
        ]);
        expect(socket1Calls[4]).toEqual([
            'playConfirm',
            {
                hand: ['KH', '6S', '9H', 'JC', '8H', '0H', '3H'],
            },
        ]);
        const socket2Calls = socket2.emit.mock.calls;
        expect(socket2Calls[2]).toEqual([
            'coinAction',
            {
                board: {
                    cardsLocked: {},
                    selectedByIndex: {
                        '5D': 1,
                    },
                    selectedPositions: {
                        '0-0': '*',
                        '0-9': '*',
                        '8-9': 0,
                        '9-0': '*',
                        '9-9': '*',
                    },
                    teamSequences: {},
                },
                history: [
                    {
                        additionalParams: {
                            cardIndex: '5D',
                            playerId: 1,
                            position: '8-9',
                        },
                        msg: 'coinAction',
                        payload: {
                            turn: 1,
                        },
                    },
                ],
                turn: 1,
            },
        ]);
        expect(socket2Calls[3]).toEqual([
            'coinAction',
            {
                board: {
                    cardsLocked: {},
                    selectedByIndex: {
                        '5D': 1,
                        '9S': 1,
                    },
                    selectedPositions: {
                        '0-0': '*',
                        '0-9': '*',
                        '8-9': 0,
                        '0-8': 1,
                        '9-0': '*',
                        '9-9': '*',
                    },
                    teamSequences: {},
                },
                history: [
                    {
                        additionalParams: {
                            cardIndex: '5D',
                            playerId: 1,
                            position: '8-9',
                        },
                        msg: 'coinAction',
                        payload: {
                            turn: 1,
                        },
                    },
                    {
                        additionalParams: {
                            cardIndex: '9S',
                            playerId: 2,
                            position: '0-8',
                        },
                        msg: 'coinAction',
                        payload: {
                            turn: 0,
                        },
                    },
                ],
                turn: 0,
            },
        ]);
    });
    it('test setup', () => {
        const socket1 = { emit: jest.fn() };
        const socket2 = { emit: jest.fn() };
        const socket3 = { emit: jest.fn() };
        const game = gameUtils.newGame({ id: 1, numPlayers: 2, adminUser: 'user1', numTeams: 2 });
        gameUtils.join(game, { id: 1 }, 0, socket1);
        gameUtils.join(game, { id: 2 }, 1, socket2);
        gameUtils.start(game, 1);
        gameUtils.leave(game, 1);
        gameUtils.rejoin(game, 1, socket3);
        expect(game.deckPosition).toEqual(14);
        expect(game.players[0].hand.length).toEqual(7);
        expect(game.players[1].hand.length).toEqual(7);
        expect(game.board).toEqual({
            selectedPositions: {
                '0-0': '*',
                '9-0': '*',
                '0-9': '*',
                '9-9': '*',
            },
            selectedByIndex: {},
            teamSequences: {},
            cardsLocked: {},
        });
        const socket1Calls = socket1.emit.mock.calls;
        const player1Hand = socket1Calls[2][1].hand;
        expect(socket1Calls.length).toEqual(3);
        expect(socket1Calls[0]).toEqual([
            'playerJoined',
            {
                history: [],
                players: [{ inactive: false, name: undefined, playerId: 1, team: 0 }],
                turn: 0,
            },
        ]);
        expect(socket1Calls[1]).toEqual([
            'playerJoined',
            {
                history: [],
                players: [
                    { inactive: false, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        expect(socket1Calls[2]).toEqual([
            'start',
            {
                history: [],
                board: {
                    selectedPositions: {
                        '0-0': '*',
                        '9-0': '*',
                        '0-9': '*',
                        '9-9': '*',
                    },
                    selectedByIndex: {},
                    teamSequences: {},
                    cardsLocked: {},
                },
                hand: expect.toBeArrayOfSize(7),
                players: [
                    { inactive: false, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        const socket2Calls = socket2.emit.mock.calls;
        expect(socket2Calls.length).toEqual(4);
        expect(socket2Calls[0]).toEqual([
            'playerJoined',
            {
                history: [],
                players: [
                    { inactive: false, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        expect(socket2Calls[1]).toEqual([
            'start',
            {
                history: [],
                board: {
                    selectedPositions: {
                        '0-0': '*',
                        '9-0': '*',
                        '0-9': '*',
                        '9-9': '*',
                    },
                    selectedByIndex: {},
                    teamSequences: {},
                    cardsLocked: {},
                },
                hand: expect.toBeArrayOfSize(7),
                players: [
                    { inactive: false, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        expect(socket2Calls[2]).toEqual([
            'playerInactive',
            {
                history: [],
                players: [
                    { inactive: true, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        expect(socket2Calls[3]).toEqual([
            'playerRejoined',
            {
                history: [],
                players: [
                    { inactive: false, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        const socket3Calls = socket3.emit.mock.calls;
        expect(socket3Calls.length).toEqual(2);
        expect(socket3Calls[0]).toEqual([
            'playerRejoined',
            {
                history: [],
                players: [
                    { inactive: false, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        expect(socket3Calls[1]).toEqual([
            'player_reconnected',
            {
                history: [],
                board: {
                    selectedPositions: {
                        '0-0': '*',
                        '9-0': '*',
                        '0-9': '*',
                        '9-9': '*',
                    },
                    selectedByIndex: {},
                    teamSequences: {},
                    cardsLocked: {},
                },
                hand: expect.arrayContaining(player1Hand),
                players: [
                    { inactive: false, name: undefined, playerId: 1, team: 0 },
                    { inactive: false, name: undefined, playerId: 2, team: 1 },
                ],
                turn: 0,
            },
        ]);
        console.log(JSON.stringify(game));
    });
});
