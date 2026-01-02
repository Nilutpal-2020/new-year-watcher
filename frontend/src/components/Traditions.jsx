import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';

const Traditions = () => {
    const [traditions, setTraditions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Use your backend URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const fetchTraditions = async () => {
        setLoading(true);
        try {
            // Hit your new Redis-backed endpoint
            const res = await axios.get(`${API_URL}/traditions?limit=4`);
            setTraditions(res.data);
        } catch (err) {
            console.error("Failed to load traditions", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on mount
    useEffect(() => {
        fetchTraditions();
    }, []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">🌍</span> Global Traditions
                </h3>
                <button 
                    onClick={fetchTraditions} 
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                    disabled={loading}
                >
                    <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Shuffle
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {traditions.map((t, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-amber-500/30 transition-all group">
                            <div className="flex items-center gap-2 mb-2">
                                {/* Ensure you have 'flag-icons' installed or use an emoji fallback */}
                                <span className={`fi fi-${t.icon} rounded shadow-sm text-lg`}></span> 
                                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm uppercase tracking-wider group-hover:text-amber-500 transition-colors">
                                    {t.country}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 italic">
                    Did you know? 2026 is the Year of the Horse! 🐎
                </p>
            </div>
        </div>
    );
};

export default memo(Traditions);