const _ = require('lodash');
const utils = require('./utils');
const logger = utils.getLogger({});
const cardsByPosition = {};
const globalBoard = [];
function initializeBoard() {
    for (let i = 0; i < 10; i++) {
        globalBoard[i] = [];
    }
    let suits = ['S', 'D', 'C', 'H'];
    let suiteNumbers = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'K', 'A'];
    let values = {
        S: suiteNumbers,
        D: suiteNumbers,
        C: [...suiteNumbers].reverse(),
        H: [...suiteNumbers].reverse(),
    };
    let sIndex = 0;
    let vIndex = 0;
    let rIndex = 0;
    let cIndex = 1;
    let direction = 0;
    let loop = 0;
    _.set(globalBoard, [0, 0], '*');
    _.set(globalBoard, [9, 9], '*');
    _.set(globalBoard, [0, 9], '*');
    _.set(globalBoard, [9, 0], '*');
    for (let i = 0; i < 100; i++) {
        if (!globalBoard[rIndex][cIndex]) {
            let s = suits[sIndex];
            let v = values[s][vIndex];
            if (vIndex === 11) {
                sIndex = (sIndex + 1) % 4;
            }
            vIndex = (vIndex + 1) % 12;
            _.set(globalBoard, [rIndex, cIndex], `${v}${s}`);
            _.set(cardsByPosition, `${rIndex}-${cIndex}`, `${v}${s}`);
        }
        switch (direction) {
            case 0:
                if (cIndex === 9 - loop) {
                    rIndex++;
                    direction++;
                } else {
                    cIndex++;
                }
                break;
            case 1:
                if (rIndex === 9 - loop) {
                    direction++;
                    cIndex--;
                } else {
                    rIndex++;
                }
                break;
            case 2:
                if (cIndex === loop) {
                    rIndex--;
                    direction++;
                    loop++;
                } else {
                    cIndex--;
                }
                break;
            case 3:
                if (rIndex === loop) {
                    cIndex++;
                    direction = 0;
                } else {
                    rIndex--;
                }
                break;
        }
    }
}
initializeBoard();

function checkSequence(board, position, team) {
    let length = 1;
    let sequence = [position];
    const [rIndex, cIndex] = position.split('-').map(x => Number(x));
    for (let i = rIndex - 1; i >= 0; i--) {
        if (['*', team].includes(board.selectedPositions[`${i}-${cIndex}`])) {
            sequence.push(`${i}-${cIndex}`);
            length++;
        } else {
            break;
        }
    }
    for (let i = rIndex + 1; i < 10; i++) {
        if (['*', team].includes(board.selectedPositions[`${i}-${cIndex}`])) {
            sequence.push(`${i}-${cIndex}`);
            length++;
        } else {
            break;
        }
    }
    sequenceFound(board, length, team, sequence);
    sequence = [position];
    length = 1;
    for (let i = cIndex - 1; i >= 0; i--) {
        if (['*', team].includes(board.selectedPositions[`${rIndex}-${i}`])) {
            sequence.push(`${rIndex}-${i}`);
            length++;
        } else {
            break;
        }
    }
    for (let j = cIndex + 1; j < 10; j++) {
        if (['*', team].includes(board.selectedPositions[`${rIndex}-${j}`])) {
            sequence.push(`${rIndex}-${j}`);
            length++;
        } else {
            break;
        }
    }
    sequenceFound(board, length, team, sequence);
    sequence = [position];
    length = 1;
    for (let i = 1; i <= Math.min(cIndex, rIndex); i++) {
        let ri = rIndex - i;
        let ci = cIndex - i;
        if (['*', team].includes(board.selectedPositions[`${ri}-${ci}`])) {
            sequence.push(`${ri}-${ci}`);
            length++;
        } else {
            break;
        }
    }
    for (let i = 1; i <= Math.min(9 - cIndex, 9 - rIndex); i++) {
        let ri = rIndex + i;
        let ci = cIndex + i;
        if (['*', team].includes(board.selectedPositions[`${ri}-${ci}`])) {
            sequence.push(`${ri}-${ci}`);
            length++;
        } else {
            break;
        }
    }
    sequenceFound(board, length, team, sequence);
    sequence = [position];
    length = 1;
    for (let i = 1; i <= Math.min(9 - cIndex, rIndex); i++) {
        let ri = rIndex - i;
        let ci = cIndex + i;
        if (['*', team].includes(board.selectedPositions[`${ri}-${ci}`])) {
            sequence.push(`${ri}-${ci}`);
            length++;
        } else {
            break;
        }
    }
    for (let i = 1; i <= Math.min(cIndex, 9 - rIndex); i++) {
        let ri = rIndex + i;
        let ci = cIndex - i;
        if (['*', team].includes(board.selectedPositions[`${ri}-${ci}`])) {
            sequence.push(`${ri}-${ci}`);
            length++;
        } else {
            break;
        }
    }
    sequenceFound(board, length, team, sequence);
}

