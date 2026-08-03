"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Shield,
    Lock,
    Eye,
    FileText,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Globe,
    Server,
    UserCheck,
    Database,
    Clock,
    Mail,
    Phone,
    MapPin,
    Building,
    Award,
    Star,
    MessageSquare,
    CreditCard,
    Smartphone,
    Laptop,
    Cookie,
    Trash2,
    Edit3,
    Download,
    AlertCircle,
    ExternalLink,
} from "lucide-react";

export default function PrivacyPolicyPage() {
    const [accepted, setAccepted] = useState(false);
    const [acceptedDate, setAcceptedDate] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<
        Record<string, boolean>
    >({
        intro: true,
        collection: true,
        use: true,
        share: true,
        cookies: true,
        security: true,
        retention: true,
        rights: true,
        children: true,
        transfers: true,
        changes: true,
        contact: true,
    });

    useEffect(() => {
        const isAccepted = localStorage.getItem("privacy_policy_accepted") === "true";
        const date = localStorage.getItem("privacy_policy_accepted_date");
        if (isAccepted) {
            setAccepted(true);
            setAcceptedDate(date);
        }
    }, []);

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleAccept = () => {
        setAccepted(true);
        const now = new Date().toISOString();
        setAcceptedDate(now);
        localStorage.setItem("privacy_policy_accepted", "true");
        localStorage.setItem("privacy_policy_accepted_date", now);
    };

    const Section = ({
        id,
        title,
        icon,
        children,
        badge,
    }: {
        id: string;
        title: string;
        icon?: React.ReactNode;
        children: React.ReactNode;
        badge?: string;
    }) => {
        const isExpanded = expandedSections[id] ?? true;

        return (
            <section
                className={`border-b border-slate-100 last:border-b-0 py-5 transition-all duration-300 ${isExpanded ? "bg-white" : "bg-slate-50/50"
                    } rounded-xl px-4 -mx-4`}
            >
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        {icon && (
                            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                                {icon}
                            </span>
                        )}
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            {title}
                            {badge && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                    {badge}
                                </span>
                            )}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        )}
                    </div>
                </button>
                {isExpanded && (
                    <div className="mt-4 space-y-4 pl-11">{children}</div>
                )}
            </section>
        );
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "";
        try {
            return new Date(dateString).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "";
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-800 font-sans transition-colors relative overflow-x-hidden">
            <Navbar />

            <main className="max-w-4xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow">
                <div className="space-y-8 animate-fade-up">
                    {/* Header Hero - Premium */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-12 text-white shadow-2xl shadow-blue-600/20">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">
                                        Privacy & Safety Protocol
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                                    Privacy Policy
                                </h1>
                                <p className="text-blue-100 text-sm font-medium">
                                    Last updated: July 28, 2026 • Version 3.0
                                </p>
                            </div>

                            {accepted ? (
                                <div className="bg-emerald-400/20 backdrop-blur-sm border border-emerald-300/30 px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-emerald-400/30 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-emerald-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">Accepted</p>
                                        <p className="text-xs text-blue-100">
                                            {formatDate(acceptedDate)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-400/20 backdrop-blur-sm border border-amber-300/30 px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-amber-400/30 flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-amber-300" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-white">
                                            Action Required
                                        </p>
                                        <p className="text-xs text-blue-100">
                                            Please review and accept
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trust Signals - Premium */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                icon: Lock,
                                title: "Bank-Grade Security",
                                desc: "256-bit encryption for all data",
                                color: "blue",
                            },
                            {
                                icon: Eye,
                                title: "Zero Data Selling",
                                desc: "We never sell your information",
                                color: "emerald",
                            },
                            {
                                icon: Database,
                                title: "GDPR Compliant",
                                desc: "Your data rights are protected",
                                color: "indigo",
                            },
                            {
                                icon: Shield,
                                title: "Audited Systems",
                                desc: "Regular security assessments",
                                color: "purple",
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="group bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-xl hover:border-slate-300/80 transition-all duration-300"
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-sm text-slate-800">
                                    {item.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Document Body - Premium */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 p-6 sm:p-8 lg:p-10 space-y-1">
                        {/* 1. Introduction */}
                        <Section id="intro" title="1. Introduction" icon={<Globe className="w-4 h-4" />}>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                <strong className="text-slate-800">Zenzy Technologies Private Limited</strong>{" "}
                                ("Zenzy", "we", "us", or "our") operates a trusted platform that
                                connects clients with verified businesses, workers, and rental
                                listings for home services, construction, interior design, and
                                related work. This Privacy Policy explains what personal
                                information we collect, how we use and share it, and the choices
                                and rights you have regarding your data when you use our
                                website, mobile app, or related services (together, the
                                "Platform").
                            </p>
                            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">🔒</span>
                                    <span>
                                        By creating an account or otherwise using the Platform, you
                                        agree to the collection and use of information as described
                                        in this Policy. If you do not agree, please do not use the
                                        Platform.
                                    </span>
                                </p>
                            </div>
                        </Section>

                        {/* 2. Information We Collect */}
                        <Section
                            id="collection"
                            title="2. Information We Collect"
                            icon={<Database className="w-4 h-4" />}
                            badge="Detailed"
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We collect various categories of information to provide and
                                improve our services:
                            </p>
                            <div className="overflow-x-auto rounded-xl border border-slate-200/60">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-slate-50 to-blue-50/50">
                                            <th className="text-left p-3 border border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="text-left p-3 border border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wider">
                                                Examples
                                            </th>
                                            <th className="text-left p-3 border border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wider">
                                                Collected When
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            {
                                                category: "Account & Identity",
                                                examples:
                                                    "Name, email, phone, photo, authentication tokens",
                                                when: "Sign-up, login via email/phone/Google",
                                            },
                                            {
                                                category: "Business/Worker Verification",
                                                examples:
                                                    "ID documents, GST, office address, portfolio",
                                                when: "Business or worker onboarding",
                                            },
                                            {
                                                category: "Location",
                                                examples: "Address, pin-drop coordinates, service area",
                                                when: "Booking, listing, map picker",
                                            },
                                            {
                                                category: "Project & Booking Data",
                                                examples:
                                                    "Project briefs, budgets, timelines, messages, files",
                                                when: "Creating projects, workspace usage",
                                            },
                                            {
                                                category: "Reviews & Ratings",
                                                examples: "Ratings, written reviews, photos",
                                                when: "After completed booking",
                                            },
                                            {
                                                category: "Device & Usage",
                                                examples: "IP, browser, device IDs, pages viewed",
                                                when: "Automatically while using Platform",
                                            },
                                            {
                                                category: "Support Communications",
                                                examples: "Messages, contact form submissions",
                                                when: "Contacting support",
                                            },
                                        ].map((row, idx) => (
                                            <tr
                                                key={idx}
                                                className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                                            >
                                                <td className="p-3 border border-slate-200 font-semibold text-slate-700 text-xs">
                                                    {row.category}
                                                </td>
                                                <td className="p-3 border border-slate-200 text-slate-600 text-xs">
                                                    {row.examples}
                                                </td>
                                                <td className="p-3 border border-slate-200 text-slate-600 text-xs">
                                                    {row.when}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        {/* 3. How We Use Your Information */}
                        <Section
                            id="use"
                            title="3. How We Use Your Information"
                            icon={<Server className="w-4 h-4" />}
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We use the information we collect to:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                {[
                                    "Create and manage your account",
                                    "Verify your identity",
                                    "Match clients with relevant services",
                                    "Enable bookings and quotations",
                                    "Process and display reviews",
                                    "Send service-related notifications",
                                    "Provide customer support",
                                    "Detect and prevent fraud",
                                    "Improve and personalize the Platform",
                                    "Comply with legal obligations",
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 bg-slate-50/80 rounded-lg px-3 py-2"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                            <span className="text-[9px] font-bold">{idx + 1}</span>
                                        </div>
                                        <span className="text-xs text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 mt-3">
                                <p className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-indigo-600 mt-0.5">👷</span>
                                    <span>
                                        <strong>For Workers & Businesses:</strong> We create digital
                                        profiles to verify your identity to customers, display
                                        reviews, ratings, and experience histories to foster trust.
                                    </span>
                                </p>
                            </div>
                        </Section>

                        {/* 4. How We Share Your Information */}
                        <Section
                            id="share"
                            title="4. How We Share Your Information"
                            icon={<UserCheck className="w-4 h-4" />}
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                <strong className="text-slate-800">We do not sell your personal information.</strong>{" "}
                                We share information only in the following circumstances:
                            </p>
                            <div className="space-y-3 mt-3">
                                {[
                                    {
                                        icon: Users,
                                        title: "With other users",
                                        desc: "When you book a service or start a project, relevant profile, contact, and project details are shared with the business/worker (or client) involved.",
                                    },
                                    {
                                        icon: Server,
                                        title: "Service providers",
                                        desc: "We use trusted third parties such as Firebase/Google Cloud (authentication, database, hosting, and notifications), Google Maps (location and pin-drop features), and payment processors to operate the Platform.",
                                    },
                                    {
                                        icon: FileText,
                                        title: "Legal requirements",
                                        desc: "We may disclose information if required by law, court order, or government request, or to protect the rights, safety, or property of Zenzy, our users, or the public.",
                                    },
                                    {
                                        icon: Building,
                                        title: "Business transfers",
                                        desc: "If Zenzy is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.",
                                    },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 bg-slate-50/70 rounded-xl p-4 border border-slate-100"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800">
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mt-3">
                                <p className="text-sm text-slate-700">
                                    <strong className="text-blue-700">⚡ Direct Brokerage Model:</strong>{" "}
                                    Unlike traditional aggregator platforms, Zenzy acts as a trust
                                    protocol. We operate on a <strong>0% markup model</strong>. We
                                    share verified profile information (like badges, location
                                    radius, and phone numbers) with prospective clients seeking
                                    services. We do not sell, rent, or distribute private details
                                    to advertising agencies.
                                </p>
                            </div>
                        </Section>

                        {/* 5. Cookies & Tracking */}
                        <Section
                            id="cookies"
                            title="5. Cookies & Tracking"
                            icon={<Cookie className="w-4 h-4" />}
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We use cookies and similar technologies for authentication,
                                preferences, analytics, and (optionally) marketing. You can
                                manage your cookie preferences at any time through your browser
                                settings or your Zenzy account settings.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {["Authentication", "Preferences", "Analytics", "Marketing"].map(
                                    (type) => (
                                        <span
                                            key={type}
                                            className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
                                        >
                                            {type}
                                        </span>
                                    )
                                )}
                            </div>
                        </Section>

                        {/* 6. Data Security */}
                        <Section
                            id="security"
                            title="6. Data Security"
                            icon={<Lock className="w-4 h-4" />}
                            badge="Certified"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { icon: Lock, label: "Encryption", sub: "AES-256" },
                                    { icon: Shield, label: "Access Control", sub: "Zero Trust" },
                                    { icon: Server, label: "Infrastructure", sub: "ISO 27001" },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-50/80 rounded-xl p-4 text-center border border-slate-100"
                                    >
                                        <item.icon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                        <p className="font-bold text-sm text-slate-800">
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-slate-500">{item.sub}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We use industry-standard technical and organizational safeguards
                                — including encrypted connections, access controls, and secure
                                cloud infrastructure — to protect your information against
                                unauthorized access, alteration, disclosure, or destruction.
                                However, no method of transmission or storage is completely
                                secure, and we cannot guarantee absolute security.
                            </p>
                        </Section>

                        {/* 7. Data Retention */}
                        <Section
                            id="retention"
                            title="7. Data Retention"
                            icon={<Clock className="w-4 h-4" />}
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We retain personal information for as long as your account is
                                active or as needed to provide the Platform, comply with legal
                                obligations, resolve disputes, and enforce our agreements. When
                                information is no longer needed, we delete it or anonymize it in
                                accordance with applicable law.
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    Active Account
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                    Legal Hold
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                    Anonymized
                                </span>
                            </div>
                        </Section>

                        {/* 8. Your Rights & Choices */}
                        <Section
                            id="rights"
                            title="8. Your Rights & Choices"
                            icon={<Edit3 className="w-4 h-4" />}
                            badge="Your Rights"
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Depending on your location, you may have the right to:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                {[
                                    { icon: Eye, label: "Access your data" },
                                    { icon: Edit3, label: "Correct your data" },
                                    { icon: Trash2, label: "Request deletion" },
                                    { icon: Download, label: "Data portability" },
                                    { icon: Mail, label: "Opt out of marketing" },
                                    { icon: Cookie, label: "Manage cookies" },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 bg-slate-50/80 rounded-lg px-3 py-2 border border-slate-100"
                                    >
                                        <item.icon className="w-4 h-4 text-blue-600" />
                                        <span className="text-xs text-slate-700">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 mt-3">
                                <p className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-slate-600 mt-0.5">📧</span>
                                    <span>
                                        To exercise any of these rights, contact us at{" "}
                                        <a
                                            href="mailto:support@zenzy.shop"
                                            className="text-blue-600 hover:underline font-medium"
                                        >
                                            support@zenzy.shop
                                        </a>
                                        . We may need to verify your identity before fulfilling
                                        certain requests.
                                    </span>
                                </p>
                            </div>
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 mt-2">
                                <p className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-emerald-600 mt-0.5">🔑</span>
                                    <span>
                                        <strong>Full Ownership:</strong> You hold full ownership over
                                        your digital identity on Zenzy. You can request full deletion
                                        of your user or partner account by contacting our privacy
                                        compliance desk.
                                    </span>
                                </p>
                            </div>
                        </Section>

                        {/* 9. Children's Privacy */}
                        <Section
                            id="children"
                            title="9. Children's Privacy"
                            icon={<UserCheck className="w-4 h-4" />}
                        >
                            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4">
                                <p className="text-sm text-slate-700 flex items-start gap-2">
                                    <span className="text-amber-600 mt-0.5">👶</span>
                                    <span>
                                        The Platform is not directed to children under the age of 18.
                                        We do not knowingly collect personal information from
                                        children. If we become aware that a child has provided us
                                        with personal information, we will take steps to delete such
                                        information.
                                    </span>
                                </p>
                            </div>
                        </Section>

                        {/* 10. International Data Transfers */}
                        <Section
                            id="transfers"
                            title="10. International Data Transfers"
                            icon={<Globe className="w-4 h-4" />}
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Your information may be stored and processed in countries other
                                than your own, including where our service providers (such as
                                Firebase/Google Cloud) operate data centers. We take reasonable
                                steps to ensure your information receives an adequate level of
                                protection wherever it is processed.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {["USA", "Europe", "Singapore", "India"].map((country) => (
                                    <span
                                        key={country}
                                        className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full flex items-center gap-1"
                                    >
                                        <Globe className="w-3 h-3" />
                                        {country}
                                    </span>
                                ))}
                            </div>
                        </Section>

                        {/* 11. Changes to This Policy */}
                        <Section
                            id="changes"
                            title="11. Changes to This Policy"
                            icon={<FileText className="w-4 h-4" />}
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We may update this Privacy Policy from time to time to reflect
                                changes in our practices, technology, or legal requirements.
                                When we make material changes, we will notify you through the
                                Platform or by email. We encourage you to review this page
                                periodically.
                            </p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span>Version 3.0 • Effective July 28, 2026</span>
                            </div>
                        </Section>

                        {/* 12. Contact Us */}
                        <Section
                            id="contact"
                            title="12. Contact Us"
                            icon={<Mail className="w-4 h-4" />}
                        >
                            <p className="text-slate-600 text-sm leading-relaxed">
                                If you have questions, concerns, or requests regarding this
                                Privacy Policy or your personal information, please reach out to
                                us:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                                <a
                                    href="mailto:support@zenzy.shop"
                                    className="group bg-slate-50/80 hover:bg-blue-50 border border-slate-200/60 hover:border-blue-200 rounded-xl p-4 text-center transition-all duration-200"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <p className="font-bold text-xs text-slate-700">Support</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        support@zenzy.shop
                                    </p>
                                </a>
                                <a
                                    href="mailto:contact@zenzy.shop"
                                    className="group bg-slate-50/80 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-200 rounded-xl p-4 text-center transition-all duration-200"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                        <Building className="w-4 h-4" />
                                    </div>
                                    <p className="font-bold text-xs text-slate-700">General</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        contact@zenzy.shop
                                    </p>
                                </a>
                                <a
                                    href="mailto:privacy@zenzy.shop"
                                    className="group bg-slate-50/80 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-200 rounded-xl p-4 text-center transition-all duration-200"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <p className="font-bold text-xs text-slate-700">Privacy</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        privacy@zenzy.shop
                                    </p>
                                </a>
                            </div>
                        </Section>
                    </div>

                    {/* Accept Button - Premium */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${accepted
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-blue-50 text-blue-600"
                                    }`}
                            >
                                {accepted ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <FileText className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">
                                    {accepted ? "Privacy Policy Accepted" : "Accept Privacy Policy"}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {accepted
                                        ? `Accepted on ${formatDate(acceptedDate)}`
                                        : "By accepting, you agree to our data collection and usage practices."}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleAccept}
                            disabled={accepted}
                            className={`
                px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200
                flex items-center gap-2 whitespace-nowrap
                ${accepted
                                    ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 cursor-default"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98] hover:from-blue-700 hover:to-indigo-700"
                                }
              `}
                        >
                            {accepted ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Accepted
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Accept Privacy Policy
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer Note */}
                    <div className="text-center text-[10px] text-slate-400 font-medium mt-6">
                        © 2026 Zenzy Technologies Private Limited. All rights reserved.
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Missing icon import
function Users(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}