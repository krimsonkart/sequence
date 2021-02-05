const PORT = process.env.PORT || 8081;
var express = require('express');
const path = require('path')
var app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http,{
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const { SequenceServer } = require('./sequence/game-server');

app.use(express.static(path.join(__dirname, 'public-dashboard/build')));
app
    .use(express.static(path.join(__dirname, 'public')))
    .use(express.static(path.join(__dirname, 'public-dashboard/public')))
    // .set('views', path.join(__dirname, '../views'))
    // .set('view engine', 'ejs')
    // .get('/', (req, res) => res.render('pages/index'))
    .get('/', (req,res) => {
        res.sendFile(path.join(__dirname, 'public-dashboard/public/index.html'));
    });
const server = new SequenceServer();
server.start(io);
http.listen(PORT,
    () => console.log(`Listening on ${ PORT }`)
);