function sequenceFound(board, length, team, sequence) {
    // logger.info(`Found ${length} seq`);
    if (length >= 9) {
        logger.info(`${team} is the winner`);
        board.teamSequences[team] = [];
        board.teamSequences[team].push(_.slice(sequence, 0, 5));
        board.teamSequences[team].push(_.slice(sequence, 4, 10));
        sequence.forEach(index => (board.cardsLocked[index] = team));
    }
    if (length >= 5) {
        if (sequence.filter(index => board.cardsLocked[index] === team).length > 1) {
            return;
        }
        board.teamSequences[team] = board.teamSequences[team] || [];
        board.teamSequences[team].push(sequence);
        sequence.forEach(index => (board.cardsLocked[index] = team));
        // _.set(board.teamSequences, [team], _.get(board.teamSequences, [team], 0) + 1);
        // sequence.forEach(card => (card.locked = true));
        logger.info(`${team} got 1 new sequence with ${length} with total ${board.teamSequences[team].length}`);
    }
}

function removeCoin(board, position, team) {
    if (board.cardsLocked[position] !== undefined) {
        throw `Cannot remove locked coin`;
    }
    // if ((_.values(board.teamSequences) || []).find(x => x === position)) {
    //     throw `Cannot remove coin at ${position} as it is locked`;
    // }
    if (board.selectedPositions[position] === team) {
        throw `Cannot remove coin for your own team`;
    }
    if (board.selectedPositions[position] === undefined) {
        throw `No coin present`;
    }
    delete board.selectedPositions[position];
    board.selectedByIndex[cardsByPosition[position]] = board.selectedByIndex[cardsByPosition[position]] - 1;
}

function isDead(board, cardIndex) {
    return board.selectedByIndex[cardIndex] === 2;
}

function getSequences(board, team) {
    return _.get(board.teamSequences, [team], 0);
}

function placeCoin(board, position, cardIndex, team) {
    if (utils.isSingleEyedJack(cardIndex)) {
        return removeCoin(board, position, team);
    }
    if (board.selectedPositions[position] !== undefined) {
        throw `Coin already present`;
    }
    let cardAtPosition = cardsByPosition[position];
    if (!utils.isDoubleEyedJack(cardIndex) && cardAtPosition !== cardIndex) {
        throw `Incorrect coin placed at ${position} for index ${cardIndex} where it should be ${cardAtPosition}`;
    }
    board.selectedPositions[position] = team;
    board.selectedByIndex[cardAtPosition] = (board.selectedByIndex[cardAtPosition] || 0) + 1;
    logger.info(`Placed ${cardIndex} at ${position}`);
    checkSequence(board, position, team);
    // TODO: check for completion and set the position as locked
    // TODO: check for win
}

function newBoard() {
    return {
        selectedPositions: {
            '0-0': '*',
            '9-0': '*',
            '0-9': '*',
            '9-9': '*',
        },
        selectedByIndex: {},
        teamSequences: {},
        cardsLocked: {},
    };
}
module.exports = { placeCoin, isDead, getSequences, newBoard };
