import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 px-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link to="/" className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-300 dark:to-orange-500">
                        Live New Year
                    </Link>
                    <Link to="/" className="text-sm font-bold text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 transition-colors">
                        ← Back to App
                    </Link>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-12 prose dark:prose-invert">
                <h1>Privacy Policy</h1>
                <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

                <h3>1. Introduction</h3>
                <p>Live New Year ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.</p>

                <h3>2. Information We Collect</h3>
                <p>We do not collect personal information (like names or emails) unless you voluntarily provide it (e.g., when submitting a wish). We may collect non-personal information such as browser type, operating system, and IP address for analytics purposes.</p>

                <h3>3. Cookies and Web Beacons</h3>
                <p>Like any other website, Live New Year uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited.</p>

                <h3>4. Google AdSense & DoubleClick DART Cookie</h3>
                <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.</p>
                <ul>
                    <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</li>
                    <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
                    <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Ads Settings</a>.</li>
                </ul>

                <h3>5. Consent</h3>
                <p>By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.</p>
            </main>
        </div>
    );
};

export default PrivacyPage;