// "use client"

// import * as React from "react"
// import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import {
//   ChartConfig,
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart"

// // TypeScript interfaces for stock data
// interface DailyData {
//   "1. open": string;
//   "2. high": string;
//   "3. low": string;
//   "4. close": string;
//   "5. volume": string;
// }

// interface MetaData {
//   "1. Information": string;
//   "2. Symbol": string;
//   "3. Last Refreshed": string;
//   "4. Output Size": string;
//   "5. Time Zone": string;
// }

// interface TimeSeries {
//   [date: string]: DailyData;
// }

// interface StockDataResponse {
//   "Meta Data": MetaData;
//   "Time Series (Daily)": TimeSeries;
// }

// interface StockChartProps {
//   apiData: StockDataResponse;
// }

// const chartConfig = {
//   price: {
//     label: "Price",
//   },
//   open: {
//     label: "Open",
//     color: "hsl(var(--chart-1))",
//   },
//   high: {
//     label: "High",
//     color: "hsl(var(--chart-2))",
//   },
//   low: {
//     label: "Low",
//     color: "hsl(var(--chart-3))",
//   },
//   close: {
//     label: "Close",
//     color: "hsl(var(--chart-4))",
//   },
//   volume: {
//     label: "Volume",
//     color: "hsl(var(--chart-5))",
//   }
// } satisfies ChartConfig

// export function StockChart({ apiData }: StockChartProps) {
//   const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("close");
//   const [stockData, setStockData] = React.useState<StockDataResponse | null>(null);
//   const [loading, setLoading] = React.useState(true);
//   const [error, setError] = React.useState<string | null>(null);
//   const [chartData, setChartData] = React.useState<any[]>([]);

//   console.log("Api Data", apiData)
  
//   React.useEffect(() => {
//     try {
//       setStockData(apiData);
      
//       // Convert raw data to chart format
//       const formattedData = Object.entries(apiData["Time Series (Daily)"])
//         .map(([date, data]) => ({
//           date,
//           open: parseFloat(data["1. open"]),
//           high: parseFloat(data["2. high"]),
//           low: parseFloat(data["3. low"]),
//           close: parseFloat(data["4. close"]),
//           volume: parseInt(data["5. volume"])
//         }))
//         .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
//       setChartData(formattedData);
//       setLoading(false);
//     } catch (err) {
//       console.log("Error", err)
//       setError("Failed to load stock data");
//       setLoading(false);
//     }
//   }, [apiData]);
  
//   if (loading) return <div className="flex justify-center p-8">Loading...</div>;
//   if (error) return <div className="text-red-500 p-4">{error}</div>;
//   if (!stockData || chartData.length === 0) return <div className="text-gray-500 p-4">No data available</div>;

//   const symbol = stockData["Meta Data"]["2. Symbol"];
//   const lastRefreshed = stockData["Meta Data"]["3. Last Refreshed"];

//   const averages = {
//     open: Number((chartData.reduce((acc, curr) => acc + curr.open, 0) / chartData.length).toFixed(2)),
//     high: Number((chartData.reduce((acc, curr) => acc + curr.high, 0) / chartData.length).toFixed(2)),
//     low: Number((chartData.reduce((acc, curr) => acc + curr.low, 0) / chartData.length).toFixed(2)),
//     close: Number((chartData.reduce((acc, curr) => acc + curr.close, 0) / chartData.length).toFixed(2)),
//     volume: Math.round(chartData.reduce((acc, curr) => acc + curr.volume, 0) / chartData.length),
//   };

