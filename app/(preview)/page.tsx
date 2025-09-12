"use client";

import { ReactNode, useRef, useState } from "react";
import { useActions } from "ai/rsc";
import { Message } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { motion } from "framer-motion";

export const maxDuration = 59;

export default function Home() {
  const { sendMessage } = useActions();

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Array<ReactNode>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef, scrollToBottom] =
    useScrollToBottom<HTMLDivElement>();

  const suggestedActions = [
    {
      title: "Show",
      label: "Karnataka groundwater status (2023)",
      action: "Get groundwater status for Karnataka at state level in 2023",
    },
    {
      title: "Analyze",
      label: "Bengaluru Urban trend 2022–2023",
      action: "Generate groundwater trend analysis for Bengaluru Urban district from 2022 to 2023",
    },
    {
      title: "Compare",
      label: "districts in Karnataka (2023)",
      action: "Compare Bengaluru Urban, Mysuru, and Belagavi at district level in 2023",
    },
    {
      title: "Search",
      label: "over‑exploited blocks policy",
      action: "Search groundwater research on policy for over-exploited blocks in India",
    },
    {
      title: "Find",
      label: "block assessment (latest)",
      action: "Get groundwater status for Anekal block at block level in 2023",
    },
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!input.trim()) return;

    setMessages((messages) => [
      ...messages,
      <Message key={messages.length} role="user" content={input} />,
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response: ReactNode = await sendMessage(input);
      setMessages((messages) => [...messages, response]);
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-zinc-900 dark:to-zinc-800 min-h-screen">
      {/* Main Container */}
      <div className="flex flex-col h-full max-w-5xl mx-auto w-full px-4 md:px-6 lg:px-8">
        {/* Header - Always visible */}
        <header className="py-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 13v1M2 8h2m16 0h2M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Query India’s groundwater assessments, trends, and comparisons
              </p>
            </div>
          </div>
        </header>

        {/* Scrollable Message Container - Add flex-1 to take remaining space */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto mb-6 scroll-smooth h-full"
        >
          <div className="flex flex-col space-y-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                {/* Welcome Card */}
                <div className="rounded-xl p-6 bg-white dark:bg-zinc-800 shadow-md border border-blue-100 dark:border-zinc-700 mb-6">
                  <p className="text-base font-medium text-blue-900 dark:text-blue-300 mb-3">
                    Welcome to the INGRES Groundwater Assistant
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-300 mb-3 text-sm">
                    Ask about groundwater status for any region and year, view historical trends,
                    compare regions, and search research or policy documents.
                  </p>

                  <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 dark:bg-zinc-700 rounded-r-lg">
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">
                      Try: "Get groundwater status for Karnataka (2023)", "Trend for Bengaluru Urban 2022–2023",
                      or "Compare Bengaluru Urban, Mysuru, Belagavi (2023)".
                    </p>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-5 rounded-xl border border-blue-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
                    <div className="flex items-center mb-3">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M21 21H4.6C3.16406 21 2 19.8359 2 18.4V3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 7L16 12L13 9L9 13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M22 7H17V12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                        Assessments
                      </div>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                      Fetch official INGRES results including recharge, extraction, and category.
                    </div>
                  </div>
                  <div className="p-5 rounded-xl border border-blue-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
                    <div className="flex items-center mb-3">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M10 3H3V10H10V3Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 3H14V10H21V3Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 14H14V21H21V14Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 14H3V21H10V14Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                        Trends
                      </div>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                      Explore time-series of stage of extraction and simple projections.
                    </div>
                  </div>
                  <div className="p-5 rounded-xl border border-blue-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
                    <div className="flex items-center mb-3">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H16M12 20V10M12 10L15 13M12 10L9 13"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                        Comparisons
                      </div>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                      Compare multiple regions side-by-side with category and stage.
                    </div>
                  </div>
                  <div className="p-5 rounded-xl border border-blue-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm">
                    <div className="flex items-center mb-3">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M8 9H16M8 13H14M8 17H13M10 2H14C16.2091 2 18 3.79086 18 6V20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20V6C6 3.79086 7.79086 2 10 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="text-lg font-semibold text-blue-900 dark:text-blue-300">
                        Research
                      </div>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                      Find relevant groundwater research and policy documents.
                    </div>
                  </div>
                </div>

                {/* Prompt Section */}
                <div className="bg-blue-50 dark:bg-zinc-700 rounded-lg p-4 flex items-center mb-6">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-200 font-medium">
                    Use the suggestions below to explore groundwater data and insights
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="pb-16">{messages.map((message) => message)}</div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-pulse flex space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-200"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-400"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestion Buttons - Only shown when no messages */}
        {messages.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {suggestedActions.map((action, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                key={index}
              >
                <button
                  onClick={async () => {
                    setMessages((messages) => [
                      ...messages,
                      <Message
                        key={messages.length}
                        role="user"
                        content={action.action}
                      />,
                    ]);
                    setIsLoading(true);
                    try {
                      const response: ReactNode = await sendMessage(
                        action.action
                      );
                      setMessages((messages) => [...messages, response]);
                      requestAnimationFrame(() => {
                        scrollToBottom();
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full text-left border border-blue-100 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 rounded-lg p-3 text-sm hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors flex flex-col shadow-sm"
                >
                  <span className="font-semibold text-blue-900 dark:text-blue-300">
                    {action.title}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {action.label}
                  </span>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Input Form - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 pb-6 pt-2 bg-gradient-to-t from-blue-50 via-blue-50 to-transparent dark:from-zinc-900 dark:via-zinc-900 dark:to-transparent">
          <div className="max-w-5xl mx-auto w-full px-4 md:px-6 lg:px-8">
            <form
              className="flex flex-col gap-2 relative items-center"
              onSubmit={handleSubmit}
            >
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  className="bg-white rounded-xl px-5 py-4 w-full outline-none dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 pr-14 shadow-md focus:ring-2 focus:ring-blue-500 focus:border-transparent border border-blue-100 dark:border-zinc-700"
                  placeholder="Ask about any fund or market trend..."
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                  }}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                    input.trim() && !isLoading
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-400"
                  } text-white rounded-full p-3 transition-colors`}
                  disabled={!input.trim() || isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 2L11 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
