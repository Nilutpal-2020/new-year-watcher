import React, { useState } from 'react';

const ShareBlock = () => {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = "Watch the New Year arrive live across the globe! 🌍🎆 Track every timezone here:";

    const handleCopy = () => {
        navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'New Year Watcher',
                    text: text,
                    url: url,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopy(); // Fallback
        }
    };

    const handleInstagramClick = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);

        window.open('https://www.instagram.com/', '_blank');
    };

    return (
        <section className="py-8">
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 overflow-hidden group">
                {/* Background Glow Effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-white mb-2">
                            Don't Watch Alone! 💬
                        </h3>
                        <p className="text-slate-400 text-sm max-w-md">
                            Share the excitement. Send this live dashboard to friends and countdown together across timezones.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        {/* Native Share Button (Mobile friendly) */}
                        <button
                            onClick={handleNativeShare}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                            Share App
                        </button>

                        {/* Direct Social Links (Desktop friendly) */}
                        <div className="flex gap-2">
                            {/* Twitter / X */}
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-800 hover:bg-slate-700 hover:text-white p-3 rounded-xl transition-colors border border-slate-700"
                                aria-label="Share on X"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                            </a>

                            {/* WhatsApp */}
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 p-3 rounded-xl transition-colors border border-slate-700"
                                aria-label="Share on WhatsApp"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </a>

                            <button
                                onClick={handleInstagramClick}
                                className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 p-3 rounded-xl transition-colors border border-slate-700 group/insta"

                                // className="bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 text-white p-3 rounded-xl transition-all border border-white/10 relative group/insta"
                                aria-label="Share on Instagram"
                                title="Copy link & Open Instagram"
                            >
                                {copied ? (
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg animate-bounce w-max">Link Copied!</span>
                                ) : null}
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </button>

                            {/* Copy Link */}
                            <button
                                onClick={handleCopy}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl transition-colors border border-slate-700 relative"
                                aria-label="Copy Link"
                            >
                                {copied ? (
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded">Copied!</span>
                                ) : null}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ShareBlock;