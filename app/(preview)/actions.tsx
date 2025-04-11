import { Message, TextStreamMessage } from "@/components/message";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateId } from "ai";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
import { CameraView } from "@/components/camera-view";
import { HubView } from "@/components/hub-view";
import { UsageView } from "@/components/usage-view";
import { getStockData, searchStocks, StockData } from "@/services/alpha-vantage";
import { StockView } from "@/components/stock-view";
import { StockList } from "@/components/stock-list";
import StockDataDisplay from "@/components/indian-stock-view";

export interface Hub {
  climate: Record<"low" | "high", number>;
  lights: Array<{ name: string; status: boolean }>;
  locks: Array<{ name: string; isLocked: boolean }>;
}

    // Add this near other imports
    const AVAILABLE_STOCKS = [
      { symbol: "VTI", name: "Vanguard Total Stock Market ETF" },
      { symbol: "SPY", name: "SPDR S&P 500 ETF" },
      { symbol: "QQQ", name: "Invesco QQQ Trust" },
      { symbol: "AAPL", name: "Apple Inc." },
      { symbol: "MSFT", name: "Microsoft Corporation" },
      { symbol: "GOOGL", name: "Alphabet Inc." },
      { symbol: "AMZN", name: "Amazon.com Inc." },
      { symbol: "META", name: "Meta Platforms Inc." },
      { symbol: "TSLA", name: "Tesla Inc." },
      { symbol: "NVDA", name: "NVIDIA Corporation" },
    ];

let hub: Hub = {
  climate: {
    low: 23,
    high: 25,
  },
  lights: [
    { name: "patio", status: true },
    { name: "kitchen", status: false },
    { name: "garage", status: true },
  ],
  locks: [{ name: "back door", isLocked: true }],
};

const sendMessage = async (message: string) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;

  // Add new interface for stock view
  interface StockInfo {
    symbol: string;
    data: StockData | null;
  }

  const { value: stream } = await streamUI({
    model: openai("gpt-4o"),
    system: `\
      - you are a financial advisor assistant
      - help explain market movements and fund performance
      - use available tools to fetch and display stock data
      - support different timeframes: recent (default), full (30 days), or historical (specific month)
      - reply in clear, concise language
    `,
    messages: messages.get() as CoreMessage[],
    text: async function* ({ content, done }) {
      if (done) {
        messages.done([
          ...(messages.get() as CoreMessage[]),
          { role: "assistant", content },
        ]);

        contentStream.done();
      } else {
        contentStream.update(content);
      }

      return textComponent;
    },
    
    // Add this to the tools object in streamUI
    tools: {
      viewCameras: {
        description: "view current active cameras",
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "viewCameras",
                  args: {},
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "viewCameras",
                  toolCallId,
                  result: `The active cameras are currently displayed on the screen`,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={<CameraView />} />;
        },
      },
      listStocks: {
        description: "list all available stocks and ETFs",
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId();
          const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
          const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;
          
          const response = await fetch(url);
          const data = await response.json();
      
          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "listStocks",
                  args: {},
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "listStocks",
                  toolCallId,
                  result: data,
                },
              ],
            },
          ]);
      
          return (
            <Message
              role="assistant"
              // Update max-width in listStocks
                content={
                  <div className="w-full max-w-6xl mx-auto p-4">
                    <StockList
                      gainers={data.top_gainers || []}
                      losers={data.top_losers || []}
                      activelyTraded={data.most_actively_traded || []}
                    />
                  </div>
              }
            />
          );
        },
      },
      viewHub: {
        description:
          "view the hub that contains current quick summary and actions for temperature, lights, and locks",
        parameters: z.object({}),
        generate: async function* ({}) {
          const toolCallId = generateId();

          messages.done([

            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "viewHub",
                  args: {},
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "viewHub",
                  toolCallId,
                  result: hub,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={<HubView hub={hub} />} />;
        },
      },
      updateHub: {
        description: "update the hub with new values",
        parameters: z.object({
          hub: z.object({
            climate: z.object({
              low: z.number(),
              high: z.number(),
            }),
            lights: z.array(
              z.object({ name: z.string(), status: z.boolean() }),
            ),
            locks: z.array(
              z.object({ name: z.string(), isLocked: z.boolean() }),
            ),
          }),
        }),
        generate: async function* ({ hub: newHub }) {
          hub = newHub;
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "updateHub",
                  args: { hub },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "updateHub",
                  toolCallId,
                  result: `The hub has been updated with the new values`,
                },
              ],
            },
          ]);

          return <Message role="assistant" content={<HubView hub={hub} />} />;
        },
      },
      viewUsage: {
        description: "view current usage for electricity, water, or gas",
        parameters: z.object({
          type: z.enum(["electricity", "water", "gas"]),
        }),
        generate: async function* ({ type }) {
          const toolCallId = generateId();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "viewUsage",
                  args: { type },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "viewUsage",
                  toolCallId,
                  result: `The current usage for ${type} is currently displayed on the screen`,
                },
              ],
            },
          ]);

          return (
            <Message role="assistant" content={<UsageView type={type} />} />
          );
        },
      },
      getStockInfo: {
        description: "fetch and display current stock or ETF information",
        parameters: z.object({
          symbol: z.string().describe("stock or ETF symbol"),
          timeframe: z.enum(['recent', 'full', 'historical']).optional(),
          month: z.string().optional(),
        }),
        generate: async function* ({ symbol, timeframe = 'recent', month }) {
          const toolCallId = generateId();
          const stockData = await getStockData(symbol, timeframe, month);
      
          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "getStockInfo",
                  args: { symbol, timeframe, month },
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "getStockInfo",
                  toolCallId,
                  result: stockData,
                },
              ],
            },
          ]);
      
          return <Message role="assistant" content={<StockView data={stockData} symbol={symbol} />} />;
        },
      },
      listIndianStocks: {
        description: "show Indian market stocks information",
        parameters: z.object({
          symbol: z.string().describe("Indian stock symbol (e.g., RELIANCE.BSE, TCS.BSE)")
        }),
        generate: async function* ({ symbol }) {
          const toolCallId = generateId();
          const apiKey = process.env.ALPHA_VANTAGE_API_KEY;        
          const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
          const response = await fetch(url);
          const data = await response.json();

          messages.done([
            ...(messages.get() as CoreMessage[]),
            {
              role: "assistant",
              content: [
                {
                  type: "tool-call",
                  toolCallId,
                  toolName: "listIndianStocks",
                  args: {},
                },
              ],
            },
            {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolName: "listIndianStocks",
                  toolCallId,
                  result: data,
                },
              ],
            },
          ]);

          return (
            <Message
              role="assistant"
              // Update max-width in listIndianStocks
                content={
                  <div className="w-full max-w-6xl mx-auto p-4">
                    <h2 className="text-xl font-semibold mb-4">Indian Markets</h2>
                    <StockDataDisplay apiData={data} />
                  </div>
              }
            />
          );
        },
      },
    },
  });

  return stream;
};

export type UIState = Array<ReactNode>;

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    if (done) {
      // save to database
    }
  },
});
