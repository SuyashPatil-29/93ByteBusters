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
import { symbol, z } from "zod";

import StockDataDisplay from "@/components/indian-stock-view";
import { marked } from "marked";
import FirecrawlApp from "@mendable/firecrawl-js";
import axios from "axios";
import StockList from "@/components/stock-list";
import dynamic from "next/dynamic";

const RecommendationTrend = dynamic(
  () => import("@/components/GetRecommendationTrend"),
  { ssr: false }
);

export interface Hub {
  climate: Record<"low" | "high", number>;
  lights: Array<{ name: string; status: boolean }>;
  locks: Array<{ name: string; isLocked: boolean }>;
}

const sendMessage = async (message: string) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;

  const { value: stream } = await streamUI({
    model: openai("gpt-4o"),
    // In the sendMessage function, modify the system prompt:
    system: `\
    - you are a financial advisor assistant
    - help explain market movements and fund performance
    - use available tools to fetch and display stock data
    - support different timeframes: recent (default), full (30 days), or historical (specific month)
    - when users ask about stock recommendations or whether to buy/sell, use getStockRecommendation tool
    - provide context and explanation for the recommendation trends
    - reply in clear, concise language
    - when user says a number after news results, call scrapeStockInfo with the corresponding article URL
    - present numbered options for users to choose which article to analyze in detail
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
          yield (
            <Message
              role="assistant"
              content={
                <div className="w-full max-w-7xl mx-auto">
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
                    <h3 className="text-lg font-medium mb-2">
                      Additional Information
                    </h3>
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
            />
          );

          try {
            // Step 2: Search for the stock information
            const searchParams = {
              api_key: process.env.SERPAPI_KEY,
              engine: "google",
              q: query,
              num: 8,
            };

            // Show loading state with SERP API in progress
            yield (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-7xl mx-auto">
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
                          <div
                            key={index}
                            className="border rounded-lg p-4 flex"
                          >
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
                      <h3 className="text-lg font-medium mb-2">
                        Additional Information
                      </h3>
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
              />
            );

            const response = await getJson(searchParams);
            console.log("SERP API Response:", response);

            // Extract the most relevant information from the SERP response
            const extractedData = {
              topStories: response.top_stories || [],
              organicResults: response.organic_results || [],
              knowledgeGraph: response.knowledge_graph || {},
            };

            // Show loading state with SERP API complete but OpenAI analysis in progress
            yield (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-7xl mx-auto">
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
                              .map((story: any, index: number) => (
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
                          .map((result: any, index: number) => (
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
              <>
                <Message
                  role="assistant"
                  content={
                    <div className="w-full max-w-7xl mx-auto">
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
                              gfm: true,
                            }),
                          }}
                        />
                      </div>

                      {/* Stock Price Section */}
                      {response.knowledge_graph?.stock_price && (
                        <div className="border rounded-lg p-4 mb-6">
                          <h3 className="text-lg font-medium mb-2">
                            Stock Info
                          </h3>
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
                                .map((story: any, index: number) => (
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
                            .map((result: any, index: number) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4"
                              >
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
                <Message
                  role="assistant"
                  content={
                    <div className="w-full max-w-7xl mx-auto">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="font-medium mb-3">
                          Which article would you like me to analyze in detail?
                        </p>
                        <div className="space-y-2">
                          {response.top_stories?.map(
                            (story: any, index: number) => (
                              <div key={index} className="flex items-start">
                                <span className="font-medium mr-2">
                                  {index + 1}.
                                </span>
                                <div>
                                  <p className="text-sm text-gray-800">
                                    {story.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {story.source}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                          {response.organic_results?.map(
                            (result: any, index: number) => (
                              <div key={index} className="flex items-start">
                                <span className="font-medium mr-2">
                                  {(response.top_stories?.length || 0) +
                                    index +
                                    1}
                                  .
                                </span>
                                <div>
                                  <p className="text-sm text-gray-800">
                                    {result.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {result.displayed_link}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                          Just reply with the number of the article you&apos;d like
                          me to analyze in detail.
                        </p>
                      </div>
                    </div>
                  }
                />
              </>
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
      getCurrentMarketOverview: {
        description: "get current market overview and analysis",
        parameters: z.object({}),
        generate: async function* () {
          const toolCallId = generateId();

          // Step 1: Show initial loading state with skeletons for all sections
          yield (
            <Message
              role="assistant"
              content={
                <div className="w-full max-w-7xl mx-auto">
                  <h2 className="text-xl font-semibold mb-4">
                    Fetching Market Overview
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

                  {/* Market Indices Section Loading */}
                  <div className="border rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-medium mb-2">Market Indices</h3>
                    <div className="animate-pulse">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, index) => (
                          <div key={index} className="space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-24"></div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Market News Loading */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">
                      Latest Market News
                    </h3>
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

                  {/* Market Insights Loading */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Market Insights
                    </h3>
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
            />
          );

          try {
            // Step 2: Search for the market information
            const searchParams = {
              api_key: process.env.SERPAPI_KEY,
              engine: "google",
              q: "current stock market overview today major indices market news",
              num: 10,
            };

            // Show loading state with SERP API in progress
            yield (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-7xl mx-auto">
                    <h2 className="text-xl font-semibold mb-4">
                      Searching for market data...
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

                    {/* Market Indices Section Loading */}
                    <div className="border rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-medium mb-2">
                        Market Indices
                      </h3>
                      <div className="animate-pulse">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[...Array(4)].map((_, index) => (
                            <div key={index} className="space-y-2">
                              <div className="h-5 bg-gray-200 rounded w-24"></div>
                              <div className="h-6 bg-gray-200 rounded w-20"></div>
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Market News Loading */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">
                        Latest Market News
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-4 flex"
                          >
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

                    {/* Market Insights Loading */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Market Insights
                      </h3>
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
              />
            );

            const response = await getJson(searchParams);
            console.log("SERP API Response:", response);

            // Show loading state with SERP API complete but OpenAI analysis in progress
            yield (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-7xl mx-auto">
                    <h2 className="text-xl font-semibold mb-4">
                      Market Overview
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
                        Analyzing market data...
                      </div>
                    </div>

                    {/* Top Stories Section - Real Data */}
                    {response.top_stories &&
                      response.top_stories.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-4">
                            Latest Market News
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {response.top_stories
                              .slice(0, 6)
                              .map((story: any, index: number) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-4"
                                >
                                  <h4 className="font-medium text-sm mb-2">
                                    {story.title}
                                  </h4>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{story.source}</span>
                                    <span>{story.date}</span>
                                  </div>
                                  <a
                                    href={story.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 text-xs hover:underline mt-2 inline-block"
                                  >
                                    Read more
                                  </a>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Organic Results Section - Real Data */}
                    {response.organic_results &&
                      response.organic_results.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            Market Insights
                          </h3>
                          <div className="space-y-4">
                            {response.organic_results
                              .slice(0, 3)
                              .map((result: any, index: number) => (
                                <div
                                  key={index}
                                  className="border rounded-lg p-4"
                                >
                                  <h4 className="font-medium mb-2">
                                    {result.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {result.snippet}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <a
                                      href={result.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 text-sm hover:underline"
                                    >
                                      Read more
                                    </a>
                                    <span className="text-xs text-gray-500">
                                      {result.displayed_link}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                }
              />
            );

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
                        "You are a financial analyst providing concise market overviews. Focus on key market movements, trends, and their causes.",
                    },
                    {
                      role: "user",
                      content: `Provide a brief market overview based on this data: ${JSON.stringify(
                        response
                      )}`,
                    },
                  ],
                  temperature: 0.3,
                  max_tokens: 400,
                }),
              }
            );

            const openaiData = await openaiResponse.json();
            const analysis = openaiData.choices[0].message.content;

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "getCurrentMarketOverview",
                    args: {},
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "getCurrentMarketOverview",
                    toolCallId,
                    result: {
                      serpResponse: response,
                      openaiAnalysis: analysis,
                    },
                  },
                ],
              },
            ]);

            return (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-7xl mx-auto">
                    <h2 className="text-xl font-semibold mb-6">
                      Market Overview
                    </h2>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 prose prose-blue max-w-none">
                      <div
                        className="text-gray-800"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(analysis || ""),
                        }}
                      />
                    </div>

                    {response.top_stories && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-4">
                          Latest Market News
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {response.top_stories
                            .slice(0, 6)
                            .map((story: any, index: number) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4"
                              >
                                <h4 className="font-medium text-sm mb-2">
                                  {story.title}
                                </h4>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{story.source}</span>
                                  <span>{story.date}</span>
                                </div>
                                <a
                                  href={story.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 text-xs hover:underline mt-2 inline-block"
                                >
                                  Read more
                                </a>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {response.organic_results && (
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Market Insights
                        </h3>
                        <div className="space-y-4">
                          {response.organic_results
                            .slice(0, 3)
                            .map((result: any, index: number) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4"
                              >
                                <h4 className="font-medium mb-2">
                                  {result.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {result.snippet}
                                </p>
                                <div className="flex justify-between items-center">
                                  <a
                                    href={result.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 text-sm hover:underline"
                                  >
                                    Read more
                                  </a>
                                  <span className="text-xs text-gray-500">
                                    {result.displayed_link}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                }
              />
            );
          } catch (error) {
            console.error("Error fetching market overview:", error);
            return (
              <Message
                role="assistant"
                content={
                  <div className="text-red-500">
                    Sorry, I couldn&quot;t fetch the market overview at this
                    moment. Please try again later.
                  </div>
                }
              />
            );
          }
        },
      },
      listStocks: {
        description:
          "Get similar stocks and recommendations for a given company.",
        parameters: z.object({
          tickerSymbol: z.string().describe("The company or stock name."),
        }),
        generate: async function* ({ tickerSymbol }) {
          const toolCallId = generateId();

          yield (
            <Message
              role="assistant"
              content={
                <div className="w-full max-w-7xl mx-auto">
                  <h2 className="text-xl font-semibold mb-4">
                    Finding Similar Stocks to {tickerSymbol}
                  </h2>
                  <div className="border rounded-lg p-6">
                    <div className="animate-pulse space-y-6">
                      {/* Similar Stocks Loading Skeleton */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="space-y-3">
                              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              <div className="flex justify-between items-center mt-2">
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          );

          // Append .NS for NSE stocks
          const formattedSymbol = tickerSymbol.includes(".")
            ? tickerSymbol
            : `${tickerSymbol}.NS`;

          const options = {
            method: "GET",
            url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-recommendations",
            params: { symbol: formattedSymbol },
            headers: {
              "X-RapidAPI-Key": process.env.RAPID_API_KEY,
              "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
            },
          };

          try {
            const response = await axios.request(options);
            const data = response.data;

            console.log("Data:", JSON.stringify(data));
            console.log("Symbol:", symbol);

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
              <>
                <Message
                  role="assistant"
                  content={
                    <div>
                      <div className="w-full max-w-7xl mx-auto">
                        <StockList data={data} />
                      </div>
                      <div className="mt-6 text-gray-700">
                        Would you like me to analyze if this stock is a good buy
                        or sell opportunity right now? I can provide a detailed
                        recommendation based on current market trends and
                        analyst opinions.
                        <div className="mt-2 text-sm text-gray-500">
                          Just say &quot;Yes&quot; and I&quot;ll analyze{" "}
                          {tickerSymbol} in detail for you.
                        </div>
                      </div>
                    </div>
                  }
                />
              </>
            );
          } catch (error) {
            console.error("Error fetching stock recommendations:", error);
            return (
              <Message
                role="assistant"
                content={
                  <div className="text-red-500">
                    Failed to fetch stock recommendations. Please try again
                    later.
                  </div>
                }
              />
            );
          }
        },
      },
      scrapeStockInfo: {
        description: "scrape detailed stock information from a given URL",
        parameters: z.object({
          url: z.string().describe("URL to scrape"),
          query: z.string().describe("original stock query"),
        }),
        generate: async function* ({ url, query }) {
          const toolCallId = generateId();

          try {
            const app = new FirecrawlApp({
              apiKey: process.env.FIRECRAWL_API_KEY,
            });

            // Show loading state
            yield (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-7xl mx-auto">
                    <p>Scraping detailed information from: {url}</p>
                    <div className="animate-pulse space-y-3 mt-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                }
              />
            );

            const scrapeResult = await app.extract([url], {
              prompt: `Extract detailed information about ${query} from this page, including financial data, news, and analysis.`,
            });

            console.log("Scrape Result:", JSON.stringify(scrapeResult));

            if (!scrapeResult.success) {
              throw new Error(scrapeResult.error);
            }

            // Use the messages object from the parent scope
            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "scrapeStockInfo",
                    args: { url, query },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "scrapeStockInfo",
                    toolCallId,
                    result: scrapeResult.data,
                  },
                ],
              },
            ]);

            return (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-5xl mx-auto px-4 space-y-8">
                    <div className="pb-2">
                      <h3 className="text-xs font-mono text-gray-500 tracking-wider">
                        SOURCE:{" "}
                        <span className="text-gray-700 font-medium">{url}</span>
                      </h3>
                    </div>

                    {typeof scrapeResult.data === "string" ? (
                      <div
                        className="prose prose-sm max-w-none text-gray-800 font-light leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(scrapeResult.data),
                        }}
                      />
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(scrapeResult.data).map(
                          ([section, content]) => {
                            if (Array.isArray(content) && content.length === 0)
                              return null;

                            return (
                              <div
                                key={section}
                                className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden"
                              >
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                                  <h3 className="text-sm font-medium text-gray-700 tracking-wider uppercase">
                                    {section.replace(/([A-Z])/g, " $1").trim()}
                                  </h3>
                                </div>

                                <div className="divide-y divide-gray-100">
                                  {Array.isArray(content) ? (
                                    content.map((item, index) => (
                                      <div
                                        key={index}
                                        className="p-6 hover:bg-gray-50 transition-colors duration-150"
                                      >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                          {Object.entries(item).map(
                                            ([key, value]) => (
                                              <div
                                                key={key}
                                                className="space-y-1"
                                              >
                                                <span className="block text-xs font-light text-gray-500 tracking-wider">
                                                  {key
                                                    .replace(/([A-Z])/g, " $1")
                                                    .trim()}
                                                </span>
                                                <span className="block text-sm text-gray-800 font-normal">
                                                  {value === null ? (
                                                    <span className="text-gray-300">
                                                      —
                                                    </span>
                                                  ) : (
                                                    String(value)
                                                  )}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : typeof content === "object" &&
                                    content !== null ? (
                                    <div className="p-6">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {Object.entries(content).map(
                                          ([key, value]) => (
                                            <div
                                              key={key}
                                              className="space-y-1"
                                            >
                                              <span className="block text-xs font-light text-gray-500 tracking-wider">
                                                {key
                                                  .replace(/([A-Z])/g, " $1")
                                                  .trim()}
                                              </span>
                                              <span className="block text-sm text-gray-800 font-normal">
                                                {value === null ? (
                                                  <span className="text-gray-300">
                                                    —
                                                  </span>
                                                ) : (
                                                  String(value)
                                                )}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-6">
                                      <p className="text-sm text-gray-800 font-light">
                                        {String(content)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                }
              />
            );
          } catch (error: any) {
            console.error("Scraping error:", error);
            return (
              <Message
                role="assistant"
                content={`Failed to scrape detailed information from the URL: ${error.message}`}
              />
            );
          }
        },
      },
      getNSEData: {
        description: "get NSE India equity data for a specific symbol",
        parameters: z.object({
          symbol: z
            .string()
            .describe("NSE symbol (e.g., AXISVALUE, NIFTY50, etc.)"),
        }),
        generate: async function* ({ symbol }) {
          const toolCallId = generateId();

          try {
            // Show loading state
            yield (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-7xl mx-auto">
                    <p>Fetching NSE data for: {symbol}</p>
                    <div className="animate-pulse space-y-3 mt-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                }
              />
            );

            const app = new FirecrawlApp({
              apiKey: process.env.FIRECRAWL_API_KEY,
            });

            const url = `https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`;

            const scrapeResult = await app.extract([url], {
              prompt: `Extract detailed stock information for ${symbol} including:
                - Current price
                - Day's high/low
                - Volume
                - 52-week high/low
                - Market cap
                - P/E ratio
                - Any other relevant trading data`,
            });

            if (!scrapeResult.success) {
              throw new Error(scrapeResult.error);
            }

            console.log("Scrape Result:", JSON.stringify(scrapeResult));

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "getNSEData",
                    args: { symbol },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName: "getNSEData",
                    toolCallId,
                    result: scrapeResult.data,
                  },
                ],
              },
            ]);

            return (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-5xl mx-auto px-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
                      <h2 className="text-lg font-semibold mb-4">
                        {symbol} - NSE Data
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {typeof scrapeResult.data === "string" ? (
                          <div
                            className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200"
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(scrapeResult.data),
                            }}
                          />
                        ) : (
                          Object.entries(scrapeResult.data).map(
                            ([key, value]) => {
                              // Skip empty objects
                              if (
                                typeof value === "object" &&
                                value !== null &&
                                Object.keys(value).length === 0
                              ) {
                                return null;
                              }

                              // Handle nested objects
                              if (typeof value === "object" && value !== null) {
                                return (
                                  <div
                                    key={key}
                                    className="border dark:border-zinc-700 p-4 rounded"
                                  >
                                    <span className="text-sm text-zinc-500 block mb-2">
                                      {key.replace(/([A-Z])/g, " $1").trim()}
                                    </span>
                                    <div className="pl-4 space-y-2">
                                      {Object.entries(value).map(
                                        ([nestedKey, nestedValue]) => (
                                          <div key={nestedKey}>
                                            <span className="text-sm text-zinc-500">
                                              {nestedKey
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                            </span>
                                            <div className="font-medium">
                                              {nestedValue === null
                                                ? "—"
                                                : String(nestedValue)}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              // Handle regular key-value pairs
                              return (
                                <div
                                  key={key}
                                  className="border-b dark:border-zinc-700 pb-2"
                                >
                                  <span className="text-sm text-zinc-500">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                  <div className="font-medium">
                                    {value === null ? "—" : String(value)}
                                  </div>
                                </div>
                              );
                            }
                          )
                        )}
                      </div>
                    </div>
                  </div>
                }
              />
            );
          } catch (error: any) {
            return (
              <Message
                role="assistant"
                content={
                  <div className="text-red-500">
                    Error fetching NSE data: {error.message}
                    <br />
                    Please provide a valid NSE symbol (e.g., AXISVALUE, NIFTY50)
                  </div>
                }
              />
            );
          }
        },
      },
      listIndianStocks: {
        description: "show Indian market stocks information",
        parameters: z.object({
          symbol: z
            .string()
            .describe("Indian stock symbol (e.g., RELIANCE.NS, TCS.NS)"),
        }),
        generate: async function* ({ symbol }) {
          const toolCallId = generateId();

          yield (
            <Message
              role="assistant"
              content={
                <div className="w-full max-w-7xl mx-auto">
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
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          );

          try {
            const options = {
              method: "GET",
              url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v3/get-chart",
              params: {
                interval: "1d",
                symbol: symbol,
                range: "3mo",
                region: "IN",
                includePrePost: "false",
                useYfid: "true",
                includeAdjustedClose: "true",
                events: "capitalGain,div,split",
              },
              headers: {
                "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
              },
            };

            const response = await axios.request(options);
            const data = response.data;

            console.log("Data:", JSON.stringify(data));
            console.log("Symbol:", symbol);

            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName: "listIndianStocks",
                    args: { symbol },
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
                  <div className="w-full max-w-7xl mx-auto">
                    <h2 className="text-xl font-semibold mb-4">
                      Indian Markets - {symbol}
                    </h2>
                    <StockDataDisplay apiData={data} />
                  </div>
                }
              />
            );
          } catch (error) {
            console.error("Error fetching stock data:", error);
            return (
              <Message
                role="assistant"
                content={
                  <div className="text-red-500">
                    Error fetching stock data. Please ensure you&quot;re using a
                    valid symbol (e.g., RELIANCE.NS, TCS.NS)
                  </div>
                }
              />
            );
          }
        },
      },
      getStockRecommendation: {
        description: "get analyst recommendations and trend data for a stock",
        parameters: z.object({
          symbol: z
            .string()
            .describe("stock symbol to get recommendations for"),
        }),
        generate: async function* ({ symbol }, { toolName, toolCallId }) {
          try {
            // Initial loading state
            yield (
              <Message
                role="assistant"
                content={
                  <div className="w-full max-w-4xl mx-auto">
                    <div className="w-full max-w-4xl mx-auto">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                          Loading Analyst Recommendations
                        </h2>
                        <div className="animate-pulse">
                          {/* Summary section skeleton */}
                          <div className="mb-8 bg-gray-50 p-4 rounded-md">
                            <div className="flex justify-between items-center">
                              <div className="space-y-3">
                                <div className="h-6 bg-gray-200 rounded w-48"></div>
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                              </div>
                              <div className="flex gap-4">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="text-center">
                                    <div className="h-8 w-12 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Chart skeleton */}
                          <div className="h-64 bg-gray-50 rounded-md"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            );

            const options = {
              method: "GET",
              url: "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/get-recommendation-trend",
              params: {
                symbol: symbol.toUpperCase(),
                region: "US",
                lang: "en-US",
              },
              headers: {
                "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
              },
            };

            const response = await axios.request(options);

            if (!response.data) {
              throw new Error("No data received from API");
            }

            // Update messages state
            messages.done([
              ...(messages.get() as CoreMessage[]),
              {
                role: "assistant",
                content: [
                  {
                    type: "tool-call",
                    toolCallId,
                    toolName,
                    args: { symbol },
                  },
                ],
              },
              {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolName,
                    toolCallId,
                    result: response.data,
                  },
                ],
              },
            ]);

            // Return final result
            return (
              <Message
                role="assistant"
                content={
                  <div>
                    <RecommendationTrend data={response.data} />
                    <p className="mt-4 text-sm text-gray-600">
                      Would you like me to analyze any specific aspects of these
                      recommendations?
                    </p>
                  </div>
                }
              />
            );
          } catch (error) {
            console.error("Error fetching recommendation data:", error);

            return (
              <Message
                role="assistant"
                content={
                  <div className="text-red-500">
                    Sorry, I couldn&quot;t fetch the recommendation data for{" "}
                    {symbol}. Please check if the symbol is correct or try again
                    later.
                  </div>
                }
              />
            );
          }
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
