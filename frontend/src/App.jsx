import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Pages
import Dashboard from './Dashboard';
import About from './pages/About';
import PrivacyPage from './pages/PrivacyPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;