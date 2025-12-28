import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { toast } from 'sonner'; // Optional: for feedback if they try to force it

// --- Data Constants ---
// Reduced default to 3 to match the new limit
const DEFAULT_CITIES = [];

const ALL_ZONES = [
    { label: "(UTC+14) Kiritimati", value: "Etc/GMT+12" },
    { label: "(UTC+13) Tongatapu", value: "Pacific/Tongatapu" },
    { label: "(UTC+12) Auckland", value: "Pacific/Auckland" },
    { label: "(UTC+11) Noumea", value: "Pacific/Noumea" },
    { label: "(UTC+10) Sydney", value: "Australia/Sydney" },
    { label: "(UTC+9) Tokyo", value: "Asia/Tokyo" },
    { label: "(UTC+8) Shanghai", value: "Asia/Shanghai" },
    { label: "(UTC+7) Bangkok", value: "Asia/Bangkok" },
    { label: "(UTC+6) Dhaka", value: "Asia/Dhaka" },
    { label: "(UTC+5:30) Kolkata", value: "Asia/Kolkata" },
    { label: "(UTC+5) Karachi", value: "Asia/Karachi" },
    { label: "(UTC+4) Dubai", value: "Asia/Dubai" },
    { label: "(UTC+3) Moscow", value: "Europe/Moscow" },
    { label: "(UTC+2) Cairo", value: "Africa/Cairo" },
    { label: "(UTC+1) Paris", value: "Europe/Paris" },
    { label: "(UTC+0) London", value: "Europe/London" },
    { label: "(UTC-1) Azores", value: "Atlantic/Azores" },
    { label: "(UTC-2) South Georgia", value: "Atlantic/South_Georgia" },
    { label: "(UTC-3) Buenos Aires", value: "America/Argentina/Buenos_Aires" },
    { label: "(UTC-4) Santiago", value: "America/Santiago" },
    { label: "(UTC-5) New York", value: "America/New_York" },
    { label: "(UTC-6) Chicago", value: "America/Chicago" },
    { label: "(UTC-7) Denver", value: "America/Denver" },
    { label: "(UTC-8) Los Angeles", value: "America/Los_Angeles" },
    { label: "(UTC-9) Anchorage", value: "America/Anchorage" },
    { label: "(UTC-10) Honolulu", value: "Pacific/Honolulu" },
    { label: "(UTC-11) Pago Pago", value: "Pacific/Pago_Pago" },
    { label: "(UTC-12) Baker Island", value: "Etc/GMT+12" },
];

// --- Sub-Components ---

const NewsBanner = ({ recentCities }) => {
    if (!recentCities || recentCities.length === 0) {
        return null;
    }

    const cityListString = recentCities.join(", ");

    return (
        <div className="bg-gradient-to-r from-amber-100/50 to-orange-100/50 dark:from-amber-500/20 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/50 p-4 rounded-2xl mb-6 shadow-sm dark:shadow-[0_0_20px_rgba(245,158,11,0.2)] relative overflow-hidden transition-colors">
            <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-2">
                <h4 className="text-amber-600 dark:text-amber-400 text-sm font-black uppercase tracking-wider flex items-center shrink-0">
                    <span className="mr-2 text-lg">🎊 Live update:</span>
                </h4>
                <div className="text-slate-700 dark:text-slate-100 text-md md:text-lg font-medium">
                    New Year has just arrived in: <span className="font-bold text-amber-600 dark:text-amber-300 glow-text">{cityListString}</span>!
                </div>
            </div>
        </div>
    );
};

