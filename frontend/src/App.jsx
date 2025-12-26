import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { DateTime } from 'luxon';
import MapViz from './components/MapViz';
import WishWall from './components/WishWall';
import Countdown from './components/Countdown';

import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from '@vercel/analytics/react';

function App() {
    const [currentTime, setCurrentTime] = useState(DateTime.now().setZone('utc'));
    const [wishes, setWishes] = useState([]);
    const [isWsConnected, setIsWsConnected] = useState(false);

    const ws = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Use Environment Variables
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

    // Calculation logic mirror of the backend
    const calculateMidnightLongitude = (dt) => {
        const hours = dt.hour + (dt.minute / 60) + (dt.second / 3600);
        // Formula: Midnight is 180 degrees away from Noon.
        let longitude = (12 - hours) * 15 - 180;

        // Normalize to -180 to 180 range
        while (longitude > 180) longitude -= 360;
        while (longitude < -180) longitude += 360;

        return longitude;
    };

    const midnightLon = calculateMidnightLongitude(currentTime);

    const fetchInitialWishes = async () => {
        try {
            const res = await axios.get(`${API_URL}/wishes`);
            setWishes(res.data);
        } catch (e) { console.error("Wish fetch failed"); }
    };

    useEffect(() => {
        fetchInitialWishes();

        const clockInterval = setInterval(() => {
            setCurrentTime(DateTime.now().setZone('utc'));
        }, 1000);

        const connectWebSocket = () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
                return;
            }

            console.log("Attempting to connect to WebSocket...");
            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log("✅ WebSocket Connected");
                setIsWsConnected(true);
            };

            ws.current.onmessage = (event) => {
                try {
                    const newWish = JSON.parse(event.data);
                    setWishes((prevWishes) => [newWish, ...prevWishes]);
                } catch (err) {
                    console.error("Failed to parse message:", err);
                }
            };

            ws.current.onclose = (event) => {
                console.log(`❌ WebSocket Closed: ${event.code} ${event.reason}`);
                setIsWsConnected(false);

                // Only reconnect if not closed intentionally by the client (code 1000)
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log("Retrying connection...");
                        connectWebSocket();
                    }, 5000);
                }
            };

            ws.current.onerror = (err) => {
                console.error("WebSocket Error:", err);
            };
        };

        // connectWebSocket();

        return () => {
            clearInterval(clockInterval);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (ws.current) {
                ws.current.onclose = null;
                ws.current.close(1000, "Component unmounted");
            }
        };
    }, []);

    const utcString = currentTime.toFormat('HH:mm:ss');
    const dateString = currentTime.toFormat('ccc, MMM dd, yyyy');

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex justify-between items-end border-b border-slate-700 pb-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">
                            New Year Watcher
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Tracking the arrival of the New Year, zone by zone.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{dateString}</div>
                        <div className="text-3xl font-mono text-white leading-none mt-1">{utcString}</div>
                        <div className="text-[10px] text-amber-500/60 uppercase tracking-[0.2em] mt-1 font-black">UTC Time</div>
                    </div>
                </header>

                <section>
                    <Countdown currentTime={currentTime} />
                </section>

                <section>
                    <div className="flex justify-between items-center mb-2 px-1">
                        <h2 className="text-sm font-semibold text-slate-300">Global Timeline</h2>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-amber-500/20 border border-amber-500 rounded-sm"></span>
                                <span className="text-slate-400">Past Midnight</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-slate-800 border border-slate-600 rounded-sm"></span>
                                <span className="text-slate-400">Waiting</span>
                            </div>
                        </div>
                    </div>
                    <MapViz midnightLon={midnightLon} />
                </section>

                {/* <section>
                    <WishWall wishes={wishes} currentTime={currentTime} isWsConnected={isWsConnected} />
                </section> */}

                <footer className="text-center text-slate-600 text-xs py-8">
                    <p>&copy; NewYearWatcher. Live Updates via WebSockets.</p>
                </footer>
            </div>
        </div>
    );
}

export default App;