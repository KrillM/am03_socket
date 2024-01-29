import React from 'react';

export default function Home ({ newCrew, setNewCrew, joinChattingRoom }) {
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