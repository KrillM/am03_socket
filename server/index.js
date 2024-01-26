const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const port = 8000;

app.use(cors());

const crewTable = {};

const io = require("socket.io")(server, {
    cors: {origin: "http://localhost:3000"}
})

server.listen(port, () => {
    console.log(`Open Server ${port}`)
})