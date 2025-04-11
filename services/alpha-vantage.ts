export interface StockData {
  symbol: string;
  interval: string;
  lastRefreshed: string;
  timeSeries: {
    [timestamp: string]: {
      open: string;
      high: string;
      low: string;
      close: string;
      volume: string;
    };
  };
}

export async function getStockData(
  symbol: string,
  timeframe: 'recent' | 'full' | 'historical' = 'recent',
  month?: string
): Promise<StockData | null> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    let url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min`;

    if (timeframe === 'full') {
      url += '&outputsize=full';
    } else if (timeframe === 'historical' && month) {
      url += `&month=${month}&outputsize=full`;
    }

    url += `&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      console.error('Alpha Vantage API error:', data['Error Message']);
      return null;
    }

    const metadata = data['Meta Data'];
    const timeSeries = data['Time Series (5min)'];

    return {
      symbol: metadata['2. Symbol'],
      interval: metadata['4. Interval'],
      lastRefreshed: metadata['3. Last Refreshed'],
      timeSeries: timeSeries
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

export async function searchStocks(keywords: string = ""): Promise<Array<{symbol: string, name: string}>> {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.bestMatches) {
      return data.bestMatches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name']
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching stock list:', error);
    return [];
  }
}