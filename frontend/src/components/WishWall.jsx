import React, { useState } from 'react';
import axios from 'axios';
import { DateTime } from 'luxon';

const WishWall = ({ wishes, currentTime, isWsConnected }) => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const WS_TIMEOUT = import.meta.env.WS_TIMEOUT || 300;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            // Auto-detect user timezone
            const region = Intl.DateTimeFormat().resolvedOptions().timeZone;

            await axios.post(`${API_URL}/wish`, {
                name: name || "Anonymous",
                message,
                region
            });

            setMessage('');
            //   onWishPosted(); // Trigger refresh
        } catch (err) {
            console.error("Failed to post wish", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Form Section */}
            <div className="md:w-1/3 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                <h3 className="text-xl font-bold text-amber-400 mb-4">Make a Wish ✨</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Name (Optional)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-amber-400 focus:outline-none transition-colors"
                            placeholder="Anonymous"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={200}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm h-24 resize-none focus:border-amber-400 focus:outline-none transition-colors"
                            placeholder="Happy New Year from..."
                        />
                        <div className="text-right text-xs text-slate-500 mt-1">{message.length}/200</div>
                    </div>
                    <button
                        disabled={isSubmitting}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <span>Send to the World</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Feed Section */}
            <div className="md:w-2/3 bg-slate-800/50 rounded-xl border border-slate-700 p-4 flex flex-col h-[370px] relative">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg z-10">
                    <h3 className="text-lg font-semibold text-slate-300 pl-2">Live Global Wishes</h3>
                    {!isWsConnected && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/50 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Disconnected</span>
                        </div>
                    ) || (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/50 rounded-full animate-pulse">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-tighter">Live</span>
                        </div>
                    )}
                </div>

                <div className="wish-scroll overflow-y-auto flex-1 space-y-4 pr-2">
                    {!isWsConnected && (
                        <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg text-center mb-4 flex flex-col gap-2 shadow-2xl">
                            {/* <p className="text-xs text-slate-400">Connection lost! Attempting to reconnect...</p> */}
                            <p className="text-xs text-slate-400">Once connected, the session remains active for {WS_TIMEOUT/60} minutes.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-[10px] text-amber-500 font-bold hover:underline"
                            >
                                Reload Page
                            </button>
                        </div>
                    )}
                    {wishes.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">Be the first to wish the world a Happy New Year!</div>
                    ) : (
                        wishes.map((w, idx) => {
                            const messageTime = DateTime.fromISO(w.timestamp, { zone: 'utc' });
                            const diffSeconds = Math.abs(
                                currentTime.diff(messageTime, 'seconds').seconds
                            );

                            const timeLablel = diffSeconds < 60 ? "just now" : messageTime.toRelative({ base: currentTime });
                            return (
                                <div key={idx} className="flex flex-col items-start gap-1 w-full">
                                    <div className="flex justify-between items-center bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 hover:border-amber-500/30 transition-all shadow-md w-full max-w-[100%] group">
                                        <span className="text-slate-100 text-sm leading-relaxed">"{w.message}"</span>
                                        <span className="text-[10px] text-slate-500 italic">
                                            {w.region}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 text-[9px] text-slate-600 ml-1">
                                        <span className="text-amber-400 text-[11px] tracking-tight capitalize">
                                            - {w.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500 italic">
                                            {timeLablel}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default WishWall;