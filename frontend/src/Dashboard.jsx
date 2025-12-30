import { useEffect, useState } from 'react';
import axios from 'axios';
import { DateTime } from 'luxon';
import { Link } from 'react-router-dom';

import MapViz from './components/MapViz';
import WishWall from './components/WishWall';
import Countdown from './components/Countdown';
import ShareBlock from './components/ShareBlock';
import ThemeToggle from './components/ThemeToggle';
import FireworksBackground from './components/FireworksBackground';

function Dashboard() {
    const [currentTime, setCurrentTime] = useState(DateTime.now().setZone('utc'));
    const [wishes, setWishes] = useState([]);
    const [currentTheme, setCurrentTheme] = useState('dark');

    // State for local fireworks logic
    const [isLocalCelebrationSoon, setIsLocalCelebrationSoon] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const WISH_LIMITS = import.meta.env.WISH_LIMITS || 50;

    const calculateMidnightLongitude = (dt) => {
        const hours = dt.hour + (dt.minute / 60) + (dt.second / 3600);
        let longitude = (12 - hours) * 15 - 180;
        while (longitude > 180) longitude -= 360;
        while (longitude < -180) longitude += 360;
        return longitude;
    };

    const midnightLon = calculateMidnightLongitude(currentTime);

    // Fetch latest 10 wishes (Stateless)
    const fetchWishes = async () => {
        try {
            // Added limit=10 query param
            const res = await axios.get(`${API_URL}/wishes?limit=${WISH_LIMITS}`);
            setWishes(res.data);
        } catch (e) { console.error("Wish fetch failed"); }
    };

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    useEffect(() => {
        document.title = `Live New Year | Countdown to ${nextYear}`

        fetchWishes(); // Initial fetch

        // Clock Interval (1s)
        const clockInterval = setInterval(() => {
            const nowUtc = DateTime.now().setZone('utc');
            setCurrentTime(nowUtc);

            // --- LOCAL FIREWORKS CHECK ---
            const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const nowLocal = DateTime.now().setZone(userZone);

            const targetYear = nowLocal.month === 1 ? nowLocal.year : nowLocal.year + 1;
            const target = DateTime.fromObject({ year: targetYear, month: 1, day: 1 }, { zone: userZone });

            const diffHours = target.diff(nowLocal, 'hours').hours;

            // Trigger if less than 24 hours away (future) or recently passed (within 24 hours)
            if (diffHours < 24 && diffHours > -24) {
                setIsLocalCelebrationSoon(true);
            } else {
                setIsLocalCelebrationSoon(false);
            }

        }, 1000);

        // Wish Refresh Interval (10s) - Polls for new wishes
        const wishRefreshInterval = setInterval(() => {
            fetchWishes();
        }, 10000);

        return () => {
            clearInterval(clockInterval);
            clearInterval(wishRefreshInterval);
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
        <div id="dashboard-top" className="min-h-screen p-4 md:p-8 font-sans transition-colors duration-300 relative">
            {
                isLocalCelebrationSoon &&
                <FireworksBackground
                    theme={currentTheme}
                    intensity={isLocalCelebrationSoon ? 'high' : 'normal'}
                />
            }

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <header className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700 pb-4 transition-colors">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-300 dark:to-orange-500">
                            Live New Year
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">
                            Tracking the arrival of the New Year, zone by zone.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-3">
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
                            <Link to="/quotes" className="text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors">
                                Get Quotes 💡
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

                    <MapViz midnightLon={midnightLon} theme={currentTheme} />
                </section>

                {/* Wish Wall Section */}
                <section>
                    {/* Pass fetchWishes as onWishPosted */}
                    <WishWall wishes={wishes} currentTime={currentTime} onWishPosted={fetchWishes} />
                </section>

                <section className="my-8">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-600 rounded-2xl p-8 text-center text-white shadow-xl relative overflow-hidden group">
                        {/* Decorative background glow */}
                        {/* <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div> */}
                        {/* <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div> */}

                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <h3 className="text-2xl font-bold">Something to share today? ♥</h3>
                            <p className="text-indigo-100 max-w-lg">
                                Stuck on what to wish for? Generate a unique New Year quote to get the creativity flowing.
                            </p>
                            <Link to="/quotes" className="bg-white text-slate-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
                                <span>💡</span> Generate Quotes
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="my-6">
                    <ShareBlock />
                </div>

                {/* Footer */}
                <footer className="text-center text-slate-500 dark:text-slate-600 text-xs py-8 transition-colors flex flex-col gap-2 items-center">
                    <p>&copy; Live New Year {DateTime.now().year}. Live Updates from around the globe.</p>
                    <div className="flex gap-4">
                        <Link to="/about" className="hover:text-amber-500 transition-colors">About</Link>
                        <span>•</span>
                        <Link to="/privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default Dashboard;