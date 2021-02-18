import React from "react";
import _ from "lodash";
import { Container, Row, Col, Media, Card, CardImg } from "react-bootstrap";

import "./Sequence.css";
import useSequence from "./useSequence";
const TEAM_COINS = { 0: "red.png", 1: "green.png", 2: "blue.png" };
class SlotCard {
  constructor(value, suite) {
    let imagePath = `${value}${suite}.png`;
    // For ad blocker
    if (imagePath === "AD.png") imagePath = "aceDiamonds.png";
    this.image = imagePath;
    this.value = value;
    this.suite = suite;
    this.index = `${value}${suite}`;
  }
}
function initializeBoard() {
  const board = [];
  for (let i = 0; i < 10; i++) {
    const row = [];
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
  _.set(board, [0, 0], {
    card: { image: "back2x.png" },
    position: "0-0",
  });
  _.set(board, [9, 9], {
    card: { image: "back2x.png" },
    position: "9-9",
  });
  _.set(board, [0, 9], {
    card: { image: "back2x.png" },
    position: "0-9",
  });
  _.set(board, [9, 0], {
    card: { image: "back2x.png" },
    position: "9-0",
  });
  for (let i = 0; i < 100; i++) {
    if (!_.get(board, [rIndex, cIndex, "card"])) {
      let s = suits[sIndex];
      let v = values[s][vIndex];
      const slotCard = {
        card: new SlotCard(v, s),
        position: `${rIndex}-${cIndex}`,
        rIndex,
        cIndex,
      };
      if (vIndex === 11) {
        sIndex = (sIndex + 1) % 4;
      }
      vIndex = (vIndex + 1) % 12;
      _.set(board, [rIndex, cIndex], slotCard);
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
  return board;
}

const globalBoard = initializeBoard();
const SINGLE_EYED_JACKS = ["JS", "JH"];
const DOUBLE_EYED_JACKS = ["JD", "JC"];
function isDoubleEyedJack(cardIndex) {
  return DOUBLE_EYED_JACKS.includes(cardIndex);
}
function isSingleEyedJack(cardIndex) {
  return SINGLE_EYED_JACKS.includes(cardIndex);
}

const Sequence = (props) => {
  const { gameId, playerId } = props.match.params; // Gets roomId from URL
  const {
    board,
    hand,
    players,
    position,
    errors,
    history,
    turn,
    placeAction,
    replaceCard,
  } = useSequence(gameId, playerId); // Creates a websocket and manages messaging
  const [cardToUse, setCardToUse] = React.useState(""); // Message to be sent

  const handleHandCardSelected = (card) => {
    setCardToUse(card);
  };
  function getTeamCoin(card) {
    let coin = _.get(board,['selectedPositions',card.position]);
    return (
      coin !== undefined &&
      coin !== "*" &&
      process.env.PUBLIC_URL + "/img/coins/" + TEAM_COINS[coin]
    );
  }

  const handlePlaceCard = (card) => {
    if (position !== turn) {
      console.log(`Not your turn`);
      return;
    }
    if (!cardToUse) {
      console.log(`No Card Selected`);
      return;
    }
    let cardIndex = cardToUse.index;
    if (
      !isSingleEyedJack(cardIndex) &&
      !isDoubleEyedJack(cardIndex) &&
      cardIndex !== card.card.index
    ) {
      console.log(`Not the selected card`);
      return;
    }
    placeAction(cardToUse, card.position);
    setCardToUse(null);
  };
  /*
  return (
      <Container>
      <CardDeck style={{display: 'flex', flexDirection: 'row'}}>
        <Card bg="primary" text="white" style={{flex: 1}}>
          <Card.Img src="https://static.bit.dev/bit-logo.svg"></Card.Img>
        </Card>
        <Card bg="primary" text="white" style={{flex: 1}}>
          <Card.Img src="https://static.bit.dev/bit-logo.svg"></Card.Img>
        </Card>
        <Card bg="primary" text="white" style={{flex: 1}}>
          <Card.Img src="https://static.bit.dev/bit-logo.svg"></Card.Img>
        </Card>
      </CardDeck>
      <CardDeck style={{display: 'flex', flexDirection: 'row'}}>
        <Card bg="primary" text="white" style={{flex: 1}}>
          <Card.Img src="https://static.bit.dev/bit-logo.svg"></Card.Img>
        </Card>
        <Card bg="primary" text="white" style={{flex: 1}}>
          <Card.Img src="https://static.bit.dev/bit-logo.svg"></Card.Img>
        </Card>
        <Card bg="primary" text="white" style={{flex: 1}}>
          <Card.Img src="https://static.bit.dev/bit-logo.svg"></Card.Img>
        </Card>
      </CardDeck>
      </Container>
  )
*/

  /*
  return (
    <Container>
      <Row>
        <Container>
          {_.get(board, "board", []).map((row, i) => (
            <CardDeck
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",alignItems: "stretch",alignContent:"stretch",justifyContent: 'space-around
              }}
            >
              {row.map((card, j) => (
                <Card bg="primary" text="white" style={{ flex: 1 }}>
                  <Card.Img
                    alt="Card"
                    height="80vh"
                    src={`${process.env.PUBLIC_URL}/img/${card.card.image}`}
                    onClick={() => handlePlaceCard(card)}
                  />
                </Card>
              ))}
            </CardDeck>
          ))}
        </Container>
      </Row>
      <Row>
        <Container fluid>
          <Row style={{ justifyContent: "center", padding: "20px" }}>
            {(hand || []).map((card) => (
              <img
                alt="Card"
                height="100vh"
                src={`${process.env.PUBLIC_URL}/img/${card.image}`}
                onClick={() => handleHandCardSelected(card)}
              />
            ))}
          </Row>
        </Container>
      </Row>
    </Container>
  );
*/
  return (
    <Container>
      <Row>
        <Container fluid className="container">
          {globalBoard.map((row, i) => (
            <Row key={`row${i}`}>
              {row.map((card, j) => {
                const coin = getTeamCoin(card);
                return (
                  <Col>
                    <Card onClick={() => handlePlaceCard(card)}>
                      <Card.Img
                        alt="Card"
                        src={`${process.env.PUBLIC_URL}/img/${card.card.image}`}
                      />
                      {coin && (
                        <img src={coin} className="coin img-responsive" />
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ))}
        </Container>
      </Row>
      <Row>
        <Container fluid>
          <Row style={{ justifyContent: "center", padding: "20px" }}>
            {(hand || []).map((card) => (
              <Col>
                <img
                  alt="Card"
                  height="100vh"
                  src={`${process.env.PUBLIC_URL}/img/${card.image}`}
                  onClick={() => handleHandCardSelected(card)}
                />
              </Col>
            ))}
          </Row>
        </Container>
      </Row>
    </Container>
  );
};

export default Sequence;
