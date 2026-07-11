import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HealingJourney from './pages/HealingJourney';
import Community from './pages/Community';
import Chatbot from './pages/Chatbot';
import Resources from './pages/Resources';
import Appointments from './pages/Appointments';
import { Login, Register } from './pages/Auth';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/healing" element={<HealingJourney />} />
              <Route path="/community" element={<Community />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
