import React from "react";
import _ from "lodash";
import {
  Container,
  Row,
  Col,
  Media,
  Card,
  CardImg,
  Alert,
} from "react-bootstrap";
import { useAlert } from "react-alert";
import Modal from "react-modal";

import "./Sequence.css";
import useSequence from "./useSequence";
const TEAM_COINS = { 0: "red.png", 1: "green.png", 2: "blue.png" };
function getImagePath(index) {
  let imagePath = `${index}.png`;
  // For ad blocker
  if (imagePath === "AD.png") imagePath = "aceDiamonds.png";
  if (imagePath === "*.png") imagePath = "back2x.png";
  return imagePath;
}
const SINGLE_EYED_JACKS = ["JS", "JH"];
const DOUBLE_EYED_JACKS = ["JD", "JC"];
function isDoubleEyedJack(cardIndex) {
  return DOUBLE_EYED_JACKS.includes(cardIndex);
}
function isSingleEyedJack(cardIndex) {
  return SINGLE_EYED_JACKS.includes(cardIndex);
}

const Sequence = (props) => {
  const alert = useAlert();
  const { gameId, playerId } = props.match.params; // Gets roomId from URL
  const {
    board,
    hand,
    setHand,
    players,
    position,
    errors,
    setErrors,
    history,
    turn,
    placeAction,
    globalBoard,
    replaceCard,
  } = useSequence(gameId, playerId); // Creates a websocket and manages messaging
  const [cardToUse, setCardToUse] = React.useState(""); // Message to be sent
  const [selectedCardIndex, setSelectedCardIndex] = React.useState(""); // Message to be sent
  const [modalIsOpen, setIsOpen] = React.useState(false);

  const handleHandCardSelected = (card, i) => {
    setCardToUse(card);
    setSelectedCardIndex(i);
    if (board.board.selectedByIndex[card] > 1) {
      setIsOpen(true);
    }
    setHand(hand);
  };
  function getTeamCoin(board, i, j) {
    let coin = board && board.selectedPositions[`${i}-${j}`];
    return (
      coin !== undefined &&
      coin !== "*" &&
      process.env.PUBLIC_URL + "/img/coins/" + TEAM_COINS[coin]
    );
  }

  const handlePlaceCard = (i, j, card) => {
    if (position !== turn) {
      console.log(`Not your turn`);
      alert.show(`Not your turn`);
      // setErrors((errors) => [...errors, { err:`Not Your Turn`, time: Date.now() }]);
      return;
    }
    if (!cardToUse) {
      console.log(`No Card Selected`);
      alert.show(`No Card Selected`);
      // setErrors((errors) => [...errors, { err:`No Card Selected`, time: Date.now() }]);
      return;
    }
    if (
      !isSingleEyedJack(cardToUse) &&
      !isDoubleEyedJack(cardToUse) &&
      cardToUse !== card
    ) {
      console.log(`Not the selected card`);
      alert.show(`Not the selected card`);
      // setErrors((errors) => [...errors, { err:`Not the selected card`, time: Date.now() }]);
      return;
    }
    placeAction(cardToUse, `${i}-${j}`);
    setCardToUse(null);
  };

  function getBoardToDraw() {
    return board.globalBoard || [];
  }

  function cardSelected(i) {
    return selectedCardIndex === i;
  }
  function closeModal() {
    setIsOpen(false);
  }
  function replaceSelected() {
    replaceCard(cardToUse);
    setIsOpen(false);
  }
  return (
    <Container>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Example Modal"
      >
        <h2>Replace card?</h2>
        <button onClick={replaceSelected}>yes</button>
        <button onClick={closeModal}>no</button>
      </Modal>
      <Row>
        <Col>
          <span>Turn: {turn}</span>
        </Col>
        <Col>
          <span>Position: {position}</span>
        </Col>
        <Col>
          <span>Selected: {cardToUse}</span>
        </Col>
      </Row>
      <Row>
        <Container fluid className="container">
          {getBoardToDraw().map((row, i) => (
            <Row key={`row${i}`}>
              {row.map((card, j) => {
                const coin = getTeamCoin(board.board, i, j);
                return (
                  <Col>
                    <Card onClick={() => handlePlaceCard(i, j, card)}>
                      <Card.Img
                        alt="Card"
                        img-border-primary
                        src={`${process.env.PUBLIC_URL}/img/${getImagePath(
                          card
                        )}`}
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
            {(hand || []).map((card, i) => (
              <Col>
                <img
                  alt="Card1"
                  height="100vh"
                  src={`${process.env.PUBLIC_URL}/img/${getImagePath(card)}`}
                  class={cardSelected(i) ? "border border-primary" : ""}
                  onClick={() => handleHandCardSelected(card, i)}
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
