const PORT = process.env.PORT || 8081;
const logger = require('./utils/logger');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { SequenceServer } = require('./sequence/game-server');

logger.initializeLogger();
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const server = new SequenceServer();
app.use(express.static(path.join(__dirname, 'public-dashboard/build')));
app.use(express.static(path.join(__dirname, 'public')))
    // .set('views', path.join(__dirname, '../views'))
    // .set('view engine', 'ejs')
    // .get('/', (req, res) => res.render('pages/index'))
    .get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public-dashboard/build/index.html'));
    })
    .get('/api/sequence/game/:id', async (req, res) => {
        let game = await server.getGame(req.params.id);
        res.json(game);
    })
    .post('/api/sequence/game', async (req, res) => {
        const gameData = await server.createGame(req.body);
        res.json(gameData);
    })
    .get('/api/sequence/games', async (req, res) => {
        let games = await server.listGames();
        res.json({ data: games });
    })
    .get('/ui/*', (req, res) => {
        res.sendFile(path.join(__dirname, 'public-dashboard/build/index.html'));
    });
/*
    .get('/ui/:page/:id', (req, res) => {
        res.sendFile(path.join(__dirname, 'public-dashboard/public/index.html'));
    })
    .get('/ui/:page/:id:id2/:id3', (req, res) => {
        res.sendFile(path.join(__dirname, 'public-dashboard/public/index.html'));
    })
    .get('/ui/:page/:id:id2/:id3/:id4', (req, res) => {
        res.sendFile(path.join(__dirname, 'public-dashboard/public/index.html'));
    })
    .get('/ui/:page/:id/:id2', (req, res) => {
        res.sendFile(path.join(__dirname, 'public-dashboard/public/index.html'));
    });
*/
server.start(io);
http.listen(PORT, () => console.log(`Listening on ${PORT}`));
