import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { DateTime } from 'luxon';

const TimeCapsule = () => {
    // View State: 'seal' | 'success' | 'open'
    const [view, setView] = useState('seal');
    
    // Seal State
    const [message, setMessage] = useState('');
    const [targetDate, setTargetDate] = useState('2026-01-01');
    const [capsuleId, setCapsuleId] = useState('');
    
    // Open State
    const [inputKey, setInputKey] = useState('');
    const [retrievedCapsule, setRetrievedCapsule] = useState(null);

    // Global Stats
    const [totalSealed, setTotalSealed] = useState(0);
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/capsule/stats`);
                setTotalSealed(res.data.total_sealed);
            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, [view]);

    // --- Actions ---

    const handleSeal = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const selected = DateTime.fromISO(targetDate);
        if (selected <= DateTime.now()) {
            toast.error("Unlock date must be in the future!");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/capsule`, {
                message,
                unlock_date: `${targetDate}T00:00:00Z`,
                is_public: true
            });
            
            setCapsuleId(res.data.id);
            setView('success');
            setMessage(''); 
            toast.success("Sealed! Save your key.");
        } catch (err) {
            toast.error("Failed to seal. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = async (e) => {
        e.preventDefault();
        if (!inputKey.trim()) return;

        setLoading(true);
        setRetrievedCapsule(null);
        try {
            const res = await axios.get(`${API_URL}/capsule/${inputKey.trim()}`);
            setRetrievedCapsule(res.data);
            if (res.data.status === 'locked') {
                toast("Capsule found, but it's still locked! 🔒");
            } else {
                toast.success("Capsule Unlocked! 🎉");
            }
        } catch (err) {
            toast.error("Capsule not found. Check your key.");
        } finally {
            setLoading(false);
        }
    };

    const copyKey = () => {
        navigator.clipboard.writeText(capsuleId);
        toast.success("Key copied to clipboard!");
    };

    // --- Render Helpers ---

    const TabButton = ({ active, label, onClick }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${
                active 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl p-8 relative overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl transition-colors duration-300">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                
                {/* Left: Info Side */}
                <div className="flex-1 space-y-4">
                    <div className="flex gap-2 mb-2">
                        <TabButton active={view === 'seal' || view === 'success'} label="Create Capsule" onClick={() => setView('seal')} />
                        <TabButton active={view === 'open'} label="Open Capsule" onClick={() => setView('open')} />
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                        {view === 'open' ? 'Unlock the Past 🔓' : 'Message to the Future ⏳'}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm transition-colors">
                        {view === 'open' 
                            ? "Enter your Recovery Key to check if your time capsule is ready to open." 
                            : "Write a message now. We'll lock it in the vault. Use your key to retrieve it when the date arrives."}
                    </p>
                    <div className="text-xs font-mono text-slate-400 dark:text-slate-500 pt-4">
                        {totalSealed.toLocaleString()} capsules in the vault.
                    </div>
                </div>

                {/* Right: Interactive Side */}
                <div className="w-full md:w-1/2 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors min-h-[300px] flex flex-col justify-center">
                    
                    {/* VIEW: SEAL FORM */}
                    {view === 'seal' && (
                        <form onSubmit={handleSeal} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unlock Date</label>
                                <input 
                                    type="date" required value={targetDate}
                                    min={DateTime.now().plus({ days: 1 }).toFormat('yyyy-MM-dd')}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message</label>
                                <textarea
                                    value={message} required onChange={(e) => setMessage(e.target.value)}
                                    placeholder="I hope you accomplished..."
                                    maxLength={500}
                                    className="w-full h-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                                />
                            </div>
                            <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex justify-center">
                                {loading ? 'Sealing...' : 'Seal Capsule 🔒'}
                            </button>
                        </form>
                    )}

                    {/* VIEW: SUCCESS (KEY DISPLAY) */}
                    {view === 'success' && (
                        <div className="text-center space-y-4 animate-in zoom-in duration-300">
                            <div className="text-4xl">🔐</div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white">Capsule Secured!</h4>
                            <p className="text-xs text-slate-500">Save this key. You will need it to unlock your message.</p>
                            
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-3 rounded-lg flex items-center justify-between gap-2">
                                <code className="text-sm font-mono text-amber-800 dark:text-amber-400 truncate">{capsuleId}</code>
                                <button onClick={copyKey} className="text-amber-600 hover:text-amber-800 dark:text-amber-400 font-bold text-xs uppercase">Copy</button>
                            </div>

                            <button onClick={() => setView('seal')} className="text-xs text-slate-400 hover:text-slate-600 underline">Create Another</button>
                        </div>
                    )}

                    {/* VIEW: OPEN CAPSULE */}
                    {view === 'open' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {!retrievedCapsule ? (
                                <form onSubmit={handleOpen} className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recovery Key</label>
                                        <input 
                                            type="text" required value={inputKey}
                                            onChange={(e) => setInputKey(e.target.value)}
                                            placeholder="Paste your UUID here..."
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <button disabled={loading} className="w-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 py-3 rounded-lg font-bold text-sm shadow-lg transition-all">
                                        {loading ? 'Searching...' : 'Find Capsule 🔎'}
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center">
                                    {retrievedCapsule.status === 'locked' ? (
                                        <>
                                            <div className="text-3xl mb-2">⏳</div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">Still Locked</h4>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Opens in <span className="font-mono font-bold">{retrievedCapsule.days_remaining}</span> days.
                                            </p>
                                            <div className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest">
                                                Target: {DateTime.fromISO(retrievedCapsule.unlock_date).toLocaleString(DateTime.DATE_MED)}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-3xl mb-2">🎉</div>
                                            <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">Message Unlocked!</h4>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-indigo-100 dark:border-slate-700 text-sm italic text-slate-700 dark:text-slate-300 shadow-inner">
                                                "{retrievedCapsule.message}"
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-4">
                                                Sealed on {DateTime.fromISO(retrievedCapsule.created_at).toLocaleString(DateTime.DATE_MED)}
                                            </div>
                                        </>
                                    )}
                                    <button onClick={() => setRetrievedCapsule(null)} className="mt-4 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline">Check Another</button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default memo(TimeCapsule);