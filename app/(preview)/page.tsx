"use client";

import { ReactNode, useRef, useState } from "react";
import { useActions } from "ai/rsc";
import { Message } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { motion } from "framer-motion";

export default function Home() {
  const { sendMessage } = useActions();

  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Array<ReactNode>>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const suggestedActions = [
    {
      title: "Explain",
      label: "why Tesla is down today",
      action: "Why is Tesla down today?",
    },
    {
      title: "Show me",
      label: "tech ETF performance",
      action: "Show tech ETF performance",
    },
    {
      title: "Get NSE",
      label: "equity data by symbol",
      action: "Get NSE equity data for symbol: ",
    },
    {
      title: "List",
      label: "all available stocks",
      action: "List all available stocks",
    },
    {
      title: "Show",
      label: "Indian market stocks",
      action: "Show Indian market stocks",
    },
    {
      title: "Get",
      label: "current market overview",
      action: "Get current market overview",
    },
  ];

  return (
    <div className="flex flex-row justify-center pb-20 h-dvh bg-white dark:bg-zinc-900">
      <div className="flex flex-col justify-between gap-4">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-3 h-full w-dvw items-center overflow-y-scroll"
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[350px] px-4 w-full md:w-[800px] md:px-0 pt-8"
            >
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-zinc-500 dark:text-zinc-400"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M12 21V12m0 9L7 15m5 6l5-3m3-4V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                      Financial Assistant
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Real-time market insights and analysis
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="text-sm font-medium mb-1">
                      Stock Analysis
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Price trends and performance metrics
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="text-sm font-medium mb-1">Market News</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Latest updates and insights
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="text-sm font-medium mb-1">ETF Tracking</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Fund performance and holdings
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="text-sm font-medium mb-1">
                      Indian Markets
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      NSE and BSE data analysis
                    </div>
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24">
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="m9 7-5 5 5 5m6 0 5-5-5-5"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Try the suggestions below to get started
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {messages.map((message) => message)}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[900px] mb-4">
          {messages.length === 0 &&
            suggestedActions.map((action, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.01 * index }}
                key={index}
                className={index > 1 ? "hidden sm:block" : "block"}
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
                    const response: ReactNode = await sendMessage(
                      action.action
                    );
                    setMessages((messages) => [...messages, response]);
                  }}
                  className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                >
                  <span className="font-medium">{action.title}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {action.label}
                  </span>
                </button>
              </motion.div>
            ))}
        </div>

        <form
          className="flex flex-col gap-2 relative items-center"
          onSubmit={async (event) => {
            event.preventDefault();

            setMessages((messages) => [
              ...messages,
              <Message key={messages.length} role="user" content={input} />,
            ]);
            setInput("");

            const response: ReactNode = await sendMessage(input);
            setMessages((messages) => [...messages, response]);
          }}
        >
          <input
            ref={inputRef}
            className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 md:max-w-[900px] max-w-[calc(100dvw-32px)]"
            placeholder="Send a message..."
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
            }}
          />
        </form>
      </div>
    </div>
  );
}
