import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

import MapViz from './components/MapViz';
import WishWall from './components/WishWall';
import Countdown from './components/Countdown';
import ShareBlock from './components/ShareBlock';
import ThemeToggle from './components/ThemeToggle'; // Import the toggle

function Dashboard() {
    const [currentTime, setCurrentTime] = useState(DateTime.now().setZone('utc'));
    const [wishes, setWishes] = useState([]);
    const [isWsConnected, setIsWsConnected] = useState(false);

    // Track theme state specifically for MapViz (Leaflet needs JS prop, not just CSS)
    const [currentTheme, setCurrentTheme] = useState('dark');

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

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    useEffect(() => {
        document.title = `New Year Watcher | Countdown to ${nextYear}`

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
                console.log("WebSocket Connected");
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
                console.log(`WebSocket Closed: ${event.code} ${event.reason}`);
                setIsWsConnected(false);
            };

            ws.current.onerror = (err) => {
                console.error("WebSocket Error:", err);
            };
        };

        connectWebSocket();

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

    const HelpTooltip = ({ text }) => {
        return (
            <div className="relative inline-block ml-1 group z-10">
                <span className="cursor-help text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                </span>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible text-center pointer-events-none transition-all duration-200">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800"></div>
                </div>
            </div>
        );
    };

    return (
        <div id="dashboard-top" className="min-h-screen p-4 md:p-8 font-sans transition-colors duration-300">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700 pb-4 transition-colors">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-300 dark:to-orange-500">
                            New Year Watcher
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">
                            Tracking the arrival of the New Year, zone by zone.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
                            {/* Theme Toggle Button */}
                            <ThemeToggle onThemeChange={setCurrentTheme} />

                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-widest font-bold transition-colors">{dateString}</div>
                                <div className="text-3xl font-mono text-slate-800 dark:text-white leading-none mt-1 transition-colors">{utcString}</div>
                                <div className="text-[10px] text-amber-600 dark:text-amber-500/60 uppercase tracking-[0.2em] mt-1 font-black transition-colors">UTC Time</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation */}
                <nav className="sticky top-0 z-[9999] bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3 px-4 mb-8 transition-colors">
                    <div className="container flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-5 md:gap-8 text-xs md:text-sm font-bold uppercase tracking-wider">
                            <a href="#dashboard-top" className="text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
                                Home
                            </a>
                            <a href="#map-view" className="text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
                                Live Map
                            </a>
                            <a href="#make-a-wish" className="text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-colors flex items-center gap-1">
                                Make a Wish <span>✨</span>
                            </a>
                            <Link to="/about" className="text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
                                About
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Countdown Section */}
                <section>
                    <Countdown currentTime={currentTime} />
                </section>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-8 transition-colors"></div>

                {/* Map Section */}
                <section>
                    <div id="map-view" className="flex justify-between items-center mb-2 px-1">
                        <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase font-black transition-colors">Global Timeline</label>
                                <HelpTooltip text="Shows real-time midnight movement. Zoom in to view longitude motion as a dotted polyline." />
                            </div>
                            <div className="flex items-center gap-2 px-1 py-1 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/50 rounded-full animate-pulse transition-colors">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-amber-100 border border-amber-400 dark:bg-amber-500/20 dark:border-amber-500 rounded-sm transition-colors"></span>
                                <span className="text-slate-500 dark:text-slate-400 transition-colors">Past Midnight</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-600 rounded-sm transition-colors"></span>
                                <span className="text-slate-500 dark:text-slate-400 transition-colors">Waiting</span>
                            </div>
                        </div>
                    </div>

                    {/* Pass currentTheme to MapViz to switch tile URLs */}
                    <MapViz midnightLon={midnightLon} theme={currentTheme} />
                </section>

                {/* Wish Wall Section */}
                <section>
                    <WishWall wishes={wishes} currentTime={currentTime} isWsConnected={isWsConnected} />
                </section>

                <div className="my-6">
                    <ShareBlock />
                </div>

                {/* Footer */}
                <footer className="text-center text-slate-500 dark:text-slate-600 text-xs py-8 transition-colors">
                    <p>&copy; New Year Watcher {DateTime.now().year}. Live Updates from around the globe.</p>
                </footer>
            </div>
        </div>
    );
}

export default Dashboard;