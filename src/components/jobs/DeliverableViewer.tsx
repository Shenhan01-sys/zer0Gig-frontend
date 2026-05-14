"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, ExternalLink, X } from "lucide-react";

import { useReadContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";

interface DeliverableData {
  jobId: number;
  jobTitle: string;
  clientAddress: string;
  agentName: string;
  agentId: number;
  milestoneIndex: number;
  milestoneDescription: string;
  outputCID?: string;
  outputUrl?: string;
  outputSummary: string;
  alignmentScore?: number;
  createdAt?: string;
}

/**
 * DeliverableViewer — formatted output document for completed milestones.
 *
 * Renders a branded zer0Gig deliverable sheet that the AI agent
 * generates at milestone completion. Supports:
 *   - Inline preview (markdown-like)
 *   - 0G Storage CID link
 *   - External URL reference
 *   - Download as .txt
 */
export default function DeliverableViewer({
  data,
  onClose,
}: {
  data: DeliverableData;
  onClose: () => void;
}) {
  const [showFull, setShowFull] = useState(false);

  const handleDownload = () => {
    const content = generateDeliverableText(data);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zer0Gig-deliverable-job-${data.jobId}-milestone-${data.milestoneIndex + 1}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/10 bg-[#0d1525]/95 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-[#050810]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#a855f7] flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-white text-[14px] font-semibold">Milestone Deliverable</h3>
            <p className="text-white/40 text-[11px]">
              Job #{data.jobId} · Milestone {data.milestoneIndex + 1}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/70 text-[12px] hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          {data.outputCID && (
            <a
              href={`https://indexer-storage-testnet-turbo.0g.ai/download/${data.outputCID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/70 text-[12px] hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              0G
            </a>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Document body */}
      <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
        {/* Brand header */}
        <div className="text-center pb-4 border-b border-white/[0.06]">
          <p className="text-white text-[18px] font-bold tracking-tight">
            zer0<span className="text-[#38bdf8]">Gig</span>
          </p>
          <p className="text-white/40 text-[11px] mt-1">
            Turns AI Into Productive Economy Assets — starting from Indonesia
          </p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetaItem label="AI Agent" value={data.agentName} />
          <MetaItem label="Job" value={`#${data.jobId} ${data.jobTitle || ""}`} />
          <MetaItem label="Client" value={`${data.clientAddress.slice(0, 6)}…${data.clientAddress.slice(-4)}`} />
          <MetaItem label="Milestone" value={`${data.milestoneIndex + 1} — ${data.milestoneDescription}`} />
          {data.alignmentScore !== undefined && (
            <MetaItem label="Alignment Score" value={`${(data.alignmentScore / 100).toFixed(2)}/100`} />
          )}
          {data.createdAt && (
            <MetaItem label="Completed" value={new Date(data.createdAt).toLocaleDateString()} />
          )}
        </div>

        {/* Output summary */}
        <div>
          <h4 className="text-white/50 text-[11px] uppercase tracking-wider font-medium mb-2">
            Deliverable Summary
          </h4>
          <div className="bg-[#050810]/60 rounded-xl border border-white/[0.06] p-4">
            <p className="text-white/80 text-[13px] leading-relaxed whitespace-pre-wrap">
              {showFull ? data.outputSummary : truncate(data.outputSummary, 400)}
            </p>
            {data.outputSummary.length > 400 && (
              <button
                onClick={() => setShowFull(!showFull)}
                className="text-[#38bdf8] text-[12px] mt-2 hover:underline"
              >
                {showFull ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>

        {/* Output references */}
        {(data.outputCID || data.outputUrl) && (
          <div>
            <h4 className="text-white/50 text-[11px] uppercase tracking-wider font-medium mb-2">
              Output References
            </h4>
            <div className="space-y-2">
              {data.outputCID && (
                <a
                  href={`https://indexer-storage-testnet-turbo.0g.ai/download/${data.outputCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#050810]/60 border border-white/[0.06] text-[#38bdf8] text-[12px] hover:bg-white/[0.03] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="font-mono">{data.outputCID.slice(0, 24)}…</span>
                  <span className="text-white/30 ml-auto">0G Storage</span>
                </a>
              )}
              {data.outputUrl && (
                <a
                  href={data.outputUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#050810]/60 border border-white/[0.06] text-[#38bdf8] text-[12px] hover:bg-white/[0.03] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {data.outputUrl}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#050810]/40 border border-white/[0.04] px-3 py-2">
      <p className="text-white/30 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-white text-[13px] font-medium truncate">{value}</p>
    </div>
  );
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

function generateDeliverableText(data: DeliverableData): string {
  return `═══════════════════════════════════════════════════════════════
  zer0Gig — AI Agent Deliverable Report
  Turns AI Into Productive Economy Assets — starting from Indonesia
═══════════════════════════════════════════════════════════════

JOB INFORMATION
───────────────────────────────────────────────────────────────
  Job ID:        #${data.jobId}
  Job Title:     ${data.jobTitle || "N/A"}
  Client:        ${data.clientAddress}
  Milestone:     #${data.milestoneIndex + 1} — ${data.milestoneDescription}

AI AGENT INFORMATION
───────────────────────────────────────────────────────────────
  Agent Name:    ${data.agentName}
  Agent ID:      #${data.agentId}

QUALITY METRICS
───────────────────────────────────────────────────────────────
  Alignment Score: ${data.alignmentScore !== undefined ? (data.alignmentScore / 100).toFixed(2) : "N/A"}/100
  Completed:     ${data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A"}

DELIVERABLE SUMMARY
───────────────────────────────────────────────────────────────
${data.outputSummary}

OUTPUT REFERENCES
───────────────────────────────────────────────────────────────
${data.outputCID ? `0G Storage CID: ${data.outputCID}\nhttps://indexer-storage-testnet-turbo.0g.ai/download/${data.outputCID}` : "No on-chain file reference"}
${data.outputUrl ? `External URL: ${data.outputUrl}` : ""}

───────────────────────────────────────────────────────────────
Generated by zer0Gig AI Agent Economy on 0G Newton Testnet
https://scan-testnet.0g.ai
───────────────────────────────────────────────────────────────
`;
}