const CountdownCard = ({ name, zone, currentTime, isMain = false }) => {
    const nextYear = currentTime.setZone(zone).year + 1;
    const target = DateTime.fromObject({ year: nextYear, month: 1, day: 1 }, { zone });
    const diff = target.diff(currentTime.setZone(zone), ['hours', 'minutes', 'seconds']).toObject();

    const isPast = diff.hours < 0 || diff.minutes < 0 || diff.seconds < 0;
    const isSoon = diff.hours < 24 && diff.hours >= 0 && !isPast;

    const displayHours = isPast ? 0 : Math.floor(diff.hours);
    const displayMins = isPast ? 0 : Math.floor(diff.minutes);
    const displaySecs = isPast ? 0 : Math.floor(diff.seconds);

    return (
        <div className={`${isMain
            ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/50'
            : 'bg-white border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50'} 
            border p-3 rounded-lg hover:border-amber-400 dark:hover:border-amber-500/30 transition-all shadow-sm dark:shadow-lg h-full`}>

            <div className={`text-[10px] uppercase tracking-widest mb-1 ${isMain ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                {isMain ? 'Personalized View:' : ''} {name.split('/').pop().replace('_', ' ')}
            </div>

            {isMain ? (
                <div className="text-[12px] text-amber-600/60 dark:text-amber-200/60 font-mono mb-2 border-b border-amber-200 dark:border-amber-500/10QX pb-2">
                    <span className="text-amber-600/40 dark:text-amber-500/40 mr-1">CURRENTLY:</span>
                    {currentTime.setZone(zone).toFormat('DDD HH:mm:ss')}
                </div>) :
                (<div className="text-[11px] text-amber-600/60 dark:text-amber-200/60 font-mono mb-2 border-b border-amber-200 dark:border-amber-500/10QX pb-2">
                    {currentTime.setZone(zone).toFormat('DDD HH:mm:ss')}
                </div>)
            }

            <div className={`text-lg font-mono font-bold ${isSoon ? 'text-amber-500 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'} ${isMain ? 'text-3xl mt-1' : ''}`}>
                {isPast ? (
                    <span className="text-amber-500 animate-pulse">Happy New Year!</span>
                ) : (
                    <>
                        {String(displayHours).padStart(2, '0')}:
                        {String(displayMins).padStart(2, '0')}:
                        {String(displaySecs).padStart(2, '0')}
                    </>
                )}
            </div>

            {!isPast && <div className="text-[9px] text-slate-400 dark:text-slate-600 mt-1 italic">until New Year</div>}
        </div>
    );
};

// --- Selection Modal ---
const SelectionModal = ({ isOpen, onClose, selectedZones, onToggle }) => {
    if (!isOpen) return null;

    // Check if limit is reached
    const MAX_SELECTION = 3;
    const isLimitReached = selectedZones.length >= MAX_SELECTION;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col transition-colors">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customize Dashboard</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select up to {MAX_SELECTION} cities to track</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-amber-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ALL_ZONES.map((zone) => {
                        const isSelected = selectedZones.some(z => z.zone === zone.value);
                        // Disable if limit reached AND this item isn't already selected
                        const isDisabled = isLimitReached && !isSelected;

                        return (
                            <button
                                key={zone.value}
                                onClick={() => !isDisabled && onToggle(zone)}
                                disabled={isDisabled}
                                className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${isSelected
                                    ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                                    : isDisabled
                                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <span>{zone.label}</span>
                                {isSelected && (
                                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-between items-center transition-colors">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Selected: <span className={`${isLimitReached ? 'text-red-500' : 'text-amber-500'} font-bold`}>{selectedZones.length}/{MAX_SELECTION}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-amber-500/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const Countdown = ({ currentTime }) => {
    const [selectedZone, setSelectedZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initialize watchlist from local storage or default
    const [watchList, setWatchList] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('user_watch_list');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) { console.error("Failed to load watchlist", e); }
            }
        }
        return DEFAULT_CITIES;
    });

    // Save to local storage whenever watchlist changes
    useEffect(() => {
        localStorage.setItem('user_watch_list', JSON.stringify(watchList));
    }, [watchList]);

    const handleToggleCity = (zoneObj) => {
        setWatchList(prev => {
            const exists = prev.find(item => item.zone === zoneObj.value);

            if (exists) {
                // Remove city
                return prev.filter(item => item.zone !== zoneObj.value);
            } else {
                // Add city (Enforce Limit)
                if (prev.length >= 3) {
                    toast.error("You can select max 3 cities.");
                    return prev;
                }
                return [...prev, { name: zoneObj.value, zone: zoneObj.value }];
            }
        });
    };

    // UTC Countdown Logic
    const utcTarget = DateTime.fromObject({ year: currentTime.year + 1, month: 1, day: 1 }, { zone: 'utc' });
    const utcDiff = utcTarget.diff(currentTime, ['days', 'hours', 'minutes', 'seconds']).toObject();

    // Breaking News Logic
    const getRecentlyCelebrated = () => {
        const celebratedCities = [];
        const CelebrationWindowSeconds = 90 * 60;

        ALL_ZONES.forEach(tz => {
            const nowInZone = currentTime.setZone(tz.value);
            if (nowInZone.month === 1 && nowInZone.day === 1) {
                const secondsSinceMidnight = nowInZone.diff(nowInZone.startOf('year'), 'seconds').seconds;
                if (secondsSinceMidnight >= 0 && secondsSinceMidnight < CelebrationWindowSeconds) {
                    const cityName = tz.label.split(') ')[1] || tz.label;
                    celebratedCities.push(cityName);
                }
            }
        });
        return [...new Set(celebratedCities)];
    };

    const recentCelebrations = getRecentlyCelebrated();

    return (
        <div className="space-y-6 relative transition-colors">

            <NewsBanner recentCities={recentCelebrations} />

            <div className="flex flex-col md:flex-row gap-6">
                {/* Main UTC Countdown */}
                <div className="flex-1 bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl text-amber-500">🌍</span>
                    </div>

                    <h3 className="text-amber-500 dark:text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                        World Countdown (UTC)
                    </h3>

                    <div className="flex gap-4 md:gap-8 items-center">
                        {[
                            { label: 'Days', value: Math.max(0, Math.floor(utcDiff.days)) },
                            { label: 'Hours', value: Math.max(0, Math.floor(utcDiff.hours)) },
                            { label: 'Mins', value: Math.max(0, Math.floor(utcDiff.minutes)) },
                            { label: 'Secs', value: Math.max(0, Math.floor(utcDiff.seconds)) },
                        ].map((unit, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="text-3xl md:text-5xl font-black font-mono text-slate-800 dark:text-white tracking-tighter transition-colors">
                                    {String(unit.value).padStart(2, '0')}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">{unit.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personalized Selector */}
                <div className="md:w-1/3 space-y-3">
                    <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl h-full flex flex-col justify-between shadow-sm transition-colors">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Track Any Region</label>
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 focus:border-amber-500 outline-none cursor-pointer mb-4 transition-colors"
                            >
                                {ALL_ZONES.map((z, idx) => (
                                    <option key={idx} value={z.value}>{z.label}</option>
                                ))}
                                {!ALL_ZONES.find(z => z.value === selectedZone) && (
                                    <option value={selectedZone}>Local: {selectedZone}</option>
                                )}
                            </select>
                        </div>
                        <CountdownCard
                            name={selectedZone}
                            zone={selectedZone}
                            currentTime={currentTime}
                            isMain={true}
                        />
                    </div>
                </div>
            </div>

            {/* Custom Watchlist Grid */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        Popular Cities
                    </h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Customize
                    </button>
                </div>

                {watchList.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
                        No cities selected. Click "Customize" to add some!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {watchList.map((city, idx) => (
                            <CountdownCard key={idx} {...city} currentTime={currentTime} />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Portal */}
            <SelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedZones={watchList}
                onToggle={handleToggleCity}
            />
        </div>
    );
};

export default Countdown;