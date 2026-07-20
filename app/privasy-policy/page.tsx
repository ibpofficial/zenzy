"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function PrivacyPolicyPage() {
    const [accepted, setAccepted] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
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

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleAccept = () => {
        setAccepted(true);
        // Here you can add logic to save acceptance to backend/localStorage
        localStorage.setItem("privacy_policy_accepted", "true");
        localStorage.setItem("privacy_policy_accepted_date", new Date().toISOString());
    };

    const Section = ({
        id,
        title,
        children,
    }: {
        id: string;
        title: string;
        children: React.ReactNode;
    }) => {
        const isExpanded = expandedSections[id] ?? true;

        return (
            <section className="border-b border-slate-100 last:border-b-0 py-4">
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full flex items-center justify-between group"
                >
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full flex-shrink-0"></span>
                        {title}
                    </h2>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                </button>
                {isExpanded && <div className="mt-3 space-y-3">{children}</div>}
            </section>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans transition-colors relative overflow-x-hidden">
            <Navbar />

            <main className="max-w-4xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow">
                <div className="space-y-8 animate-fade-up">
                    {/* Header Hero */}
                    <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 bg-blue-50/80 border border-blue-100 px-3 py-1.5 rounded-full">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
                                Privacy & Safety Protocol
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Privacy Policy
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Last updated: July 18, 2026 • Version 2.0
                        </p>
                        {accepted ? (
                            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-medium text-emerald-700">
                                    You have accepted this Privacy Policy
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
                                <FileText className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-700">
                                    Please review and accept the Privacy Policy to continue
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Quick Security Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-subtle flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">Secure Payments</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Direct peer-to-peer or verified payment channels with end-to-end security.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-subtle flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Eye className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">Zero Data Brokerage</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    We never sell your personal information or transaction details to third parties.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-subtle flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">Transparent Terms</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Plain English terms that explain exactly what details we collect and why.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Document Body */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.02)] p-6 sm:p-10 space-y-2">
                        {/* 1. Introduction */}
                        <Section id="intro" title="1. Introduction">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Zenzy Technologies Private Limited ("Zenzy", "we", "us", or "our") operates a platform
                                that connects clients with verified businesses, workers, and rental listings for home
                                services, construction, interior design, and related work. This Privacy Policy explains
                                what personal information we collect, how we use and share it, and the choices and rights
                                you have regarding your data when you use our website, mobile app, or related services
                                (together, the "Platform").
                            </p>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                By creating an account or otherwise using the Platform, you agree to the collection and
                                use of information as described in this Policy. If you do not agree, please do not use the
                                Platform.
                            </p>
                        </Section>

                        {/* 2. Information We Collect */}
                        <Section id="collection" title="2. Information We Collect">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="text-left p-3 border border-slate-200 font-bold text-slate-700">
                                                Category
                                            </th>
                                            <th className="text-left p-3 border border-slate-200 font-bold text-slate-700">
                                                Examples
                                            </th>
                                            <th className="text-left p-3 border border-slate-200 font-bold text-slate-700">
                                                Collected When
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                                Account & Identity
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Name, email address, phone number, authentication tokens, profile photo
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Sign-up, login via email/phone/Google
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                                Business/Worker Verification
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Identity documents, business registration, GST details, office address, portfolio,
                                                awards
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Business or worker onboarding
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                                Location
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Address, pin-drop coordinates, service area
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Booking a service, listing a property, using the map picker
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                                Project & Booking Data
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Project briefs, budgets, timelines, quotations, workspace chat messages, shared
                                                files
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Creating projects, requesting quotes, using the workspace
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                                Reviews & Ratings
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Ratings, written reviews, photos submitted with reviews
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                After a completed booking or project
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                                Device & Usage
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                IP address, browser type, device identifiers, pages viewed, crash logs
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Automatically, while using the Platform
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                                Support Communications
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Messages sent to support, contact form submissions
                                            </td>
                                            <td className="p-3 border border-slate-200 text-slate-600">
                                                Contacting Zenzy support
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        {/* 3. How We Use Your Information */}
                        <Section id="use" title="3. How We Use Your Information">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
                                <li>Create and manage your account, and verify your identity</li>
                                <li>Match clients with relevant businesses, workers, and rental listings</li>
                                <li>Enable bookings, quotations, project workspaces, and in-app messaging</li>
                                <li>Process and display reviews and ratings</li>
                                <li>Send booking confirmations, updates, and service-related notifications</li>
                                <li>Provide customer support and respond to inquiries</li>
                                <li>Detect, prevent, and investigate fraud, abuse, or security incidents</li>
                                <li>Improve, personalize, and troubleshoot the Platform</li>
                                <li>Comply with legal obligations and enforce our Terms & Conditions</li>
                            </ul>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                <strong>For Workers & Businesses:</strong> We create digital profiles to verify your
                                identity to customers, display reviews, ratings, and experience histories to foster trust.
                            </p>
                        </Section>

                        {/* 4. How We Share Your Information */}
                        <Section id="share" title="4. How We Share Your Information">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We do not sell your personal information. We share information only in the following
                                circumstances:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
                                <li>
                                    <strong>With other users:</strong> When you book a service or start a project, relevant
                                    profile, contact, and project details are shared with the business/worker (or client)
                                    involved so the work can be carried out.
                                </li>
                                <li>
                                    <strong>Service providers:</strong> We use trusted third parties such as Firebase/Google
                                    Cloud (authentication, database, hosting, and notifications), Google Maps (location and
                                    pin-drop features), and payment processors to operate the Platform. These providers only
                                    receive the data needed to perform their function.
                                </li>
                                <li>
                                    <strong>Legal requirements:</strong> We may disclose information if required by law,
                                    court order, or government request, or to protect the rights, safety, or property of
                                    Zenzy, our users, or the public.
                                </li>
                                <li>
                                    <strong>Business transfers:</strong> If Zenzy is involved in a merger, acquisition, or
                                    sale of assets, your information may be transferred as part of that transaction.
                                </li>
                            </ul>
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-3">
                                <p className="text-sm text-slate-700">
                                    <strong className="text-blue-700">⚡ Direct Brokerage Model:</strong> Unlike traditional
                                    aggregator platforms, Zenzy acts as a trust protocol. We operate on a{" "}
                                    <strong>0% markup model</strong>. We share verified profile information (like badges,
                                    location radius, and phone numbers) with prospective clients seeking services. We do not
                                    sell, rent, or distribute private details to advertising agencies.
                                </p>
                            </div>
                        </Section>

                        {/* 5. Cookies & Tracking */}
                        <Section id="cookies" title="5. Cookies & Tracking">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We use cookies and similar technologies for authentication, preferences, analytics, and
                                (optionally) marketing. You can manage your cookie preferences at any time through your
                                browser settings or your Zenzy account settings. For full details, see our separate Cookie
                                Policy.
                            </p>
                        </Section>

                        {/* 6. Data Security */}
                        <Section id="security" title="6. Data Security">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We use industry-standard technical and organizational safeguards — including encrypted
                                connections, access controls, and secure cloud infrastructure — to protect your
                                information against unauthorized access, alteration, disclosure, or destruction. However,
                                no method of transmission or storage is completely secure, and we cannot guarantee
                                absolute security.
                            </p>
                        </Section>

                        {/* 7. Data Retention */}
                        <Section id="retention" title="7. Data Retention">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We retain personal information for as long as your account is active or as needed to
                                provide the Platform, comply with legal obligations, resolve disputes, and enforce our
                                agreements. When information is no longer needed, we delete it or anonymize it in
                                accordance with applicable law.
                            </p>
                        </Section>

                        {/* 8. Your Rights & Choices */}
                        <Section id="rights" title="8. Your Rights & Choices">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Depending on your location, you may have the right to:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
                                <li>Access, correct, or update your personal information via your account settings</li>
                                <li>Request a copy of the personal information we hold about you</li>
                                <li>Request deletion of your account and associated personal information</li>
                                <li>Opt out of marketing communications and non-essential cookies</li>
                                <li>Withdraw consent where processing is based on consent</li>
                            </ul>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                To exercise any of these rights, contact us at{" "}
                                <a href="mailto:support@zenzy.com" className="text-blue-600 hover:underline">
                                    support@zenzy.com
                                </a>
                                . We may need to verify your identity before fulfilling certain requests.
                            </p>
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 mt-3">
                                <p className="text-sm text-slate-700">
                                    <strong>🔑 Full Ownership:</strong> You hold full ownership over your digital identity
                                    on Zenzy. You can request full deletion of your user or partner account by contacting
                                    our privacy compliance desk.
                                </p>
                            </div>
                        </Section>

                        {/* 9. Children's Privacy */}
                        <Section id="children" title="9. Children's Privacy">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                The Platform is not directed to children under the age of 18. We do not knowingly collect
                                personal information from children. If we become aware that a child has provided us with
                                personal information, we will take steps to delete such information.
                            </p>
                        </Section>

                        {/* 10. International Data Transfers */}
                        <Section id="transfers" title="10. International Data Transfers">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Your information may be stored and processed in countries other than your own, including
                                where our service providers (such as Firebase/Google Cloud) operate data centers. We take
                                reasonable steps to ensure your information receives an adequate level of protection
                                wherever it is processed.
                            </p>
                        </Section>

                        {/* 11. Changes to This Policy */}
                        <Section id="changes" title="11. Changes to This Policy">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We may update this Privacy Policy from time to time to reflect changes in our practices,
                                technology, or legal requirements. When we make material changes, we will notify you
                                through the Platform or by email. We encourage you to review this page periodically.
                            </p>
                        </Section>

                        {/* 12. Contact Us */}
                        <Section id="contact" title="12. Contact Us">
                            <p className="text-slate-600 text-sm leading-relaxed">
                                If you have questions, concerns, or requests regarding this Privacy Policy or your
                                personal information, please reach out to us:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">📧 Support:</span>
                                    <a
                                        href="mailto:support@zenzy.com"
                                        className="text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        support@zenzy.com
                                    </a>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">📧 General:</span>
                                    <a
                                        href="mailto:hello@zenzy.com"
                                        className="text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        hello@zenzy.com
                                    </a>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">🔒 Privacy:</span>
                                    <a
                                        href="mailto:privacy@zenzyforall.com"
                                        className="text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        privacy@zenzyforall.com
                                    </a>
                                </div>
                            </div>
                        </Section>
                    </div>

                    {/* Accept Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_40px_rgba(0,0,0,0.02)] p-6 sm:p-8 mt-8">
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">
                                {accepted ? "✅ Privacy Policy Accepted" : "📋 Accept Privacy Policy"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {accepted
                                    ? `Accepted on ${new Date(localStorage.getItem("privacy_policy_accepted_date") || "").toLocaleDateString()}`
                                    : "By accepting, you agree to our data collection and usage practices."}
                            </p>
                        </div>
                        <button
                            onClick={handleAccept}
                            disabled={accepted}
                            className={`
                px-8 py-3 rounded-xl font-bold text-sm transition-all duration-200
                flex items-center gap-2
                ${accepted
                                    ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200 cursor-default"
                                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35"
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
                    <div className="text-center text-[10px] text-slate-400 font-medium mt-4">
                        © 2026 Zenzy Technologies Private Limited. All rights reserved.
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}