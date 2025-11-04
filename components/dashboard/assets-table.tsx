import { TrendingUp, TrendingDown } from "lucide-react"

export function AssetsTable() {
  const assets = [
    { symbol: "BTC", name: "Bitcoin", amount: "0.2845", value: "$12,845.32", change: "+5.24%", positive: true },
    { symbol: "ETH", name: "Ethereum", amount: "3.5421", value: "$8,234.12", change: "+3.12%", positive: true },
    { symbol: "USDT", name: "Tether", amount: "5000.00", value: "$5,000.00", change: "0.00%", positive: true },
    { symbol: "BNB", name: "Binance Coin", amount: "12.4532", value: "$3,456.78", change: "-1.45%", positive: false },
    { symbol: "SOL", name: "Solana", amount: "45.2341", value: "$2,123.45", change: "+8.92%", positive: true },
  ]

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground">Mis Activos</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Activo</th>
              <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Cantidad</th>
              <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Valor</th>
              <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Cambio 24h</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assets.map((asset) => (
              <tr key={asset.symbol} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary">{asset.symbol[0]}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right text-foreground">{asset.amount}</td>
                <td className="p-4 text-right font-semibold text-foreground">{asset.value}</td>
                <td className="p-4 text-right">
                  <div
                    className={`flex items-center justify-end gap-1 ${asset.positive ? "text-accent" : "text-destructive"}`}
                  >
                    {asset.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-medium">{asset.change}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
