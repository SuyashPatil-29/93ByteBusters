"use client";

import { motion } from "framer-motion";

interface DailyData {
  "1. open": string;
  "2. high": string;
  "3. low": string;
  "4. close": string;
  "5. volume": string;
}

interface IndianStockProps {
  symbol: string | undefined;
  data: {
    "Time Series (Daily)": {
      [date: string]: DailyData;
    };
  };
}

export const IndianStockView = ({ symbol, data }: IndianStockProps) => {
  // Add error handling for missing or invalid data
  if (!data || !data["Time Series (Daily)"]) {
    return (
      <motion.div
        className="md:max-w-[652px] max-w-[calc(100dvw-80px)] w-full pb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{symbol?.replace('.BSE', '')}</h2>
            <span className="text-sm text-zinc-500">BSE</span>
          </div>
          <p className="text-zinc-500">No data available for this stock</p>
        </div>
      </motion.div>
    );
  }

  const dates = Object.keys(data["Time Series (Daily)"]).slice(0, 5);
  const latestDate = dates[0];
  const latestData = data["Time Series (Daily)"][latestDate];

  return (
    <motion.div
      className="md:max-w-[652px] max-w-[calc(100dvw-80px)] w-full pb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{symbol?.replace('.BSE', '')}</h2>
          <span className="text-sm text-zinc-500">BSE</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-sm text-zinc-500">Current</div>
            <div className="text-lg">₹{parseFloat(latestData["4. close"]).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Volume</div>
            <div className="text-lg">{parseInt(latestData["5. volume"]).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">High</div>
            <div className="text-lg">₹{parseFloat(latestData["2. high"]).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-zinc-500">Low</div>
            <div className="text-lg">₹{parseFloat(latestData["3. low"]).toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Historical Data</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500">
                  <th className="text-left p-2">Date</th>
                  <th className="text-right p-2">Open</th>
                  <th className="text-right p-2">High</th>
                  <th className="text-right p-2">Low</th>
                  <th className="text-right p-2">Close</th>
                  <th className="text-right p-2">Volume</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((date) => {
                  const dayData = data["Time Series (Daily)"][date];
                  return (
                    <tr key={date} className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="p-2">{new Date(date).toLocaleDateString()}</td>
                      <td className="text-right p-2">₹{parseFloat(dayData["1. open"]).toFixed(2)}</td>
                      <td className="text-right p-2">₹{parseFloat(dayData["2. high"]).toFixed(2)}</td>
                      <td className="text-right p-2">₹{parseFloat(dayData["3. low"]).toFixed(2)}</td>
                      <td className="text-right p-2">₹{parseFloat(dayData["4. close"]).toFixed(2)}</td>
                      <td className="text-right p-2">{parseInt(dayData["5. volume"]).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};