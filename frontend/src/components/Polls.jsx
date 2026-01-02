import React, { useEffect, useState, memo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const Polls = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [votedIndex, setVotedIndex] = useState(null); // Local state to track session vote
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const fetchPoll = async () => {
        try {
            const res = await axios.get(`${API_URL}/poll`);
            setData(res.data);
        } catch (e) {
            console.error("Poll fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoll();
    }, []);

    const handleVote = async (index) => {
        if (votedIndex !== null) return; // Prevent double voting in session
        
        // Optimistic UI update
        setVotedIndex(index); 
        
        try {
            const res = await axios.post(`${API_URL}/poll/vote`, { option_index: index });
            setData(res.data);
            toast.success("Vote recorded! 🗳️");
        } catch (e) {
            toast.error("Failed to vote. Try again.");
            setVotedIndex(null);
        }
    };

    if (loading) return <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
    if (!data) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-700 p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold text-indigo-900 dark:text-white mb-2">
                Community Poll 📊
            </h3>
            <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-6 font-medium">
                {data.question}
            </p>

            <div className="space-y-3">
                {data.options.map((opt, idx) => {
                    const percentage = data.total_votes > 0 
                        ? Math.round((data.votes[idx] / data.total_votes) * 100) 
                        : 0;
                    
                    const isWinner = votedIndex === idx;

                    return (
                        <button
                            key={idx}
                            onClick={() => handleVote(idx)}
                            disabled={votedIndex !== null}
                            className="relative w-full text-left group"
                        >
                            {/* Background Bar */}
                            <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-out ${isWinner ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-slate-100 dark:bg-slate-700/30'}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            {/* Content */}
                            <div className="relative z-10 p-3 flex justify-between items-center text-sm">
                                <span className={`font-semibold ${isWinner ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {opt}
                                </span>
                                {votedIndex !== null && (
                                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                                        {percentage}%
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="mt-4 text-xs text-slate-400 text-center">
                Total votes: {data.total_votes}
            </div>
        </div>
    );
};

export default memo(Polls);