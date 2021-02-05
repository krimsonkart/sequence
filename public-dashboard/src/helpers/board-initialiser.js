import Card from "../cards/card";
import _ from "lodash";

export default function initialiseSequenceBoard() {
  const board = [];
  const cardsByIndex = {};
  for (let i = 0; i < 10; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push({});
    }
    board.push(row);
  }
  let suits = ["S", "D", "C", "H"];
  let suiteNumbers = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "Q",
    "K",
    "A",
  ];
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
  _.set(
    board,
    [0, 0],
    new Card({ position: "0-0", index: "blank" })
  );
  _.set(
    board,
    [9, 9],
    new Card({ position: "9-9", index: "blank" })
  );
  _.set(
    board,
    [0, 9],
    new Card({ position: "0-9", index: "blank" })
  );
  _.set(
    board,
    [9, 0],
    new Card({ position: "9-0", index: "blank" })
  );
  for (let i = 0; i < 100; i++) {
    let card;
    if (!board[rIndex][cIndex].image) {
      let s = suits[sIndex];
      let v = values[s][vIndex];
      card = new Card({
        value: v,
        suite: s,
        index: `${v}${s}`,
        position: `${rIndex}-${cIndex}`,
      });
      if (vIndex === 11) {
        sIndex = (sIndex + 1) % 4;
      }
      vIndex = (vIndex + 1) % 12;
      _.set(board, [rIndex, cIndex], card);
      _.set(cardsByIndex, [card.index, card.position], card);
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
  return { board, cardsByIndex };
}
