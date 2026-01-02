import React, { useEffect, useState, memo } from 'react';
import axios from 'axios';
import { DateTime } from 'luxon';

const HolidaysToday = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Get today's date string in YYYY-MM-DD format (matches API)
    const today = DateTime.now();
    const dateString = today.toFormat('yyyy-MM-dd');
    
    // Browser-native country name translator
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                // Fetches the next 7 days of holidays worldwide
                const res = await axios.get('https://date.nager.at/api/v3/NextPublicHolidaysWorldwide');
                
                // Filter for holidays happening TODAY
                const todaysHolidays = res.data.filter(h => h.date === dateString);
                
                // If nothing today, take the first 3 upcoming ones
                if (todaysHolidays.length > 0) {
                    setHolidays(todaysHolidays.slice(0, 5)); // Limit to top 5
                } else {
                    setHolidays(res.data.slice(0, 3));
                }
            } catch (err) {
                console.error("Failed to fetch holidays", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchHolidays();
    }, [dateString]);

    const getCountryName = (code) => {
        try {
            return regionNames.of(code);
        } catch (e) {
            return code;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Global Celebration Feed
                    </h4>
                    <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                        {loading ? (
                            <span className="animate-pulse">Scanning the globe... 🌍</span>
                        ) : holidays.length > 0 && holidays[0].date === dateString ? (
                            <span>Live <span className="text-amber-600 dark:text-amber-400">Today</span></span>
                        ) : (
                            <span>Coming Up Next 🗓️</span>
                        )}
                    </div>
                </div>
                <div className="hidden md:block text-4xl opacity-10 grayscale">
                    🎉
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 relative z-10">
                {error && (
                    <div className="text-sm text-slate-500 italic">
                        Could not fetch live data. It's a quiet day on Earth today!
                    </div>
                )}

                {!loading && !error && holidays.map((holiday, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-lg shadow-sm font-bold text-slate-400">
                            {holiday.countryCode}
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                {holiday.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {holiday.date !== dateString && (
                                    <span className="mr-2 font-mono text-amber-600 dark:text-amber-500">
                                        {DateTime.fromISO(holiday.date).toFormat('MMM dd')} •
                                    </span>
                                )}
                                {getCountryName(holiday.countryCode)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
        </div>
    );
};

export default memo(HolidaysToday);