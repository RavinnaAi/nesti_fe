"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Video, MoreHorizontal, User, ArrowRight, CheckCircle2, Loader2, RefreshCw, Settings2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { fetchBookings } from "@/lib/calendarClient";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function UpcomingMeetings({ onOpenSettings }) {
    const { token } = useAuthGuard();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadMeetings = async () => {
        try {
            setLoading(true);
            const data = await fetchBookings(token);
            setMeetings(data?.bookings || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch meetings", err);
            // Don't show error to user immediately, maybe just empty state
            // setError("Failed to load meetings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            loadMeetings();
        }
    }, [token]);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="bg-white rounded-md border border-border shadow-lg shadow-primary/5 overflow-hidden flex flex-col min-h-[12rem] relative">
            <div className="p-4 border-b border-border flex items-center justify-between bg-background-light/20">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-heading">Upcoming Meetings</h3>
                    <button
                        onClick={loadMeetings}
                        className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenSettings}
                        className="text-xs font-bold text-text-muted hover:text-primary flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                    >
                        <Settings2 size={14} />
                        Manage
                    </button>
                    {/* <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors">
                        View Calendar <ArrowRight size={14} />
                    </button> */}
                </div>
            </div>

            <div className="divide-y divide-border/60 flex-1">
                {loading && meetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                        <Loader2 size={24} className="animate-spin mb-2" />
                        <p className="text-xs">Loading schedule...</p>
                    </div>
                ) : meetings.length > 0 ? (
                    meetings.map((meeting, idx) => (
                        <motion.div
                            key={meeting.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 hover:bg-background-light/30 transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-md flex items-center justify-center border shrink-0 ${meeting.provider === 'google' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                        'bg-gray-50 border-gray-100 text-gray-600'
                                        }`}>
                                        {meeting.provider === 'google' ? (
                                            <img src={`https://img.logo.dev/google.com?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`} className="w-5 h-5" alt="Google" />
                                        ) : meeting.provider === 'calendly' ? (
                                            <img src={`https://img.logo.dev/calendly.com?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`} className="w-5 h-5 object-contain" alt="Calendly" />
                                        ) : (
                                            <Calendar size={20} />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-sm text-text-heading line-clamp-1">{meeting.title}</h4>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-text-muted">
                                            <span className="flex items-center gap-1 font-medium text-text-heading/80">
                                                <Clock size={12} className="text-primary" />
                                                {formatDate(meeting.startTime)}
                                            </span>
                                            {meeting.provider && (
                                                <span className="flex items-center gap-1 capitalize">
                                                    {meeting.provider === 'google' ? 'Google Meet' : 'Calendly'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex gap-2">
                                        {meeting.link && (
                                            <a
                                                href={meeting.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-7 px-3 rounded-md bg-primary text-white text-[10px] font-bold shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-1"
                                            >
                                                Join <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-md bg-background-light flex items-center justify-center text-text-muted">
                            <Calendar size={24} />
                        </div>
                        <p className="text-sm font-semibold text-text-heading">No Upcoming Meetings</p>
                        <p className="text-xs text-text-muted max-w-[250px]">
                            Connect your Google Calendar or Calendly to see your upcoming schedule here.
                        </p>
                        <button
                            onClick={onOpenSettings}
                            className="text-xs font-bold text-primary hover:underline border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-md hover:bg-primary/10 transition-all flex items-center gap-2"
                        >
                            <LinkIcon size={12} /> Connect Calendar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
