import { useState, useEffect, useCallback, useMemo } from 'react';
import io from 'socket.io-client';
import Chatting from "./Chatting";
import Notice from "./Notice";
import BootStrap from './BootStrap';
import Home from './Home';

const socket = io.connect("http://localhost:8000", {autoConnect: false});

export default function Room () {
    const [message, setMessage] = useState(''); // 채팅으로 보낼 메시지
    const [chatting, setChatting] = useState([]); // 채팅 내용

    const [newCrew, setNewCrew] = useState(""); // 새 맴버 추가
    const [crewName, setCrewName] = useState(null); // 맴버의 이름
    const [crewList, setCrewList] = useState({});   // 맴버의 리스트
    const [dm2, setDm2] = useState("all");  // 메시지 보내는 기능

    // 소켓 연결
    function initConnectSocket () {
        if(!socket.connected) socket.connect();
    }
    
    useEffect(() => {
        socket.on("error", (res) => {
            alert(res.message)
        })

        socket.on("entried", (res) => {
            setCrewName(res.crewName);
        })

        socket.on("crewList", (res) => {
            setCrewList(res);
        })
    }, [])

    // useMemo: 값을 메모라이징 한다.
    // 뒤에 있는 의존성 배열에 있는 값이 update 될 때마다 연산을 실행한다.
    const crewListOption = useMemo(() => {
        const option = []
        for(const key in crewList){
            if(crewList[key] === crewName) continue;
            option.push(<option key={key} value={key}>{crewList[key]}</option>)
        }
        return option
    }, [crewList])

    // 함수 메모라이징 (useCallback) - 뒤에 있는 의존성 배열에 있는 값이 update 될 때만 함수를 다시 선언한다.
    const addChatting = useCallback((res) => {
        const type = res.crewName === crewName ? "i" : "you";
        const talk = `${res.dm ? '(너에게만)' : ''} ${res.message}`
        const newChatting = [...chatting, {type: type, talk: talk, crewName: res.crewName}]
        setChatting(newChatting);
    }, [crewName, chatting])

    useEffect(() => {
        socket.on("chat", addChatting);
        return () => socket.off("chat", addChatting)
    },[addChatting])

    socket.on("chat", addChatting)
 
    useEffect(() => {
        const notice = (res) => {
            const newChatting = [...chatting, {type: "notice", talk: res.message}]
            setChatting(newChatting);
        }

        socket.on("notice", notice);
        return () => socket.off("notice", notice);
    }, [chatting])

    function sendMessage () {
        if(message !== ""){
            socket.emit("sendMessage", {crewName: crewName, message: message, dm: dm2})
            setMessage("")
        }
    }

    function joinChattingRoom () {
        initConnectSocket();
        socket.emit("entry", { crewName: newCrew });
    }

    return(<>
        <BootStrap />

        { crewName ? (
            <div className='olive-room'>
                <div className='chat-container'>
                    {chatting.map((chatting, i) => {
                        if(chatting.type === "notice") return <Notice key={i} chatting={chatting}/>
                        else return <Chatting key={i} chatting={chatting} />
                    })}
                </div>

                <div className="input-container">
                    <select value={dm2} onChange={(e) => setDm2(e.target.value)}>
                        <option value="all">모두에게</option>
                        {crewListOption}
                    </select>
                    <input type="text" class="form-control" value={message} onChange={(e) => setMessage(e.target.value)} />
                    <button class="btn btn-light" onClick={sendMessage}>전송</button>
                </div>
            </div>
            ) : (
            <Home newCrew={newCrew} setNewCrew={setNewCrew} joinChattingRoom={joinChattingRoom}/>
        )}
    </>)
}