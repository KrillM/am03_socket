const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const cors = require("cors")
const port = 8000;

app.use(cors())

const crewTable = {};
const updateTableCrew = () => {
    io.emit("crewList", crewTable)
}

const chatRooms = {}; // 채팅방을 관리하는 새로운 객체
const updateChatRoomList = () => {
    io.emit("chatRoomList", Object.keys(chatRooms)); // 채팅방 목록을 전송
};

const io = require("socket.io")(server, {
    cors: {origin: "http://localhost:3000"}
})

io.on("connection", (socket) => {

    // 입장할 때 받은 아이디로 입장을 공지한다.
    socket.on("entry", (res) => {

        // includes: 문자열이나 배열에서 인자로 넘겨준 값의 존재 여부를 확인
        // indexOf: 배열에서 인자로 넘겨준 값의 인덱스를 추출, 없다면 -1 반환
        if(Object.values(crewTable).includes(res.crewName)) {
            socket.emit("error", {message: '이미 사용 중인 닉네임이라 다른 닉네임으로 입장해주시길 바랍니다.'})
        }
        else{
            io.emit("notice", {message: `${res.crewName}님이 입장하였습니다.`})
            socket.emit("entried", {crewName: res.crewName})
            crewTable[socket.id] = res.crewName;
            updateTableCrew();
        }

        chatRooms[res.roomId] = res.roomName; // chatRooms에 방을 추가
        updateChatRoomList(); // 채팅방 목록 업데이트
    })

    socket.on("disconnect", () => {
        io.emit("notice", {message: `${crewTable[socket.id]}님이 나갔습니다.`})
        delete crewTable[socket.id];
        updateTableCrew();
    })

    socket.on("sendMessage", (res) => {
        if(res.dm === "all") io.emit("chat", {crewName: res.crewName, message: res.message})
        else{
            io.to(res.dm).emit("chat", {crewName: res.crewName, message: res.message, dm: true})
            socket.emit("chat", {crewName: res.crewName, message: res.message, dm: true})
        }
    })
})

server.listen(port, () => {
    console.log(`Server Open: ${port}`);
})