"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { X, Calendar, CheckCircle2, AlertCircle, Loader2, ExternalLink, RefreshCw, Lock } from "lucide-react";
import { connectCalendar, disconnectCalendar, fetchCalendarStatus } from "@/lib/calendarClient";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { FEATURES } from "@/constants/features";

export default function CalendarSettingsModal({ isOpen, onClose, onUpdate }) {
    const { token } = useAuthGuard();
    const { hasFeature } = useFeatureAccess();
    const canUseCalendar = hasFeature(FEATURES.CALENDAR_INTEGRATION);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(null);
    const [disconnecting, setDisconnecting] = useState(null);
    const [connections, setConnections] = useState([]);
    const [error, setError] = useState(null);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchCalendarStatus(token);
            setConnections(res.connections || []);
        } catch (err) {
            console.error("Failed to fetch calendar status", err);
            // setError("Could not load connection status");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isOpen && token) {
            fetchStatus();
        }
    }, [isOpen, token, fetchStatus]);

    const handleConnect = async (provider) => {
        try {
            setConnecting(provider);
            setError(null);
            const res = await connectCalendar(provider, token);
            if (res.url) {
                // Build the current URL to return to
                // Although backend might handle the callback redirect to dashboard
                // We just redirect needed to auth flow
                window.location.href = res.url;
            }
        } catch (err) {
            setError(`Failed to initiate ${provider} connection`);
        } finally {
            setConnecting(null);
        }
    };

    const handleDisconnect = async (provider) => {
        try {
            setDisconnecting(provider);
            setError(null);
            await disconnectCalendar(provider, token);
            await fetchStatus();
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(`Failed to disconnect ${provider}`);
        } finally {
            setDisconnecting(null);
        }
    };

    const isConnected = (provider) => {
        return connections.find(c => c.provider === provider);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-border"
            >
                <div className="p-4 border-b border-border flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-primary" size={20} />
                        <h3 className="font-bold text-lg text-text-heading">Calendar Integrations</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-200 text-text-muted transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-text-muted">
                        Connect your calendars to see upcoming meetings directly in your dashboard.
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {!canUseCalendar ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                                <Lock className="text-amber-500 mt-0.5" size={18} />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Upgrade required</p>
                                    <p className="text-xs text-amber-700 mt-1">
                                        Calendar connections are available on the Pro plan. Upgrade your subscription on
                                        the Subscription tab to unlock Google Calendar and Calendly integrations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Google Calendar */}
                            {/* <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 hover:border-border transition-colors bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center p-2 shadow-sm">
                                    <img src={`https://img.logo.dev/google.com?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`} alt="Google" className="w-full h-full" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-text-heading text-sm">Google Calendar</h4>
                                    {isConnected('google') ? (
                                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
                                            <CheckCircle2 size={12} />
                                            Connected as {isConnected('google').email}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-text-muted mt-0.5">Sync meetings from Google</p>
                                    )}
                                </div>
                            </div>

                            {loading ? (
                                <div className="w-20 h-8 bg-gray-100 animate-pulse rounded-md" />
                            ) : isConnected('google') ? (
                                <button
                                    onClick={() => handleDisconnect('google')}
                                    disabled={disconnecting === 'google'}
                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                                >
                                    {disconnecting === 'google' ? <Loader2 size={14} className="animate-spin" /> : "Disconnect"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleConnect('google')}
                                    disabled={connecting === 'google'}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-md transition-colors shadow-sm shadow-primary/20 flex items-center gap-2"
                                >
                                    {connecting === 'google' ? <Loader2 size={14} className="animate-spin" /> : "Connect"}
                                </button>
                            )}
                        </div> */}

                            {/* Calendly */}
                            <div className="flex items-center flex-wrap justify-between p-4 rounded-lg border border-border/60 hover:border-border transition-colors bg-white shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center p-2 shadow-sm">
                                        <Image
                                            src={`https://img.logo.dev/calendly.com?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
                                            alt="Calendly"
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-text-heading text-sm">Calendly</h4>
                                        {isConnected('calendly') ? (
                                            <div className="flex items-center gap-1 text-xs text-green-600 font-medium mt-0.5">
                                                <CheckCircle2 size={12} />
                                                Connected as {isConnected('calendly').email}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-text-muted mt-0.5">Sync scheduled events</p>
                                        )}
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="w-20 h-8 bg-gray-100 animate-pulse rounded-md" />
                                ) : isConnected('calendly') ? (
                                    <button
                                        onClick={() => handleDisconnect('calendly')}
                                        disabled={disconnecting === 'calendly'}
                                        className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                                    >
                                        {disconnecting === 'calendly' ? <Loader2 size={14} className="animate-spin" /> : "Disconnect"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleConnect('calendly')}
                                        disabled={connecting === 'calendly'}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-md transition-colors shadow-sm shadow-primary/20 flex items-center gap-2"
                                    >
                                        {connecting === 'calendly' ? <Loader2 size={14} className="animate-spin" /> : "Connect"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-text-heading bg-white border border-border rounded-md hover:bg-gray-50 shadow-sm transition-all"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
