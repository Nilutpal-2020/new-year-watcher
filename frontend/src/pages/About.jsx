import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle'; // Assuming this component exists

const About = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans selection:bg-amber-500 selection:text-white">
            {/* Dynamic SEO Head */}
            <title>About - Live New Year</title>
            <meta name="description" content="Learn about the philosophy and technology behind Live New Year, a real-time global celebration tracker built with React and FastAPI." />
            <link rel="canonical" href="https://new-year-watcher.vercel.app/about" />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 px-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link to="/" className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-300 dark:to-orange-500">
                        Live New Year
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm font-bold text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
                            ← Back to Map
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-16 space-y-16">

                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                        Celebrating Time as a <br />
                        <span className="text-amber-500 dark:text-amber-400">Shared Human Experience</span>
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
                        Timezones often divide us, creating distance. Live New Year exists to do the opposite:
                        visualizing the one moment in the year where the entire world shares a single, rolling celebration.
                    </p>
                </section>

                {/* Divider */}
                <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full opacity-50"></div>

                {/* How it Works */}
                <section className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500/30 transition-colors">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 text-2xl">
                            🌏
                        </div>
                        <h2 className="text-xl font-bold mb-3 dark:text-white">The Science</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            We calculate the "Midnight Line" using UTC offsets. As the Earth rotates 15° per hour,
                            our algorithm updates the map in real-time, highlighting regions crossing into Jan 1st based on their longitude.
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500/30 transition-colors">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 text-2xl">
                            ⚡
                        </div>
                        <h2 className="text-xl font-bold mb-3 dark:text-white">The Tech</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            Built for performance. The frontend uses <strong>React + Leaflet</strong> for fluid visualization,
                            while a <strong>FastAPI + Redis</strong> backend handles real-time global wish syncing via WebSockets.
                        </p>
                    </div>
                </section>

                {/* Philosophy */}
                <section className="bg-slate-100 dark:bg-slate-800/50 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                    <h3 className="text-2xl font-bold mb-4 dark:text-white">Minimalism by Design</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">
                        We believe in software that respects your attention. No ads, no tracking cookies, no clutter.
                        Just a map, a clock, and the wishes of people around the world.
                    </p>
                    <div className="flex justify-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-500">
                        <span>React 19</span> • <span>FastAPI</span> • <span>Redis</span>
                    </div>
                </section>

            </main>

            <footer className="border-t border-slate-200 dark:border-slate-800 py-12 text-center">
                <p className="text-slate-500 dark:text-slate-600 text-sm">
                    © {new Date().getFullYear()} Live New Year.
                </p>
            </footer>
        </div>
    );
};

export default About;