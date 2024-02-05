import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Chatting from "./Chatting";
import Notice from "./Notice";
import BootStrap from './BootStrap';
import '../styles/talkDesign.scss';

const socket = io.connect("http://localhost:8000", {autoConnect: false});

export default function Room () {
    const location = useLocation();
    const initialCrewName = location.state?.crewName; // Home에서 받은 crewName
    const { roomId } = useParams(); // URL에서 roomId 추출

    const [message, setMessage] = useState(''); // 채팅으로 보낼 메시지
    const [chatting, setChatting] = useState([]); // 채팅 내용
    const [crewName, setCrewName] = useState(null); // 맴버의 이름
    const [crewList, setCrewList] = useState({});   // 맴버의 리스트
    const [dm2, setDm2] = useState("all");  // 메시지 보내는 기능

    useEffect(() => {
        console.log("Checking socket connection and room entry:", { roomId, initialCrewName });

        // 소켓 연결 초기화
        function initConnectSocket() {
            if (!socket.connected) {
                console.log("Connecting to socket");
                socket.connect();
            }
        }

        if (initialCrewName && roomId) {
            setCrewName(initialCrewName);
            // 채팅방에 참가
            initConnectSocket();
            socket.emit("entry", { roomId: roomId, crewName: initialCrewName });
        }
    }, [initialCrewName, roomId]);
    
    useEffect(() => {
        console.log("Setting up socket event listeners for crewList"); // 소켓 이벤트 리스너 설정 확인

        socket.on("error", (res) => {
            alert(res.message);
        });

        socket.on("entried", (res) => {
            setCrewName(res.crewName);
        });

        socket.on("crewList", (res) => {
            console.log("Received crewList from server:", res); // 콘솔 로그 추가
            setCrewList(res);
        });

        return () => {
            socket.off("error");
            socket.off("entried");
            console.log("Cleaning up crewList event listener"); // 이벤트 리스너 정리 확인
            socket.off("crewList");
        };
    }, []);

    // useMemo: 값을 메모라이징 한다.
    // 뒤에 있는 의존성 배열에 있는 값이 update 될 때마다 연산을 실행한다.
    const crewListOption = useMemo(() => {
        return Object.entries(crewList).map(([key, name]) => {
            if (name === crewName) return null;
            return <option key={key} value={key}>{name}</option>;
        });
    }, [crewList, crewName]);

    // 함수 메모라이징 (useCallback) - 뒤에 있는 의존성 배열에 있는 값이 update 될 때만 함수를 다시 선언한다.
    const addChatting = useCallback((res) => {
        const type = res.crewName === crewName ? "i" : "you";
        const talk = `${res.dm ? '(너에게만)' : ''} ${res.message}`;
        setChatting(prev => [...prev, { type, talk, crewName: res.crewName }]);
    }, [crewName]);

    useEffect(() => {
        socket.on("chat", addChatting);
        return () => socket.off("chat", addChatting);
    }, [addChatting]);
 
    useEffect(() => {
        const notice = (res) => {
            setChatting(prev => [...prev, { type: "notice", talk: res.message }]);
        };

        socket.on("notice", notice);
        return () => socket.off("notice", notice);
    }, []);

    useEffect(() => {
        // 페이지를 떠나기 전에 실행될 함수
        const handleLeaveRoom = () => {
            socket.emit("leaveRoom", { roomId, crewName: crewName });
        };
    
        window.addEventListener("beforeunload", handleLeaveRoom); // 탭을 닫거나 페이지를 떠날 때 이벤트 리스너 추가
    
        return () => {
            window.removeEventListener("beforeunload", handleLeaveRoom); // 컴포넌트 언마운트 시 이벤트 리스너 제거
            handleLeaveRoom(); // 직접 떠날 때도 호출하여 서버에 알림
        };
    }, [crewName, roomId]); // 의존성 배열에 crewName과 roomId 추가

    function sendMessage() {
        if (message !== "") {
            socket.emit("sendMessage", { roomId, crewName, message, dm: dm2 });
            setMessage("");
        }
    }

    return (<>
        <BootStrap />

        <div className='olive-room'>
            <div className='chat-container'>
                {chatting.map((chat, i) => (
                    chat.type === "notice" ? <Notice key={i} chatting={chat}/> : <Chatting key={i} chatting={chat} />
                ))}
            </div>
            <div className="input-container">
                <select value={dm2} onChange={(e) => setDm2(e.target.value)}>
                    <option value="all">모두에게</option>
                    {crewListOption}
                </select>
                <input type="text" className="form-control" value={message} onChange={(e) => setMessage(e.target.value)} />
                <button className="btn btn-light" onClick={sendMessage}>전송</button>
            </div>
        </div>
    </>);
}