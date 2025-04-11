"use client";
import React, { useState } from "react";
import { Search } from "lucide-react";

// Define TypeScript interfaces for the data structure
interface Quote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  exchange: string;
  marketState: string;
}

interface ResultItem {
  count: number;
  quotes: Quote[];
}

interface FinanceData {
  finance: {
    result: ResultItem[];
    error: null | string;
  };
}

// Props interface for our component
interface StockDashboardProps {
  data: FinanceData;
}

const StockDashboard: React.FC<StockDashboardProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Extract quotes from the data
  const quotes = data?.finance?.result?.[0]?.quotes || [];

  // Filter quotes based on search term
  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format the price and change values
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatPercent = (percent: number) => {
    return percent >= 0
      ? `(+${percent.toFixed(2)}%)`
      : `(${percent.toFixed(2)}%)`;
  };

  // Function to get exchange code display
  const getExchangeDisplay = (exchange: string) => {
    if (exchange === "NMS") return "NMS";
    if (exchange === "NYQ") return "NY";
    if (exchange === "NYQ") return "NYQ"; // Special case for PFE
    return exchange;
  };

  return (
    <div>
      {/* Main content */}
      <div className="max-w-7xl">
        <div className="rounded-lg">
          {/* Stocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredQuotes.map((quote) => (
              <div
                key={quote.symbol}
                className="bg-white rounded-md p-5 shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {quote.symbol}
                    </h3>
                    <p className="text-sm text-gray-600">{quote.shortName}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {getExchangeDisplay(quote.exchange)}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-900">
                      ${formatPrice(quote.regularMarketPrice)}
                    </span>
                    <span
                      className={`ml-2 flex items-center ${
                        quote.regularMarketChange >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {quote.regularMarketChange >= 0 ? (
                          <path
                            d="M6 2L10 6L6 10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : (
                          <path
                            d="M6 10L2 6L6 2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </svg>
                      {formatChange(quote.regularMarketChange)}
                    </span>
                    <span
                      className={`ml-1 text-xs ${
                        quote.regularMarketChangePercent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatPercent(quote.regularMarketChangePercent)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Previous close: $
                    {formatPrice(quote.regularMarketPreviousClose)}
                  </p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {quote.marketState}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;
