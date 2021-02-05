const PORT = process.env.PORT || 8081;
var express = require('express');
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
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
const server = new SequenceServer();
server.start(io);
http.listen(PORT, function() {
    console.log('Server started!');
});
