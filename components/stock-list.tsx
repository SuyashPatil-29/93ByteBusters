"use client";

import { motion } from "framer-motion";

interface StockData {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
}

interface StockListProps {
  gainers: StockData[];
  losers: StockData[];
  activelyTraded: StockData[];
}

export const StockList = ({ gainers, losers, activelyTraded }: StockListProps) => {
  const renderStockCard = (stock: StockData, type: 'gainer' | 'loser' | 'active') => {
    const isPositive = parseFloat(stock.change_percentage) > 0;
    
    return (
      <motion.div
        key={stock.ticker}
        className="p-3 bg-white dark:bg-zinc-700 rounded-lg shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex justify-between items-start">
          <div className="font-medium">{stock.ticker}</div>
          <div className="text-right">
            <div className="font-medium">${stock.price}</div>
            <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {stock.change_percentage}
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Vol: {parseInt(stock.volume).toLocaleString()}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Top Gainers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gainers.map(stock => renderStockCard(stock, 'gainer'))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Top Losers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {losers.map(stock => renderStockCard(stock, 'loser'))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Most Active</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activelyTraded.map(stock => renderStockCard(stock, 'active'))}
        </div>
      </div>
    </div>
  );
};