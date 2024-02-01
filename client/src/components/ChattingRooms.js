import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io.connect("http://localhost:8000");

export default function ChattingRooms() {
    const [rooms, setRooms] = useState({});
    const [newRoomName, setNewRoomName] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const initialCrewName = location.state?.crewName; // Home에서 받은 crewName

    useEffect(() => {
        // 서버에서 채팅방 목록 요청
        socket.emit("requestRooms");

        socket.on("roomsList", (receivedRooms) => {
            setRooms(receivedRooms);
        });

        return () => {
            socket.off("roomsList");
        };
    }, []);

    const createRoom = () => {
        // 새 채팅방 생성 요청
        socket.emit("createRoom", newRoomName);
        setNewRoomName('');
    };

    const joinRoom = (roomId) => {
        // 특정 채팅방에 입장
        navigate(`/room/${roomId}`, { state: { crewName: initialCrewName } });
    };

    return (
        <div>
            <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}/>
            <button onClick={createRoom}>새 채팅방 생성</button>
            <ul>
                {Object.entries(rooms).map(([id, room]) => (
                    <li key={id}>
                        {room.name} <button onClick={() => joinRoom(id)}>방 입장</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
