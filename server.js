const PORT = process.env.PORT || 8081;
var express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
const path = require('path');
var app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
const { SequenceServer } = require('./sequence/game-server');

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
    .get('/api/sequence/game/:id', (req, res) => {
        res.json(server.getGame(req.params.id));
    })
    .post('/api/sequence/game', (req, res) => {
        res.json(server.createGame(req.body));
    })
    .get('/api/sequence/games', (req, res) => {
        res.json({ data: server.listGames() });
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
