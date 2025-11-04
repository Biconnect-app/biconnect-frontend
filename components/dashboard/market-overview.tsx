import { TrendingUp, TrendingDown } from "lucide-react"

export function MarketOverview() {
  const marketData = [
    { symbol: "BTC", price: "$45,234.12", change: "+2.34%", positive: true },
    { symbol: "ETH", price: "$2,845.67", change: "+1.89%", positive: true },
    { symbol: "BNB", price: "$312.45", change: "-0.56%", positive: false },
    { symbol: "SOL", price: "$98.23", change: "+5.67%", positive: true },
    { symbol: "ADA", price: "$0.52", change: "+3.21%", positive: true },
    { symbol: "XRP", price: "$0.61", change: "-1.23%", positive: false },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Mercado en Vivo</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketData.map((coin) => (
          <div key={coin.symbol} className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-foreground">{coin.symbol}</span>
              <div className={`flex items-center gap-1 text-sm ${coin.positive ? "text-accent" : "text-destructive"}`}>
                {coin.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{coin.change}</span>
              </div>
            </div>
            <div className="text-xl font-semibold text-foreground">{coin.price}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground text-center">
          Gráfico de mercado placeholder - En producción, integrar con API de precios en tiempo real (CoinGecko,
          CoinMarketCap, etc.)
        </p>
      </div>
    </div>
  )
}
