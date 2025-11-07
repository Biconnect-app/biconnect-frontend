/**
 * Declaraciones de tipos para @binance/futures-connector
 */

declare module "@binance/futures-connector" {
  export interface UMFuturesOptions {
    baseURL?: string
    timeout?: number
    recvWindow?: number
    httpOptions?: any
  }

  export class UMFutures {
    constructor(apiKey: string, apiSecret: string, options?: UMFuturesOptions)

    newOrder(
      symbol: string,
      side: "BUY" | "SELL",
      type: string,
      options?: {
        quantity?: string
        quoteOrderQty?: string
        price?: string
        timeInForce?: string
        reduceOnly?: string
        [key: string]: any
      },
    ): Promise<{ data: any }>

    exchangeInfo(): Promise<{ data: any }>
    account(): Promise<{ data: any }>
    tickerPrice(symbol: string): Promise<{ data: any }>
    positionRisk(params?: { symbol?: string }): Promise<{ data: any }>
    changeLeverage(params: {
      symbol: string
      leverage: number
    }): Promise<{ data: any }>
  }
}
