import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const QuoteGenerator = () => {
    const [quotes, setQuotes] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState('all');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('generate'); // 'generate' or 'submit'

    // Submission Form State
    const [formData, setFormData] = useState({
        text: '',
        author: '',
        theme: 'motivation'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // --- Fetch Logic ---
    const fetchQuotes = async (theme) => {
        setLoading(true);
        const limit = theme === 'all' ? 3 : 3;
        try {
            const url = theme === 'all'
                ? `${API_URL}/quotes?limit=${limit}`
                : `${API_URL}/quotes?theme=${theme}&limit=${limit}`;

            const res = await axios.get(url);
            setQuotes(res.data);
        } catch (e) {
            console.error("Failed to fetch quotes", e);
            toast.error("Couldn't load quotes. The database might be empty!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'generate') {
            fetchQuotes(selectedTheme);
        }
    }, [view]);

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
        fetchQuotes(theme);
    };

    // --- Submission Logic ---
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.text.trim()) {
            toast.error("Quote text is required");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/quotes`, {
                text: formData.text,
                author: formData.author || "Anonymous",
                theme: formData.theme
            });

            toast.success("Quote submitted successfully! It's now in the mix.");
            setFormData({ text: '', author: '', theme: 'motivation' }); // Reset form
            setView('generate'); // Switch back to see it potentially
        } catch (err) {
            console.error(err);
            if (err.response?.status === 400) {
                toast.error(err.response.data.detail || "Invalid input (profanity or length).");
            } else if (err.response?.status === 429) {
                toast.error("You're doing that too much. Slow down!");
            } else {
                toast.error("Failed to submit quote.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = (text, author) => {
        navigator.clipboard.writeText(`"${text}" — ${author}`);
        toast.success("Copied to clipboard!");
    };

    const themes = [
        { id: 'all', label: 'Surprise Me', emoji: '🎲' },
        { id: 'motivation', label: 'Motivation', emoji: '💪' },
        { id: 'reflection', label: 'Reflection', emoji: '🤔' },
        { id: 'joy', label: 'Joy & Hope', emoji: '✨' },
    ];

    const submissionThemes = themes.filter(t => t.id !== 'all');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 px-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link to="/" className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-300 dark:to-orange-500">
                        Live New Year
                    </Link>
                    <div className="flex gap-4 items-center">
                        <Link to="/" className="text-sm font-bold text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
                            ← Back to Map
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-12">

                {/* Header & Toggle */}
                <div className="text-center mb-10 space-y-6">
                    <div>
                        <h1 className="text-4xl font-black mb-2 dark:text-white">
                            {view === 'generate' ? 'Quotes Generator 💡' : 'Contribute a Quote ✍️'}
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            {view === 'generate'
                                ? "Find the perfect words for your New Year."
                                : "Share wisdom with the global community."}
                        </p>
                    </div>

                    <div className="inline-flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setView('generate')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'generate'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Get Quotes
                        </button>
                        <button
                            onClick={() => setView('submit')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'submit'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Submit Your Own
                        </button>
                    </div>
                </div>

                {/* --- GENERATE VIEW --- */}
                {view === 'generate' && (
                    <>
                        {/* Theme Selector */}
                        <div className="flex flex-wrap justify-center gap-3 mb-10">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleThemeChange(t.id)}
                                    className={`px-5 py-3 rounded-full text-sm font-bold transition-all transform active:scale-95 flex items-center gap-2 ${selectedTheme === t.id
                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-400 hover:text-amber-500'
                                        }`}
                                >
                                    <span>{t.emoji}</span> {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Quotes Grid */}
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {quotes.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500">
                                        No quotes found for this theme yet. Be the first to submit one!
                                    </div>
                                ) : (
                                    quotes.map((quote, idx) => (
                                        <div key={idx} className="group relative bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-sm hover:shadow-xl transition-all duration-300">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCopy(quote.text, quote.author)}
                                                    className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                                                    title="Copy"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <blockquote className="text-xl font-serif text-slate-700 dark:text-slate-200 leading-relaxed italic">
                                                "{quote.text}"
                                            </blockquote>

                                            <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
                                                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                                    — {quote.author}
                                                </span>
                                                <span className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-400 font-mono uppercase">
                                                    {quote.theme}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        <div className="mt-12 text-center">
                            <button
                                onClick={() => fetchQuotes(selectedTheme)}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0"
                            >
                                Shuffle Quotes ↻
                            </button>
                        </div>
                    </>
                )}

                {/* --- SUBMIT VIEW --- */}
                {view === 'submit' && (
                    <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Your Quote
                                </label>
                                <textarea
                                    name="text"
                                    value={formData.text}
                                    onChange={handleInputChange}
                                    required
                                    maxLength={200}
                                    placeholder="Write something inspiring..."
                                    className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none transition-colors resize-none text-lg"
                                />
                                <div className="text-right text-xs text-slate-400 mt-1">
                                    {formData.text.length}/200
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        name="author"
                                        value={formData.author}
                                        onChange={handleInputChange}
                                        maxLength={30}
                                        placeholder="Anonymous"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                        Theme
                                    </label>
                                    <select
                                        name="theme"
                                        value={formData.theme}
                                        onChange={handleInputChange}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none transition-colors"
                                    >
                                        {submissionThemes.map(t => (
                                            <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Quote ✨'}
                                </button>
                                <p className="text-center text-xs text-slate-400 mt-4">
                                    Please keep it friendly. Profanity will be rejected.
                                </p>
                            </div>
                        </form>
                    </div>
                )}

            </main>
        </div>
    );
};

export default QuoteGenerator;