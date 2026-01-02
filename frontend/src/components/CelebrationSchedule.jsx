import React, { useMemo, memo } from 'react';
import { DateTime } from 'luxon';

// Comprehensive list of major timezones
const ALL_ZONES = [
    { label: "Kiritimati (UTC+14)", value: "Pacific/Kiritimati" },
    { label: "Auckland (UTC+12)", value: "Pacific/Auckland" },
    { label: "Sydney (UTC+10)", value: "Australia/Sydney" },
    { label: "Tokyo (UTC+9)", value: "Asia/Tokyo" },
    { label: "Shanghai (UTC+8)", value: "Asia/Shanghai" },
    { label: "Bangkok (UTC+7)", value: "Asia/Bangkok" },
    { label: "Dhaka (UTC+6)", value: "Asia/Dhaka" },
    { label: "New Delhi (UTC+5:30)", value: "Asia/Kolkata" },
    { label: "Dubai (UTC+4)", value: "Asia/Dubai" },
    { label: "Moscow (UTC+3)", value: "Europe/Moscow" },
    { label: "Cairo (UTC+2)", value: "Africa/Cairo" },
    { label: "Paris (UTC+1)", value: "Europe/Paris" },
    { label: "London (UTC+0)", value: "Europe/London" },
    { label: "Azores (UTC-1)", value: "Atlantic/Azores" },
    { label: "Rio de Janeiro (UTC-3)", value: "America/Sao_Paulo" },
    { label: "New York (UTC-5)", value: "America/New_York" },
    { label: "Chicago (UTC-6)", value: "America/Chicago" },
    { label: "Denver (UTC-7)", value: "America/Denver" },
    { label: "Los Angeles (UTC-8)", value: "America/Los_Angeles" },
    { label: "Anchorage (UTC-9)", value: "America/Anchorage" },
    { label: "Honolulu (UTC-10)", value: "Pacific/Honolulu" },
    { label: "Pago Pago (UTC-11)", value: "Pacific/Pago_Pago" }
];

const CelebrationSchedule = ({ currentTime }) => {
    // Dynamic Logic: Sort zones by "closest to midnight"
    const sortedZones = useMemo(() => {
        return ALL_ZONES.map(z => {
            const zoneTime = currentTime.setZone(z.value);
            
            // Logic: Target is the upcoming Jan 1st. 
            // If Jan 1st was < 24 hours ago, we show that (Celebrated).
            // Otherwise we show the next one.
            const thisYearNewYear = DateTime.fromObject({ year: zoneTime.year, month: 1, day: 1 }, { zone: z.value });
            const nextYearNewYear = DateTime.fromObject({ year: zoneTime.year + 1, month: 1, day: 1 }, { zone: z.value });

            // Diff in hours from NOW
            const diffThis = thisYearNewYear.diff(zoneTime, 'hours').hours;
            
            let target = nextYearNewYear;
            // If the celebration was within the last 24 hours, use that as the target
            if (diffThis > -24 && diffThis <= 0) {
                 target = thisYearNewYear;
            }

            const diffHours = target.diff(zoneTime, 'hours').hours;
            
            return { ...z, target, diffHours };
        }).sort((a, b) => a.diffHours - b.diffHours); // Sort by time remaining
    }, [currentTime]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-[500px] transition-colors duration-300"> 
            {/* Fixed Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">📅 Celebration Schedule</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tracking the arrival of midnight globally</p>
                    </div>
                     <span className="text-2xl animate-pulse">🕰️</span>
                </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/90 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-3 font-semibold tracking-wider">Region</th>
                            <th className="px-6 py-3 font-semibold tracking-wider">Time Check</th>
                            <th className="px-6 py-3 font-semibold tracking-wider text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedZones.map((city) => {
                            const userLocalTime = city.target.toLocal();
                            const isCelebrated = city.diffHours <= 0;
                            const isSoon = city.diffHours > 0 && city.diffHours < 24;
                            
                            // Dynamic Styling based on status
                            let statusClass = "text-slate-500 dark:text-slate-500 font-medium";
                            let statusLabel = "Waiting";
                            let rowClass = "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150 group";

                            if (isCelebrated) {
                                statusClass = "text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1";
                                statusLabel = <><span>Done</span> ✓</>;
                                rowClass += " bg-emerald-50/50 dark:bg-emerald-900/10";
                            } else if (isSoon) {
                                statusClass = "text-amber-600 dark:text-amber-400 font-bold animate-pulse justify-end flex";
                                statusLabel = "Incoming!";
                                rowClass += " bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-l-amber-500";
                            } else {
                                statusClass += " text-right block";
                            }

                            return (
                                <tr key={city.value} className={rowClass}>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {city.label.split('(')[0].trim()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                            {city.value}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                                            {userLocalTime.toFormat("HH:mm")}
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                            {userLocalTime.toFormat("MMM dd")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={statusClass}>
                                            {statusLabel}
                                        </div>
                                        {!isCelebrated && (
                                            <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                                                {Math.floor(city.diffHours)}h {Math.floor((city.diffHours % 1) * 60)}m
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* Footer Legend */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[10px] text-center text-slate-400 flex justify-center gap-4 shrink-0">
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Celebrated</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Up Next</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Later</span>
            </div>
        </div>
    );
};

export default memo(CelebrationSchedule);