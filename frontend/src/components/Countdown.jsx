import React, { useState } from 'react';
import { DateTime } from 'luxon';

const POPULAR_CITIES = [
    { name: 'Australia/Sydney', zone: 'Australia/Sydney' },
    { name: 'Asia/Tokyo', zone: 'Asia/Tokyo' },
    { name: 'Asia/Kolkata', zone: 'Asia/Kolkata' },
    { name: 'Europe/London', zone: 'Europe/London' },
    { name: 'America/New_York', zone: 'America/New_York' },
];

const ALL_ZONES = [
    { label: "(UTC-12) Baker Island", value: "Pacific/Waitangi" },
    { label: "(UTC-11) Pago Pago", value: "Pacific/Pago_Pago" },
    { label: "(UTC-10) Honolulu", value: "Pacific/Honolulu" },
    { label: "(UTC-9) Anchorage", value: "America/Anchorage" },
    { label: "(UTC-8) Los Angeles", value: "America/Los_Angeles" },
    { label: "(UTC-7) Denver", value: "America/Denver" },
    { label: "(UTC-6) Chicago", value: "America/Chicago" },
    { label: "(UTC-5) New York", value: "America/New_York" },
    { label: "(UTC-4) Santiago", value: "America/Santiago" },
    { label: "(UTC-3) Buenos Aires", value: "America/Argentina/Buenos_Aires" },
    { label: "(UTC-2) South Georgia", value: "Atlantic/South_Georgia" },
    { label: "(UTC-1) Azores", value: "Atlantic/Azores" },
    { label: "(UTC+0) London", value: "Europe/London" },
    { label: "(UTC+1) Paris", value: "Europe/Paris" },
    { label: "(UTC+2) Cairo", value: "Africa/Cairo" },
    { label: "(UTC+3) Moscow", value: "Europe/Moscow" },
    { label: "(UTC+4) Dubai", value: "Asia/Dubai" },
    { label: "(UTC+5) Karachi", value: "Asia/Karachi" },
    { label: "(UTC+5:30) Kolkata", value: "Asia/Kolkata" },
    { label: "(UTC+6) Dhaka", value: "Asia/Dhaka" },
    { label: "(UTC+7) Bangkok", value: "Asia/Bangkok" },
    { label: "(UTC+8) Shanghai", value: "Asia/Shanghai" },
    { label: "(UTC+9) Tokyo", value: "Asia/Tokyo" },
    { label: "(UTC+10) Sydney", value: "Australia/Sydney" },
    { label: "(UTC+11) Noumea", value: "Pacific/Noumea" },
    { label: "(UTC+12) Auckland", value: "Pacific/Auckland" },
    { label: "(UTC+13) Tongatapu", value: "Pacific/Tongatapu" },
    { label: "(UTC+14) Kiritimati", value: "Pacific/Kiritimati" },
];

const CountdownCard = ({ name, zone, currentTime, isMain = false }) => {
    const nextYear = currentTime.setZone(zone).year + 1;
    const target = DateTime.fromObject({ year: nextYear, month: 1, day: 1 }, { zone });
    const diff = target.diff(currentTime.setZone(zone), ['hours', 'minutes', 'seconds']).toObject();

    const isSoon = diff.hours < 24 && diff.hours >= 0;

    return (
        <div className={`${isMain ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800/40 border-slate-700/50'} border p-3 rounded-lg hover:border-amber-500/30 transition-all shadow-lg`}>
            <div className={`text-[10px] uppercase tracking-widest mb-1 ${isMain ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                {isMain ? 'Personalized View' : ''} {name.split('/').pop().replace('_', ' ')}
            </div>
            <div className={`text-lg font-mono font-bold ${isSoon ? 'text-amber-400' : 'text-slate-200'} ${isMain ? 'text-2xl' : ''}`}>
                {String(Math.floor(diff.hours)).padStart(2, '0')}:
                {String(Math.floor(diff.minutes)).padStart(2, '0')}:
                {String(Math.floor(diff.seconds)).padStart(2, '0')}
            </div>
            <div className="text-[9px] text-slate-600 mt-1 italic">until New Year</div>
        </div>
    );
};

const Countdown = ({ currentTime }) => {
    const [selectedZone, setSelectedZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const utcTarget = DateTime.fromObject({ year: currentTime.year + 1, month: 1, day: 1 }, { zone: 'utc' });
    const utcDiff = utcTarget.diff(currentTime, ['days', 'hours', 'minutes', 'seconds']).toObject();

    return (
        <div className="space-y-6">
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
                            { label: 'Days', value: Math.floor(utcDiff.days) },
                            { label: 'Hours', value: Math.floor(utcDiff.hours) },
                            { label: 'Mins', value: Math.floor(utcDiff.minutes) },
                            { label: 'Secs', value: Math.floor(utcDiff.seconds) },
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
