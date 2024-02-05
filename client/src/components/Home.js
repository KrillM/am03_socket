import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BootStrap from './BootStrap';

export default function Home () {
    const [newCrew, setNewCrew] = useState(''); // 새 맴버 추가
    const navigate = useNavigate();
    const joinChattingRoom = () => {
        navigate('/chattingrooms', { state: { crewName: newCrew } });
    };

    return (<>
        <BootStrap />
        <div className='helloGuys'>
            <h1 className='show-Title'>Talk Together</h1>
            <div className='show-chatting-rooms'>
                <input type='text' className="form-control" value={newCrew} onChange={(e) => setNewCrew(e.target.value)} />
                <button className="btn btn-outline-success" onClick={joinChattingRoom}>입장</button>
            </div>
        </div>
    </>);
};