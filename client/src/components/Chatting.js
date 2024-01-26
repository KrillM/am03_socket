export default function Chatting( {chatting} ) {
    return <div className={`list ${chatting.type}-chat`}>
        <div className="nameColour">{chatting.crewName}</div>
        <div className="content">{chatting.talk}</div>
    </div>
}