//   return (
//     <Card className="w-full max-w-[1400px] mx-auto">
//       <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
//         <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
//           <CardTitle>{symbol} Stock Data</CardTitle>
//           <CardDescription>
//             Last updated: {lastRefreshed}
//           </CardDescription>
//         </div>
//         <div className="flex flex-wrap">
//           {["close", "open", "high", "low"].map((key) => {
//             const chart = key as keyof typeof chartConfig;
//             return (
//               <button
//                 key={chart}
//                 data-active={activeChart === chart}
//                 className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-6 sm:py-4"
//                 onClick={() => setActiveChart(chart)}
//               >
//                 <span className="text-xs text-muted-foreground">
//                   {chartConfig[chart].label}
//                 </span>
//                 <span className="text-lg font-bold leading-none sm:text-2xl">
//                   {averages[chart as keyof typeof averages].toLocaleString()}
//                 </span>
//               </button>
//             )
//           })}
//         </div>
//       </CardHeader>
//       <CardContent className="px-2 sm:p-6">
//         <ChartContainer
//           config={chartConfig}
//           className="aspect-auto h-[500px] w-full"  // Increased height
//         >
//           <LineChart
//             accessibilityLayer
//             data={chartData}
//             margin={{
//               top: 20,
//               right: 30,
//               left: 20,
//               bottom: 10,
//             }}
//           >
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis
//               dataKey="date"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               minTickGap={32}
//               tickFormatter={(value) => {
//                 const date = new Date(value);
//                 return date.toLocaleDateString("en-US", {
//                   month: "short",
//                   day: "numeric",
//                 });
//               }}
//             />
//             <YAxis 
//               domain={['dataMin - 10', 'dataMax + 10']} 
//               tickFormatter={(value) => value.toFixed(0)}
//             />
//             <ChartTooltip
//               content={
//                 <ChartTooltipContent
//                   className="w-[180px]"
//                   nameKey="price"
//                   labelFormatter={(value) => {
//                     return new Date(value).toLocaleDateString("en-US", {
//                       month: "short",
//                       day: "numeric",
//                       year: "numeric",
//                     })
//                   }}
//                 />
//               }
//             />
//             <Line 
//               type="monotone" 
//               dataKey={activeChart} 
//               stroke={`var(--color-${activeChart})`} 
//               strokeWidth={2}
//               dot={{ r: 4 }}
//               activeDot={{ r: 6 }}
//             />
//           </LineChart>
//         </ChartContainer>
        
//         {/* Volume Bar Chart */}
//         <div className="mt-6">
//           <h3 className="mb-4 text-lg font-medium">Trading Volume</h3>
//           <ChartContainer
//             config={chartConfig}
//             className="aspect-auto h-[300px] w-full"  // Increased height
//           >
//             <BarChart
//               accessibilityLayer
//               data={chartData}
//               margin={{
//                 top: 5,
//                 right: 30,
//                 left: 20,
//                 bottom: 5,
//               }}
//             >
//               <CartesianGrid strokeDasharray="3 3" vertical={false} />
//               <XAxis
//                 dataKey="date"
//                 tickLine={false}
//                 axisLine={false}
//                 tickMargin={8}
//                 minTickGap={32}
//                 tickFormatter={(value) => {
//                   const date = new Date(value);
//                   return date.toLocaleDateString("en-US", {
//                     month: "short",
//                     day: "numeric",
//                   });
//                 }}
//               />
//               <YAxis tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'} />
//               <ChartTooltip
//                 content={
//                   <ChartTooltipContent
//                     className="w-[180px]"
//                     nameKey="volume"
//                     labelFormatter={(value) => {
//                       return new Date(value).toLocaleDateString("en-US", {
//                         month: "short",
//                         day: "numeric",
//                         year: "numeric",
//                       })
//                     }}
//                     formatter={(value) => [value.toLocaleString(), "Volume"]}
//                   />
//                 }
//               />
//               <Bar dataKey="volume" fill="hsl(var(--chart-5))" />
//             </BarChart>
//           </ChartContainer>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// export default function StockDataDisplay() { return null; }

// export default StockChart;


"use client"

import * as React from "react"
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// TypeScript interfaces for Yahoo Finance data
interface QuoteData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

interface Indicators {
  quote: QuoteData[];
  adjclose?: { adjclose: number[] }[];
}

