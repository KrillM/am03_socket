const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const port = 8000;

app.use(cors());

const io = require("socket.io")(server, {
    cors: {origin: "http://localhost:3000"}
});

const crewTable = {}; // 기존 유저 관리
const roomTable = {}; // 채팅방 관리
let nextRoomId = 1; // 채팅방 ID를 위한 변수

io.on("connection", (socket) => {
    socket.on("entry", (res) => {
        const roomId = res.roomId;
        const room = roomTable[roomId];
        if (room && !crewTable[res.crewName]) { // 중복 닉네임 체크
            if (socket.roomId) { // 현재 다른 방에 있다면
                socket.leave(socket.roomId); // 이전 방에서 나감
            }
            socket.join(roomId); // 새 방에 참여
            socket.roomId = roomId; // 사용자의 현재 방 ID 저장
            room.members.push(socket.id);
            crewTable[res.crewName] = socket.id;
            updateCrewList(roomId); // 해당 방의 crewList만 업데이트
            socket.to(roomId).emit("notice", { message: `${res.crewName}님이 입장하였습니다.` });
        } else {
            socket.emit("error", { message: '이미 사용 중인 닉네임이거나 잘못된 방입니다.' });
        }
    });

    socket.on("disconnect", () => {
        const crewName = Object.keys(crewTable).find(name => crewTable[name] === socket.id);
        delete crewTable[crewName]; // 먼저 삭제
        if (socket.roomId) {
            const room = roomTable[socket.roomId];
            const index = room.members.indexOf(socket.id);
            if (index !== -1) {
                room.members.splice(index, 1);
            }
            updateCrewList(socket.roomId); // 해당 방의 crewList만 업데이트
            socket.to(socket.roomId).emit("notice", { message: `${crewName}님이 나갔습니다.` });
        }
    });

    socket.on("sendMessage", (res) => {
        const roomId = res.roomId;
        const room = roomTable[roomId];
        if (room) {
            if (res.dm === "all") {
                room.members.forEach(memberSocketId => {
                    io.to(memberSocketId).emit("chat", { crewName: res.crewName, message: res.message });
                });
            } else {
                io.to(res.dm).emit("chat", { crewName: res.crewName, message: res.message, dm: true });
                socket.emit("chat", { crewName: res.crewName, message: res.message, dm: true });
            }
        }
    });

    socket.on("requestRooms", () => {
        socket.emit("roomsList", roomTable);
    });

    socket.on("createRoom", (roomName) => {
        const roomId = nextRoomId++;
        roomTable[roomId] = { name: roomName, members: [] };
        io.emit("roomsList", roomTable);
    });
});

const updateCrewList = (roomId) => {
    const crewList = {};
    roomTable[roomId].members.forEach(memberSocketId => {
        const crewName = Object.keys(crewTable).find(name => crewTable[name] === memberSocketId);
        crewList[memberSocketId] = crewName;
    });
    io.to(roomId).emit("crewList", crewList);
};

server.listen(port, () => {
    console.log(`Server Open: ${port}`);
});
