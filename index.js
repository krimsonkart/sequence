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
const { SequenceServer } = require('./app/sequence/game-server');
const fs = require('fs');
const _ = require('lodash');

// app.get('/', (req, res) => {
//   res.send('<h1>Hello world</h1>');
// });
// app.use(express.static(__dirname + '/public'));
//
app
    .use(express.static(path.join(__dirname, 'public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
// app.get('/', function(req, res) {
//     res.sendFile(__dirname + '/index.html');
// });
const server = new SequenceServer();
server.start(io);
http.listen(PORT,
    () => console.log(`Listening on ${ PORT }`)
);
