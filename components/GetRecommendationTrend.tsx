"use client"; // Add this at the top to make it a client component

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define interfaces for our data structure
interface TrendItem {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface RecommendationTrendProps {
  data: {
    quoteSummary: {
      result: Array<{
        recommendationTrend: {
          trend: Array<TrendItem>;
        };
      }>;
    };
  };
}

interface ChartDataItem {
    period: string;
    "Strong Buy": number;
    "Buy": number;
    "Hold": number;
    "Sell": number;
    "Strong Sell": number;
    total: number;
  }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-semibold">{`Period: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RecommendationTrend: React.FC<RecommendationTrendProps> = ({ data }) => {
  // Extract the trend data from the input
  const trendData = data?.quoteSummary?.result?.[0]?.recommendationTrend?.trend || [];
  
  // Transform the data for display
  const chartData: ChartDataItem[] = trendData.map(item => {
    let period = item.period;
    // Make the period more readable
    if (period === "0m") period = "Current Month";
    else if (period === "-1m") period = "1 Month Ago";
    else if (period === "-2m") period = "2 Months Ago";
    
    return {
      period,
      "Strong Buy": item.strongBuy,
      "Buy": item.buy,
      "Hold": item.hold,
      "Sell": item.sell,
      "Strong Sell": item.strongSell,
      // Calculate total recommendations
      total: item.strongBuy + item.buy + item.hold + item.sell + item.strongSell
    };
  }).reverse(); // Show oldest data first
  
  // Calculate the current distribution for the summary
  const currentData = trendData.find(item => item.period === "0m") || {
    strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0
  };
  
  const totalAnalysts = currentData.strongBuy + currentData.buy + 
                        currentData.hold + currentData.sell + currentData.strongSell;
  
  // Determine overall recommendation based on weighted average
  const calculateOverallRating = (): string => {
    if (totalAnalysts === 0) return "No Ratings";
    
    const weightedSum = 
      (currentData.strongBuy * 5) + 
      (currentData.buy * 4) + 
      (currentData.hold * 3) + 
      (currentData.sell * 2) + 
      (currentData.strongSell * 1);
    
    const weightedAvg = weightedSum / totalAnalysts;
    
    if (weightedAvg >= 4.5) return "Strong Buy";
    if (weightedAvg >= 3.5) return "Buy";
    if (weightedAvg >= 2.5) return "Hold";
    if (weightedAvg >= 1.5) return "Sell";
    return "Strong Sell";
  };
  
  const overallRating = calculateOverallRating();

  if (!data?.quoteSummary?.result?.length) {
    return <div className="text-center p-6 bg-gray-100 rounded-md">No recommendation data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Analyst Recommendations</h2>
      
      <div className="mb-8 bg-gray-50 p-4 rounded-md">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-700">Current Rating: <span className="font-bold">{overallRating}</span></h3>
            <p className="text-gray-600 mt-1">Based on {totalAnalysts} analyst ratings</p>
          </div>
          
          <div className="flex gap-4 flex-wrap mt-4 md:mt-0">
            <div className="text-center">
              <div className="font-bold text-green-700 text-2xl">{currentData.strongBuy}</div>
              <div className="text-sm">Strong Buy</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-emerald-600 text-2xl">{currentData.buy}</div>
              <div className="text-sm">Buy</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-500 text-2xl">{currentData.hold}</div>
              <div className="text-sm">Hold</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600 text-2xl">{currentData.sell}</div>
              <div className="text-sm">Sell</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-700 text-2xl">{currentData.strongSell}</div>
              <div className="text-sm">Strong Sell</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            stackOffset="expand"
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Strong Buy" stackId="a" fill="#22c55e" />
            <Bar dataKey="Buy" stackId="a" fill="#10b981" />
            <Bar dataKey="Hold" stackId="a" fill="#eab308" />
            <Bar dataKey="Sell" stackId="a" fill="#f97316" />
            <Bar dataKey="Strong Sell" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Chart shows distribution of analyst recommendations over time</p>
      </div>
    </div>
  );
};

export default RecommendationTrend;