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
            socket.emit("error", { message: '해당 방에서 이미 사용 중인 닉네임입니다. 다른 닉네임을 사용하세요' });
        }
    });
    
    // 방을 의도적으로 떠날 때 호출되는 이벤트
    socket.on("leaveRoom", (res) => {
        const { roomId, crewName } = res;
        socket.isDisconnectedCleanly = true; // 정상적인 방 나가기로 표시

        if (roomId && crewName && crewTable[crewName] === socket.id) {
            delete crewTable[crewName]; // 사용자 목록에서 삭제
            const room = roomTable[roomId];
            if (room) {
                const index = room.members.indexOf(socket.id);
                if (index !== -1) {
                    room.members.splice(index, 1); // 방의 멤버 목록에서 삭제
                }
                updateCrewList(roomId); // 변경된 멤버 목록을 모든 방 멤버에게 전송
                socket.to(roomId).emit("notice", { message: `${crewName}님이 나갔습니다.` });
            }
        }
    });

    // 소켓 연결이 끊겼을 때 호출되는 이벤트
    socket.on("disconnect", () => {
        if (!socket.isDisconnectedCleanly) { // 정상적인 방 나가기가 아닌 경우
            const crewName = Object.keys(crewTable).find(name => crewTable[name] === socket.id);
            if (crewName) {
                delete crewTable[crewName]; // 사용자 목록에서 삭제
                if (socket.roomId) {
                    const room = roomTable[socket.roomId];
                    const index = room.members.indexOf(socket.id);
                    if (index !== -1) {
                        room.members.splice(index, 1); // 방의 멤버 목록에서 삭제
                    }
                    updateCrewList(socket.roomId); // 변경된 멤버 목록을 모든 방 멤버에게 전송
                    socket.to(socket.roomId).emit("notice", { message: `${crewName}님이 나갔습니다.` });
                }
            }
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
        if (crewName) {
            crewList[memberSocketId] = crewName;
        }
    });
    io.to(roomId).emit("crewList", crewList);
};

server.listen(port, () => {
    console.log(`Server Open: ${port}`);
});
