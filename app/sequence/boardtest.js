const {Board} = require('./board');
const b = new Board()
b.initializeBoard()
// console.log(JSON.stringify(b.board[9][9]))
b.placeCoin('0-1',{index:'2S'},1)
b.placeCoin('0-2',{index:'3S'},1)
b.placeCoin('0-4',{index:'5S'},1)
b.placeCoin('0-5',{index:'6S'},1)
b.placeCoin('0-3',{index:'4S'},1)
// b.placeCoin('0-1',{index:'2S'},1)
b.placeCoin('8-8',{index:'3H'},1)
b.placeCoin('7-7',{index:'KD'},1)
b.placeCoin('6-6',{index:'QH'},1)
b.placeCoin('5-5',{index:'3H'},1)
// b.placeCoin('1-1',{index:'5C'},1)
// b.placeCoin('2-2',{index:'2D'},1)
// b.placeCoin('3-3',{index:'5C'},1)
// b.placeCoin('4-4',{index:'5H'},1)
