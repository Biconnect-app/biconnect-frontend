/**
 * Declaraciones de tipos para @binance/connector
 */

declare module "@binance/connector" {
  export interface SpotOptions {
    baseURL?: string
    timeout?: number
    recvWindow?: number
    httpOptions?: any
  }

  export class Spot {
    constructor(apiKey: string, apiSecret: string, options?: SpotOptions)

    newOrder(
      symbol: string,
      side: "BUY" | "SELL",
      type: string,
      options?: {
        quantity?: string
        quoteOrderQty?: string
        price?: string
        timeInForce?: string
        [key: string]: any
      },
    ): Promise<{ data: any }>

    exchangeInfo(): Promise<{ data: any }>
    account(): Promise<{ data: any }>
    tickerPrice(symbol: string): Promise<{ data: any }>
    getSymbolTicker(symbol: string): Promise<{ data: any }>
  }
}
