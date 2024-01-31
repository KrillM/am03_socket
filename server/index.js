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
        if (room && !Object.values(crewTable).includes(res.crewName)) {
            room.members.push(socket.id);
            crewTable[socket.id] = res.crewName;
            updateCrewList();
            io.emit("notice", { message: `${res.crewName}님이 입장하였습니다.` });
        } else {
            socket.emit("error", { message: '이미 사용 중인 닉네임이거나 잘못된 방입니다.' });
        }
    });

    socket.on("disconnect", () => {
        for (let roomId in roomTable) {
            const index = roomTable[roomId].members.indexOf(socket.id);
            if (index !== -1) {
                roomTable[roomId].members.splice(index, 1);
                break;
            }
        }
        io.emit("notice", { message: `${crewTable[socket.id]}님이 나갔습니다.` });
        delete crewTable[socket.id];
        updateCrewList();
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

const updateCrewList = () => {
    console.log("Updating and emitting crewList:", crewTable); // 콘솔 로그 추가
    io.emit("crewList", crewTable);
};

server.listen(port, () => {
    console.log(`Server Open: ${port}`);
});
