import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import BootStrap from './BootStrap';

const socket = io.connect("http://localhost:8000");

export default function ChattingRooms() {
    const [rooms, setRooms] = useState({});
    const [newRoomName, setNewRoomName] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const initialCrewName = location.state?.crewName; // Home에서 받은 crewName

    useEffect(() => {
        socket.emit("requestRooms"); // 서버에서 채팅방 목록 요청

        socket.on("roomsList", (receivedRooms) => {
            setRooms(receivedRooms);
        });

        return () => {
            socket.off("roomsList");
        };
    }, []);

    const createRoom = () => {
        socket.emit("createRoom", newRoomName); // 새 채팅방 생성 요청
        setNewRoomName('');
    };

    const joinRoom = (roomId) => {
        navigate(`/room/${roomId}`, { state: { crewName: initialCrewName } }); // 특정 채팅방에 입장
    };

    return (<>
         <BootStrap />

        <div className='helloRooms'>
            <h1 className='show-Title'>Talk Together</h1>
            <div className='show-chatting-rooms'>
                <input type="text" className="form-control" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}/>
                <button onClick={createRoom} className="btn btn-outline-success">Create Room</button>
            </div>
            <ul className="rooms-list">
            {Object.entries(rooms)
            .map(([id, room]) => (
                <li key={id}>
                    {room.name} <button onClick={() => joinRoom(id)} className="btn btn-outline-primary">Join Room</button>
                </li>
            ))}
            </ul>
        </div>
    </>);
}