interface Result {
  meta: {
    currency: string;
    symbol: string;
    exchangeName: string;
    fullExchangeName: string;
    instrumentType: string;
    regularMarketPrice: number;
    regularMarketTime: number;
    chartPreviousClose: number;
    priceHint: number;
    longName: string;
    shortName: string;
  };
  timestamp: number[];
  indicators: Indicators;
}

interface YahooFinanceResponse {
  chart: {
    result: Result[];
    error: null | string;
  };
}

interface StockChartProps {
  apiData: YahooFinanceResponse;
}

const chartConfig = {
  price: {
    label: "Price",
  },
  open: {
    label: "Open",
    color: "hsl(var(--chart-1))",
  },
  high: {
    label: "High",
    color: "hsl(var(--chart-2))",
  },
  low: {
    label: "Low",
    color: "hsl(var(--chart-3))",
  },
  close: {
    label: "Close",
    color: "hsl(var(--chart-4))",
  },
  volume: {
    label: "Volume",
    color: "hsl(var(--chart-5))",
  }
} satisfies ChartConfig

export function StockChart({ apiData }: StockChartProps) {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("close");
  const [stockData, setStockData] = React.useState<Result | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      if (!apiData.chart.result || apiData.chart.result.length === 0) {
        throw new Error("No data available");
      }
      
      const result = apiData.chart.result[0];
      setStockData(result);
      
      // Convert raw data to chart format
      const formattedData = result.timestamp.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString(),
        open: result.indicators.quote[0].open[index],
        high: result.indicators.quote[0].high[index],
        low: result.indicators.quote[0].low[index],
        close: result.indicators.quote[0].close[index],
        volume: result.indicators.quote[0].volume[index]
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setChartData(formattedData);
      setLoading(false);
    } catch (err) {
      console.log("Error", err)
      setError("Failed to load stock data");
      setLoading(false);
    }
  }, [apiData]);
  
  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!stockData || chartData.length === 0) return <div className="text-gray-500 p-4">No data available</div>;

  const symbol = stockData.meta.symbol;
  const lastRefreshed = new Date(stockData.meta.regularMarketTime * 1000).toLocaleString();

  const averages = {
    open: Number((chartData.reduce((acc, curr) => acc + curr.open, 0) / chartData.length).toFixed(2)),
    high: Number((chartData.reduce((acc, curr) => acc + curr.high, 0) / chartData.length).toFixed(2)),
    low: Number((chartData.reduce((acc, curr) => acc + curr.low, 0) / chartData.length).toFixed(2)),
    close: Number((chartData.reduce((acc, curr) => acc + curr.close, 0) / chartData.length).toFixed(2)),
    volume: Math.round(chartData.reduce((acc, curr) => acc + curr.volume, 0) / chartData.length),
  };

  return (
    <Card className="w-full max-w-[1400px] mx-auto">
       <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{stockData.meta.longName} ({symbol})</CardTitle>
          <CardDescription className="w-[250px] whitespace-normal">
            Last updated: {lastRefreshed} | Current Price: ${stockData.meta.regularMarketPrice.toFixed(2)}
          </CardDescription>
        </div>
        <div className="flex flex-wrap">
          {["close", "open", "high", "low"].map((key) => {
            const chart = key as keyof typeof chartConfig;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-6 sm:py-4"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-base">
                  {averages[chart as keyof typeof averages].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[500px] w-full"  // Increased height
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']} 
              tickFormatter={(value) => value.toFixed(2)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  nameKey="price"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Line 
              type="monotone" 
              dataKey={activeChart} 
              stroke={`var(--color-${activeChart})`} 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
        
        {/* Volume Bar Chart */}
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-medium">Trading Volume</h3>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"  // Increased height
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis tickFormatter={(value) => (value / 1000).toFixed(0) + 'K'} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[180px]"
                    nameKey="volume"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    formatter={(value) => [value.toLocaleString(), "Volume"]}
                  />
                }
              />
              <Bar dataKey="volume" fill="hsl(var(--chart-5))" />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default StockChart;