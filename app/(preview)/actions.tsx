import { Message, TextStreamMessage } from "@/components/message";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateId } from "ai";
import { getJson } from "serpapi";
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
import {
  getStockData,
  searchStocks,
  StockData,
} from "@/services/alpha-vantage";
import { StockView } from "@/components/stock-view";
import { StockList } from "@/components/stock-list";
import StockDataDisplay from "@/components/indian-stock-view";
import { marked } from 'marked';

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
      getStockNews: {
        description:
          "get latest news and information about stocks and market movements",
        parameters: z.object({
          query: z.string().describe("stock-related query"),
        }),
        generate: async function* ({ query }) {
          const toolCallId = generateId();
          
          // Step 1: Show initial loading state with skeletons for all sections
          yield <Message 
            role="assistant" 
            content={
              <div className="w-full max-w-6xl mx-auto p-4">
                <h2 className="text-xl font-semibold mb-4">
                  Loading results for: {query}
                </h2>
                
                {/* AI Analysis Section Loading */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-4">Analysis</h3>
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
                
                {/* Stock Price Section Loading */}
                <div className="border rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium mb-2">Stock Info</h3>
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-40"></div>
                  </div>
                </div>
                
                {/* Top Stories Section Loading */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Latest News</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="border rounded-lg p-4 flex">
                        <div className="mr-3 flex-shrink-0">
                          <div className="animate-pulse bg-gray-200 w-20 h-20 rounded"></div>
                        </div>
                        <div className="flex-grow">
                          <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Organic Results Section Loading */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Additional Information</h3>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="animate-pulse space-y-3">
                          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />;
          
          try {
            // Step 2: Search for the stock information
            const searchParams = {
              api_key: process.env.SERPAPI_KEY,
              engine: "google",
              q: query,
              num: 8,
            };

            // Show loading state with SERP API in progress
            yield <Message 
              role="assistant" 
              content={
                <div className="w-full max-w-6xl mx-auto p-4">
                  <h2 className="text-xl font-semibold mb-4">
                    Searching for: {query}
                  </h2>
                  
                  {/* AI Analysis Section Loading */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium mb-4">Analysis</h3>
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                  
                  {/* Stock Price Section Loading */}
                  <div className="border rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium mb-2">Stock Info</h3>
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-40"></div>
                    </div>
                  </div>
                  
                  {/* Top Stories Section Loading */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Latest News</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="border rounded-lg p-4 flex">
                          <div className="mr-3 flex-shrink-0">
                            <div className="animate-pulse bg-gray-200 w-20 h-20 rounded"></div>
                          </div>
                          <div className="flex-grow">
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Organic Results Section Loading */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Additional Information</h3>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="animate-pulse space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 rounded w-32"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              }
            />;

            const response = await getJson(searchParams);
            console.log("SERP API Response:", response);

            // Extract the most relevant information from the SERP response
            const extractedData = {
              topStories: response.top_stories || [],
              organicResults: response.organic_results || [],
              knowledgeGraph: response.knowledge_graph || {},
            };

            // Show loading state with SERP API complete but OpenAI analysis in progress
            yield <Message 
              role="assistant" 
              content={
                <div className="w-full max-w-6xl mx-auto p-4">
                  <h2 className="text-xl font-semibold mb-4">
                    Results for: {query}
                  </h2>
                  
                  {/* AI Analysis Section Loading */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium mb-4">Analysis</h3>
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="text-sm text-blue-500 mt-3">
                      Analyzing data...
                    </div>
                  </div>
                  
                  {/* Stock Price Section - Real Data */}
                  {response.knowledge_graph?.stock_price && (
                    <div className="border rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-medium mb-2">Stock Info</h3>
                      <p className="text-xl font-bold">
                        {response.knowledge_graph.stock_price}
                      </p>
                    </div>
                  )}

                  {/* Top Stories Section - Real Data */}
                  {response.top_stories &&
                    response.top_stories.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">
                          Latest News
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {response.top_stories
                            .slice(0, 4)
                            .map((story : any, index : number) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4 flex"
                              >
                                {story.thumbnail && (
                                  <div className="mr-3 flex-shrink-0">
                                    <img
                                      src={story.thumbnail}
                                      alt={story.title}
                                      className="w-20 h-20 object-cover rounded"
                                    />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium text-sm">
                                    {story.title}
                                  </h4>
                                  <div className="flex items-center mt-2 text-xs">
                                    <span className="text-gray-500">
                                      {story.source} • {story.date}
                                    </span>
                                  </div>
                                  <a
                                    href={story.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 text-xs hover:underline mt-1 inline-block"
                                  >
                                    Read more
                                  </a>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Organic Results Section - Real Data */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Additional Information
                    </h3>
                    <div className="space-y-4">
                      {response.organic_results
                        ?.slice(0, 3)
                        .map((result : any, index : number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <h3 className="font-medium">{result.title}</h3>
                            <p className="text-sm text-gray-600">
                              {result.snippet}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <a
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 text-sm hover:underline"
                              >
                                Read more
                              </a>
                              {result.displayed_link && (
                                <span className="text-xs text-gray-500">
                                  {result.displayed_link}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              }
            />;

            // Send the extracted data to OpenAI for analysis
            const openaiResponse = await fetch(
              "https://api.openai.com/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                  model: "gpt-4-turbo",
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a financial analyst who provides concise summaries of stock market news. Focus on explaining key reasons for stock price movements.",
                    },
                    {
                      role: "user",
                      content: `Based on this recent search data about "${query}", provide a brief analysis on what's happening with this stock and why: ${JSON.stringify(
                        extractedData
                      )}`,
                    },
                  ],
                  temperature: 0.3,
                  max_tokens: 350,
                }),
              }
            );

            const openaiData = await openaiResponse.json();
            const analysis = openaiData.choices[0].message.content;

            // Return both the SERP results and OpenAI analysis to the UI
            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "getStockNews",
                    args: { query },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "getStockNews",
                    toolCallId,
                    result: {
                      serpResponse: response,
                      openaiAnalysis: analysis,
                    },
                  },
                ],
              },
            ]);

            // Final render with all real data
            return (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-6xl mx-auto p-4">
                    <h2 className="text-xl font-semibold mb-4">
                      Results for: {query}
                    </h2>

                    {/* AI Analysis Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 prose prose-blue max-w-none">
                      <h3 className="text-lg font-medium mb-4">Analysis</h3>
                      <div 
                        className="text-gray-800 space-y-4"
                        dangerouslySetInnerHTML={{ 
                          __html: marked.parse(analysis, {
                            breaks: true,
                            gfm: true
                          }) 
                        }}
                      />
                    </div>

                    {/* Stock Price Section */}
                    {response.knowledge_graph?.stock_price && (
                      <div className="border rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-medium mb-2">Stock Info</h3>
                        <p className="text-xl font-bold">
                          {response.knowledge_graph.stock_price}
                        </p>
                      </div>
                    )}

                    {/* Top Stories Section */}
                    {response.top_stories &&
                      response.top_stories.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">
                            Latest News
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {response.top_stories
                              .slice(0, 4)
                              .map((story : any, index : number) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-4 flex"
                                >
                                  {story.thumbnail && (
                                    <div className="mr-3 flex-shrink-0">
                                      <img
                                        src={story.thumbnail}
                                        alt={story.title}
                                        className="w-20 h-20 object-cover rounded"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium text-sm">
                                      {story.title}
                                    </h4>
                                    <div className="flex items-center mt-2 text-xs">
                                      <span className="text-gray-500">
                                        {story.source} • {story.date}
                                      </span>
                                    </div>
                                    <a
                                      href={story.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 text-xs hover:underline mt-1 inline-block"
                                    >
                                      Read more
                                    </a>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Organic Results Section */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Additional Information
                      </h3>
                      <div className="space-y-4">
                        {response.organic_results
                          ?.slice(0, 3)
                          .map((result : any, index : number) => (
                            <div key={index} className="border rounded-lg p-4">
                              <h3 className="font-medium">{result.title}</h3>
                              <p className="text-sm text-gray-600">
                                {result.snippet}
                              </p>
                              <div className="flex justify-between items-center mt-2">
                                <a
                                  href={result.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 text-sm hover:underline"
                                >
                                  Read more
                                </a>
                                {result.displayed_link && (
                                  <span className="text-xs text-gray-500">
                                    {result.displayed_link}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                }
              />
            );
          } catch (error) {
            console.error("Error:", error);
            return (
              <Message
                role="assistant"
                content="Sorry, I couldn't fetch the stock information at this moment."
              />
            );
          }
        },
      },
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
              z.object({ name: z.string(), status: z.boolean() })
            ),
            locks: z.array(
              z.object({ name: z.string(), isLocked: z.boolean() })
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
          timeframe: z.enum(["recent", "full", "historical"]).optional(),
          month: z.string().optional(),
        }),
        generate: async function* ({ symbol, timeframe = "recent", month }) {
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

          return (
            <Message
              role="assistant"
              content={<StockView data={stockData} symbol={symbol} />}
            />
          );
        },
      },
      listIndianStocks: {
        description: "show Indian market stocks information",
        parameters: z.object({
          symbol: z
            .string()
            .describe("Indian stock symbol (e.g., RELIANCE.BSE, TCS.BSE)"),
        }),
        generate: async function* ({ symbol }) {
          const toolCallId = generateId();
          
          // Show loading state for Indian stocks
          yield <Message 
            role="assistant" 
            content={
              <div className="w-full max-w-6xl mx-auto p-4">
                <h2 className="text-xl font-semibold mb-4">Indian Markets</h2>
                <div className="border rounded-lg p-4">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="flex space-x-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            }
          />;
          
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