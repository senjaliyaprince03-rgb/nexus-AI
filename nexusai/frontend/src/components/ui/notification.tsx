"use client"

import { motion } from "framer-motion"
import { LogoMark } from "@/components/brand/LogoMark"

interface NotificationCardProps {
  aiName?: string
  userName?: string
  documentTopic?: string
  workflowName?: string
  earnings?: string
  workspaceTotal?: string
}

export default function NotificationCard({
  aiName = "NexusAI Critic",
  userName = "Avery",
  documentTopic = "vendor security review",
  workflowName = "Multi-Agent Runner",
  earnings = "12 verified citations",
  workspaceTotal = "184 grounded answers this week",
}: NotificationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 10, duration: 0.6 }}
      className="relative mx-auto max-w-md overflow-hidden rounded-lg bg-white shadow-md"
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
          className="relative mb-4 flex items-center"
        >
          <div className="relative mr-3">
            <LogoMark className="h-10 w-10 rounded-xl shadow-[0_10px_24px_rgba(255,107,53,0.18)]" />
          </div>

          <span className="text-lg font-semibold text-slate-600">{aiName}</span>
        </motion.div>

        <div className="relative">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "calc(100% - 20px)" }}
            transition={{ delay: 1, duration: 0.6, ease: "easeInOut" }}
            className="absolute left-[19px] top-0 mt-3 w-1 bg-gray-100"
          />

          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 1, duration: 0.8, type: "tween" }}
            style={{ overflow: "hidden" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mb-4 pl-12 text-gray-700"
            >
              <p className="text-black">
                Hey {userName}, your documents on {documentTopic} were just used by{" "}
                <span className="underline" style={{ color: "#006622" }}>
                  {workflowName}
                </span>{" "}
                to generate a grounded response inside your workspace.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="ml-12 rounded-md p-3"
              style={{ backgroundColor: "#EFECE7" }}
            >
              <div className="flex items-start">
                <p className="text-sm" style={{ color: "#4C4843" }}>
                  NexusAI attached {earnings} to the latest answer. Workspace summary:{" "}
                  {workspaceTotal}.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
