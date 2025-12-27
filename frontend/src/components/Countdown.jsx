import React, { useState } from 'react';
import { DateTime } from 'luxon';

// --- Data Constants ---
const POPULAR_CITIES = [
    { name: 'Australia/Sydney', zone: 'Australia/Sydney' },
    { name: 'Asia/Tokyo', zone: 'Asia/Tokyo' },
    { name: 'Asia/Kolkata', zone: 'Asia/Kolkata' },
    { name: 'Europe/London', zone: 'Europe/London' },
    { name: 'America/New_York', zone: 'America/New_York' },
];

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

// New component for holding breaking news
const NewsBanner = ({ recentCities }) => {
    if (!recentCities || recentCities.length === 0) {
        return null;
    }

    const cityListString = recentCities.join(", ");

    return (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/50 p-4 rounded-2xl mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-2">
                <h4 className="text-amber-400 text-sm font-black uppercase tracking-wider flex items-center shrink-0">
                    <span className="mr-2 text-lg">🎊 Live update:</span>
                </h4>
                <div className="text-slate-100 text-md md:text-lg font-medium">
                    New Year has just arrived in: <span className="font-bold text-amber-300 glow-text">{cityListString}</span>!
                </div>
            </div>
        </div>
    );
};

const CountdownCard = ({ name, zone, currentTime, isMain = false }) => {
    // 1. Calculate future/target dates
    const nextYear = currentTime.setZone(zone).year + 1;
    const target = DateTime.fromObject({ year: nextYear, month: 1, day: 1 }, { zone });
    const diff = target.diff(currentTime.setZone(zone), ['hours', 'minutes', 'seconds']).toObject();

    // 2. Logic for "Happy New Year" vs "Countdown"
    const isPast = diff.hours < 0 || diff.minutes < 0 || diff.seconds < 0;
    const isSoon = diff.hours < 24 && diff.hours >= 0 && !isPast;

    const displayHours = isPast ? 0 : Math.floor(diff.hours);
    const displayMins = isPast ? 0 : Math.floor(diff.minutes);
    const displaySecs = isPast ? 0 : Math.floor(diff.seconds);

    return (
        <div className={`${isMain ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/40 border-slate-700/50'} border p-3 rounded-lg hover:border-amber-500/30 transition-all shadow-lg`}>
            
            {/* Header: City Name */}
            <div className={`text-[10px] uppercase tracking-widest mb-1 ${isMain ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                {isMain ? 'Personalized View:' : ''} {name.split('/').pop().replace('_', ' ')}
            </div>

            {/* >>> NEW: Show Current Local Time (Only for Personalized View) <<< */}
            {isMain && (
                <div className="text-[11px] text-amber-200/60 font-mono mb-2 border-b border-amber-500/10 pb-2">
                    <span className="text-amber-500/40 mr-1">CURRENTLY:</span>
                    {currentTime.setZone(zone).toFormat('DDD HH:mm:ss')}
                </div>
            )}

            {/* Main Countdown Numbers */}
            <div className={`text-lg font-mono font-bold ${isSoon ? 'text-amber-400' : 'text-slate-200'} ${isMain ? 'text-3xl mt-1' : ''}`}>
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

            {/* Footer Text */}
            {!isPast && <div className="text-[9px] text-slate-600 mt-1 italic">until New Year</div>}
        </div>
    );
};

// --- Main Component ---
const Countdown = ({ currentTime }) => {
    const [selectedZone, setSelectedZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    // 1. Calculate UTC Countdown
    const utcTarget = DateTime.fromObject({ year: currentTime.year + 1, month: 1, day: 1 }, { zone: 'utc' });
    const utcDiff = utcTarget.diff(currentTime, ['days', 'hours', 'minutes', 'seconds']).toObject();

    // 2. Logic to find who JUST celebrated
    const getRecentlyCelebrated = () => {
        const celebratedCities = [];
        // Define the window of time to show the news banner (e.g., keep showing for 90 mins after midnight)
        const CelebrationWindowSeconds = 90 * 60; // 5400 seconds

        ALL_ZONES.forEach(tz => {
            // Get the current time in that specific zone
            const nowInZone = currentTime.setZone(tz.value);

            // Check if it is currently January 1st in that zone
            if (nowInZone.month === 1 && nowInZone.day === 1) {
                 // Calculate seconds elapsed since the start of the year (midnight)
                const secondsSinceMidnight = nowInZone.diff(nowInZone.startOf('year'), 'seconds').seconds;

                // If within the window, add to list
                if (secondsSinceMidnight >= 0 && secondsSinceMidnight < CelebrationWindowSeconds) {
                    // Clean up the label to get just the city name "Auckland", "Tokyo", etc.
                    // The label format is "(UTC+XX) CityName"
                    const cityName = tz.label.split(') ')[1] || tz.label;
                    celebratedCities.push(cityName);
                }
            }
        });
        // Remove potential duplicates and return
        return [...new Set(celebratedCities)];
    };

    const recentCelebrations = getRecentlyCelebrated();

    return (
        <div id="dashboard-top" className="space-y-6 relative">

            {/* The New News Banner */}
            <NewsBanner recentCities={recentCelebrations} />

            <div className="flex flex-col md:flex-row gap-6">
                {/* Main UTC Countdown */}
                <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl text-amber-500">🌍</span>
                    </div>

                    <h3 className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
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
                                <div className="text-3xl md:text-5xl font-black font-mono text-white tracking-tighter">
                                    {String(unit.value).padStart(2, '0')}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{unit.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personalized Selector */}
                <div className="md:w-1/3 space-y-3">
                    <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl h-full flex flex-col justify-between">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Track Any Region</label>
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-xs rounded-lg p-2 focus:border-amber-500 outline-none cursor-pointer mb-4"
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

            {/* Popular Cities */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {POPULAR_CITIES.map((city, idx) => (
                    <CountdownCard key={idx} {...city} currentTime={currentTime} />
                ))}
            </div>
        </div>
    );
};

export default Countdown;