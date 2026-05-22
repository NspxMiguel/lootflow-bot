// ─── Steam Market Price Fetch ─────────────────────────────────────────────────

const STEAM_SEARCH_URL = 'https://steamcommunity.com/market/search/render/'

export interface SteamSearchResult {
  name: string
  hashName: string
  price: number | null  // BRL, parsed from sell_price_text
}

/**
 * Search Steam Market for an item by name, return top match with price in BRL.
 * Uses appid=730 (CS2) and currency=7 (BRL).
 */
export async function fetchSteamPrice(query: string): Promise<SteamSearchResult | null> {
  const url = new URL(STEAM_SEARCH_URL)
  url.searchParams.set('query', query)
  url.searchParams.set('appid', '730')
  url.searchParams.set('currency', '7')   // BRL
  url.searchParams.set('count', '3')
  url.searchParams.set('norender', '1')

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LootFlow-Bot/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.warn(`[Steam] HTTP ${res.status} for query "${query}"`)
      return null
    }

    const json = await res.json() as {
      success: boolean
      results?: Array<{
        name: string
        hash_name: string
        sell_price: number        // in cents (e.g. 1550 = R$ 15.50)
        sell_price_text: string   // e.g. "R$ 15,50"
        asset_description?: { type?: string }
      }>
    }

    if (!json.success || !json.results?.length) return null

    const top = json.results[0]
    // sell_price is in cents
    const price = top.sell_price > 0 ? top.sell_price / 100 : null

    return {
      name: top.name,
      hashName: top.hash_name,
      price,
    }
  } catch (e) {
    console.error(`[Steam] Erro ao buscar "${query}":`, e)
    return null
  }
}
