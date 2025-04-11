"use client";

import { StockData } from "@/services/alpha-vantage";
import { motion } from "framer-motion";
import { useState } from "react";
import { Card } from "./ui/card";

export const StockView = ({ 
  data, 
  symbol 
}: { 
  data: StockData | null;
  symbol: string;
}) => {
  const [timeframe, setTimeframe] = useState<'recent' | 'full' | 'historical'>('recent');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  if (!data) {
    return (
      <div className="text-red-500">
        Unable to fetch data for {symbol}
      </div>
    );
  }

  const latestTimestamp = Object.keys(data.timeSeries)[0];
  const latestData = data.timeSeries[latestTimestamp];
  const timeSeriesData = Object.entries(data.timeSeries).slice(0, 20); // Show last 20 entries

  return (
    <Card className="w-full max-w-[1400px] mx-auto">
      <div className="md:max-w-[652px] max-w-[calc(100dvw-80px)] w-full pb-6">
        <motion.div
          className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{symbol}</h2>
            <div className="flex items-center gap-2">
              <select 
                className="bg-white dark:bg-zinc-700 rounded px-2 py-1 text-sm"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
              >
                <option value="recent">Recent</option>
                <option value="full">30 Days</option>
                <option value="historical">Historical</option>
              </select>
              {timeframe === 'historical' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white dark:bg-zinc-700 rounded px-2 py-1 text-sm"
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-zinc-500">Current</div>
              <div className="text-lg">${parseFloat(latestData.close).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Volume</div>
              <div className="text-lg">{parseInt(latestData.volume).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">High</div>
              <div className="text-lg">${parseFloat(latestData.high).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Low</div>
              <div className="text-lg">${parseFloat(latestData.low).toFixed(2)}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Historical Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="text-left p-2">Time</th>
                    <th className="text-right p-2">Open</th>
                    <th className="text-right p-2">High</th>
                    <th className="text-right p-2">Low</th>
                    <th className="text-right p-2">Close</th>
                    <th className="text-right p-2">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {timeSeriesData.map(([timestamp, data]) => (
                    <tr key={timestamp} className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="p-2">{new Date(timestamp).toLocaleTimeString()}</td>
                      <td className="text-right p-2">${parseFloat(data.open).toFixed(2)}</td>
                      <td className="text-right p-2">${parseFloat(data.high).toFixed(2)}</td>
                      <td className="text-right p-2">${parseFloat(data.low).toFixed(2)}</td>
                      <td className="text-right p-2">${parseFloat(data.close).toFixed(2)}</td>
                      <td className="text-right p-2">{parseInt(data.volume).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
      </Card>
    );
};