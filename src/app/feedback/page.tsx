"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Star, CheckCircle, Globe, User, Briefcase, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const STATUS_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "worker", label: "Employee" },
  { value: "freelancer", label: "Freelancer" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "other", label: "Other" },
];

const TYPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "ux", label: "UX / UI" },
  { value: "economy-concept", label: "Economy Concept" },
];

export default function FeedbackPage() {
  const [form, setForm] = useState({
    name: "",
    country: "",
    status: "",
    feedback_type: "general",
    rating: 0,
    message: "",
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    form.name.trim() &&
    form.country.trim() &&
    form.status &&
    form.message.trim().length >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Submit failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#050810]">
      <Navbar />

      <div className="flex-1 pt-32 pb-16 px-6 max-w-3xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/55 mb-4 font-mono uppercase tracking-widest">
            <MessageSquare className="w-3.5 h-3.5" />
            Share Your Voice
          </div>
          <h1 className="text-4xl md:text-5xl font-medium mb-3 text-white">
            Feedback
          </h1>
          <p className="text-white/55 text-[15px] max-w-xl mx-auto">
            We want to hear your experience with zer0Gig. Every piece of feedback helps us build a better AI Agent Economy.
          </p>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-12 text-center"
          >
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-white text-xl font-medium mb-2">Thank You!</h2>
            <p className="text-white/55 text-[14px]">
              Your feedback has been saved. We will consider every input for the development of this platform.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 md:p-8 space-y-6"
          >
            {/* Identity Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-white/40" />
                <span className="text-white/70 text-[13px] font-medium uppercase tracking-wider">Identity</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-[12px] uppercase tracking-wider font-medium">
                    Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-white/60 text-[12px] uppercase tracking-wider font-medium">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      placeholder="e.g. Indonesia"
                      className="w-full bg-[#050810]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-[12px] uppercase tracking-wider font-medium">
                  Current Status <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                      className={`px-3 py-2 rounded-xl text-[12px] font-medium border transition-all text-center ${
                        form.status === opt.value
                          ? "bg-white/10 border-white/25 text-white"
                          : "bg-[#050810]/60 border-white/[0.06] text-white/45 hover:text-white/75 hover:border-white/15"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Feedback Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-white/40" />
                <span className="text-white/70 text-[13px] font-medium uppercase tracking-wider">Technical Feedback</span>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-[12px] uppercase tracking-wider font-medium">Category</label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, feedback_type: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                        form.feedback_type === opt.value
                          ? "bg-white/10 border-white/25 text-white"
                          : "bg-[#050810]/60 border-white/[0.06] text-white/45 hover:text-white/75 hover:border-white/15"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-[12px] uppercase tracking-wider font-medium">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHoveredRating(n)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setForm((f) => ({ ...f, rating: n }))}
                      className="p-1 transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          n <= (hoveredRating || form.rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-white/15"
                        }`}
                      />
                    </button>
                  ))}
                  {form.rating > 0 && (
                    <span className="ml-2 text-white/50 text-[13px]">{form.rating}/5</span>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-[12px] uppercase tracking-wider font-medium">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Share your experience, ideas, or feedback about zer0Gig..."
                  rows={6}
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                />
                <p className="text-white/25 text-[11px]">Minimum 10 characters</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-300 text-[13px]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[14px] font-medium transition-all ${
                  canSubmit && !submitting
                    ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                    : "bg-white/5 text-white/30 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
                {submitting ? "Sending..." : "Submit Feedback"}
              </button>
            </div>
          </motion.form>
        )}
      </div>

      <Footer />
    </main>
  );
}
