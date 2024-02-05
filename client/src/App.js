import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Room from './components/Room';
import ChattingRooms from './components/ChattingRooms';
import "./App.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chattingrooms" element={<ChattingRooms />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
}