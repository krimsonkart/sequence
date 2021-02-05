const boardUtils = require('./board-utils');
describe('board tests', () => {
    it('test place coin', () => {
        const board = boardUtils.newBoard();
        boardUtils.placeCoin(board, '1-1', '5C', 1);
        boardUtils.placeCoin(board, '2-2', '2D', 1);
        boardUtils.placeCoin(board, '3-3', '5C', 1);
        boardUtils.placeCoin(board, '3-3', 'JH', 2);
        boardUtils.placeCoin(board, '3-3', '5C', 1);
        boardUtils.placeCoin(board, '4-4', '5H', 1);
        expect(board.teamSequences).toEqual({ 1: [['4-4', '3-3', '2-2', '1-1', '0-0']] });
        expect(board.cardsLocked).toEqual({ '4-4': 1, '3-3': 1, '2-2': 1, '1-1': 1, '0-0': 1 });
        boardUtils.placeCoin(board, '5-5', '3H', 1);
        boardUtils.placeCoin(board, '6-6', 'QH', 1);
        boardUtils.placeCoin(board, '7-7', 'KD', 1);
        boardUtils.placeCoin(board, '8-8', '3H', 1);
        expect(board.teamSequences).toEqual({
            1: [['8-8', '7-7', '6-6', '5-5', '4-4'], ['4-4', '3-3', '2-2', '1-1', '0-0', '9-9']],
        });
        console.log(JSON.stringify(board));
    });
    it('test place coin 2', () => {
        const board = boardUtils.newBoard();
        boardUtils.placeCoin(board, '1-1', '5C', 1);
        boardUtils.placeCoin(board, '1-2', '4C', 1);
        boardUtils.placeCoin(board, '1-3', '3C', 1);
        boardUtils.placeCoin(board, '1-4', '2C', 1);
        boardUtils.placeCoin(board, '1-6', 'KH', 1);
        boardUtils.placeCoin(board, '1-5', 'AH', 1);
        expect(board.teamSequences).toEqual({ 1: [['1-5', '1-4', '1-3', '1-2', '1-1', '1-6']] });
        expect(board.cardsLocked).toEqual({ '1-5': 1, '1-4': 1, '1-3': 1, '1-2': 1, '1-1': 1, '1-6': 1 });
        boardUtils.placeCoin(board, '1-7', 'QH', 1);
        expect(board.teamSequences).toEqual({ 1: [['1-5', '1-4', '1-3', '1-2', '1-1', '1-6']] });
        boardUtils.placeCoin(board, '1-8', '0H', 1);
        expect(board.teamSequences).toEqual({ 1: [['1-5', '1-4', '1-3', '1-2', '1-1', '1-6']] });
        // boardUtils.placeCoin(board, '1-0', '6C', 1);
        boardUtils.placeCoin(board, '1-9', '0S', 1);
        expect(board.teamSequences).toEqual({
            1: [['1-9', '1-8', '1-7', '1-6', '1-5'], ['1-5', '1-4', '1-3', '1-2', '1-1']],
        });
        // expect(board.teamSequences).toEqual({
        //     1: [['4-4', '3-3', '2-2', '1-1', '0-0'], ['8-8', '7-7', '6-6', '5-5', '4-4']],
        // });
        console.log(JSON.stringify(board));
    });
    it('test place coin 3', () => {
        const board = boardUtils.newBoard();
        boardUtils.placeCoin(board, '1-4', '2C', 1);
        boardUtils.placeCoin(board, '1-3', '3C', 1);
        boardUtils.placeCoin(board, '1-2', '4C', 1);
        boardUtils.placeCoin(board, '1-1', '5C', 1);
        boardUtils.placeCoin(board, '1-0', '6C', 1);
        expect(board.teamSequences).toEqual({ 1: [['1-0', '1-1', '1-2', '1-3', '1-4']] });
    });
    it('test place coin 4', () => {
        const board = boardUtils.newBoard();
        boardUtils.placeCoin(board, '1-4', '2C', 1);
        boardUtils.placeCoin(board, '2-5', '5D', 1);
        boardUtils.placeCoin(board, '3-6', '2C', 1);
        boardUtils.placeCoin(board, '4-7', '9D', 1);
        boardUtils.placeCoin(board, '5-8', '6H', 1);
        expect(board.teamSequences).toEqual({ 1: [['5-8', '4-7', '3-6', '2-5', '1-4']] });
    });
    it('test place coin 5', () => {
        const board = boardUtils.newBoard();
        boardUtils.placeCoin(board, '5-8', '6H', 1);
        boardUtils.placeCoin(board, '4-7', '9D', 1);
        boardUtils.placeCoin(board, '3-6', '2C', 1);
        boardUtils.placeCoin(board, '2-5', '5D', 1);
        boardUtils.placeCoin(board, '1-4', '2C', 1);
        expect(board.teamSequences).toEqual({ 1: [['1-4', '2-5', '3-6', '4-7', '5-8']] });
    });
    it('test place coin 6', () => {
        const board = boardUtils.newBoard();
        boardUtils.placeCoin(board, '1-0', '6C', 1);
        boardUtils.placeCoin(board, '1-1', '5C', 1);
        boardUtils.placeCoin(board, '1-2', '4C', 1);
        boardUtils.placeCoin(board, '1-3', '3C', 1);
        boardUtils.placeCoin(board, '1-4', '2C', 1);
        expect(board.teamSequences).toEqual({ 1: [['1-4', '1-3', '1-2', '1-1', '1-0']] });
        boardUtils.placeCoin(board, '1-5', 'AH', 2);
        boardUtils.placeCoin(board, '1-7', 'QH', 2);
        boardUtils.placeCoin(board, '1-8', '0H', 2);
        boardUtils.placeCoin(board, '1-9', '0S', 2);
        expect(board.teamSequences).toEqual({ 1: [['1-4', '1-3', '1-2', '1-1', '1-0']] });
        boardUtils.placeCoin(board, '1-6', 'KH', 2);
        expect(board.teamSequences).toEqual({
            1: [['1-4', '1-3', '1-2', '1-1', '1-0']],
            2: [['1-6', '1-5', '1-7', '1-8', '1-9']],
        });
        console.log(JSON.stringify(board));
    });
});
