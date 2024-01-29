import React, { useState } from 'react';
import '../styles/talkDesign.scss';

export default function Home ({ newCrew, setNewCrew, joinChattingRoom }) {
    const [hasEntered, setHasEntered] = useState(false);

    const handleJoinChattingRoom = () => {
        joinChattingRoom();
        setHasEntered(true); // 사용자가 방에 입장하면 상태 업데이트
    };

    if (hasEntered) {
        return <div>채팅방 목록 컴포넌트 여기에</div>; // 여기에 채팅방 목록 컴포넌트를 렌더링합니다.
    }

    return (
        <div className='helloGuys'>
            <h1 className='show-Title'> Talk Together </h1>
            <div className='show-chatting-rooms'>
                <input
                    type='text'
                    className="form-control"
                    value={newCrew}
                    onChange={(e) => setNewCrew(e.target.value)}
                />
                <button
                    className="btn btn-outline-success"
                    onClick={joinChattingRoom}
                >
                    입장
                </button>
            </div>
        </div>
    );
};