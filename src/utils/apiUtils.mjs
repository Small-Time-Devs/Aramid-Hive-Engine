import axios from 'axios';
import { config } from '../config/config.mjs';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

export async function fetchCryptoData(cryptoName) {
    try {
        const response = await axios.get(`${config.apis.crypto.coinGecko}${cryptoName}`);
        if (!response.data[cryptoName]) {
            throw new Error(`No data found for ${cryptoName}`);
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        throw new Error(`Failed to fetch data for ${cryptoName}.`);
    }
}

export async function fetchWeatherData() {
    try {
        const response = await axios.get(config.apis.weather.openWeatherMap);
        return response.data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw new Error('Failed to fetch weather data.');
    }
}

export async function fetchCryptoMarketData() {
    try {
        const response = await axios.get(`${config.apis.crypto.coinGecko}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 10,
                page: 1,
                sparkline: false,
            },
        });

        if (response.data && response.data.length > 0) {
            return response.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching crypto market data:', error);
        return [];
    }
}

export async function fetchLatestTokenProfiles() {
  try {
    const response = await axios.get(config.apis.crypto.dexscreenerTokneProfilesUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest token profiles:', error);
    throw new Error('Failed to fetch latest token profiles.');
  }
}

export async function fetchLatestBoostedTokens() {
  try {
    const response = await axios.get(config.apis.crypto.dexscreenerTopBoostedUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest boosted tokens:', error);
    throw new Error('Failed to fetch latest boosted tokens.');
  }
}

export async function fetchMostActiveBoostedTokens() {
  try {
    const response = await axios.get(config.apis.crypto.dexscreenerTopBoostedUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest boosted tokens:', error);
    throw new Error('Failed to fetch latest boosted tokens.');
  }
}

// Base Solana Token Data Fetching

// Step 1 - Fetch Token Name and Symbol
export async function fetchTokenNameAndSymbol(contractAddress) {
  try {
    const response = await axios.get(`${config.apis.crypto.jupTokenLookup}${contractAddress}`);
    if (response.data) {
      return {
        tokenName: response.data.name,
        tokenSymbol: response.data.symbol,
        decimals: response.data.decimals,
      };
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error(`Error fetching token name for contract address ${contractAddress}:`, error);
    throw error; // Re-throw the error to handle it in the calling function
  }
}

// Step 2 - Fetch Token Authority Info
export async function checkTokenAuthority(mintAddress) {
  try {
    const connection = new Connection(config.solanaConstants.mainnet.rpcNode, 'confirmed');
    const mintPublicKey = new PublicKey(mintAddress);
    
    const mintInfo = await getMint(connection, mintPublicKey);
    
    const hasFreeze = mintInfo.freezeAuthority !== null;
    const hasMint = mintInfo.mintAuthority !== null;
    
    return {
      safe: !hasFreeze && !hasMint,
      hasFreeze,
      hasMint,
    };
  } catch (error) {
    console.error('Error checking token authority:', error);
    throw error;
  }
}

// Step 3 - Fetch Token Pair Data
export async function fetchTokenPairs(chainId, quoteTokenSymbol, tokenAddress) {
  try {
    const response = await axios.get(`https://api.dexscreener.com/token-pairs/v1/${chainId}/${tokenAddress}`);
    
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error("No pairs found in response");
    }

    // Filter pairs by quote token symbol first
    const pairsWithMatchingQuote = response.data.filter(
      pair => pair.quoteToken.symbol === quoteTokenSymbol
    );

    if (pairsWithMatchingQuote.length === 0) {
      throw new Error(`No pairs found with quote token symbol ${quoteTokenSymbol}`);
    }

    // First try to find a Raydium pair
    let selectedPair = pairsWithMatchingQuote.find(
      pair => pair.dexId.toLowerCase() === 'raydium'
    );

    // If no Raydium pair exists, try popular DEXes in order of preference
    if (!selectedPair) {
      const preferredDexes = ['pumpfun', 'moonshot', 'meteora', 'orca'];
      for (const dex of preferredDexes) {
        selectedPair = pairsWithMatchingQuote.find(
          pair => pair.dexId.toLowerCase() === dex
        );
        if (selectedPair) break;
      }
    }

    // If still no pair found, use the first available pair
    if (!selectedPair) {
      selectedPair = pairsWithMatchingQuote[0];
      console.log(`Using ${selectedPair.dexId} pair as no preferred DEX pairs found`);
    }

    const result = {
      dexId: selectedPair.dexId,
      tokenName: selectedPair.baseToken?.name || 'Token name not available',
      tokenSymbol: selectedPair.baseToken?.symbol || 'Token symbol not available',
      timeCreated: selectedPair?.pairCreatedAt || 'PumpFun does not provide creation time',

      priceNative: selectedPair?.priceNative || 'Native price not showing',
      priceUsd: selectedPair?.priceUsd || 'USD Price not showing',

      txns5m: selectedPair.txns?.m5 || 'PumpFun does not have 5m txn info',
      txns1h: selectedPair.txns?.h1 || 'PumpFun does not have 1h txn info',
      txns6h: selectedPair.txns?.h6 || 'PumpFun does not have 6h txn info',
      txns24h: selectedPair.txns?.h24 || 'PumpFun does not have 24h txn info',

      volume5m: selectedPair.volume?.m5 || 'PumpFun does not have 5m volume info',
      volume1h: selectedPair.volume?.h1 || 'PumpFun does not have 1h volume info',
      volume6h: selectedPair.volume?.h6 || 'PumpFun does not have 6h volume info',
      volume24h: selectedPair.volume?.h24 || 'PumpFun does not have 24h volume info',

      priceChange5m: selectedPair.priceChange?.m5 || 'PumpFun does not have 5m price change info',
      priceChange1h: selectedPair.priceChange?.h1 || 'PumpFun does not have 1h price change info',
      priceChange6h: selectedPair.priceChange?.h6 || 'PumpFun does not have 6h price change info',
      priceChange24h: selectedPair.priceChange?.h24 || 'PumpFun does not have 24h price change info',

      liquidityUsd: selectedPair.liquidity?.usd || 'PumpFun does not provide liquidity info',
      liquidityBase: selectedPair.liquidity?.base || 'PumpFun does not provide base liquidity info',
      liquidityQuote: selectedPair.liquidity?.quote || 'PumpFun does not provide quote liquidity info',

      fdv: selectedPair?.fdv || 'PumpFun does not provide FDV info',
      marketCap: selectedPair?.marketCap || 'PumpFun does not provide market cap info',

      info: {
        websites: selectedPair.info?.websites || 'PumpFun does not provide website info',
        socials: selectedPair.info?.socials || 'PumpFun does not provide social media info',
        imageUrl: selectedPair.info?.imageUrl || 'PumpFun does not provide image URL',
        header: selectedPair.info?.header || 'PumpFun does not provide header info',
        openGraph: selectedPair.info?.openGraph || 'PumpFun does not provide OpenGraph info'
      }
    };

    return result;
  } catch (error) {
    console.error(`Error fetching token pairs for ${tokenAddress} on ${chainId}:`, error);
    throw new Error(`Failed to fetch token pairs for ${tokenAddress} on ${chainId}.`);
  }
}

// Not used currently 
export async function fetchTokenPrice(contractAddress) {
  try {
      const response = await axios.get(`${config.apis.crypto.raydiumMintPrice}${contractAddress}`);
      if (response.data && response.data.success && response.data.data[contractAddress]) {
          return response.data.data[contractAddress];
      }
  } catch (error) {
      console.error(`Error fetching token price for contract address ${contractAddress}`);
  }
}

export async function fetchPoolInfo(contractAddress) {
  try {
    const mint1 = 'So11111111111111111111111111111111111111112'; // Default SOL mint address
    const url = `${globalURLS.raydiumMintAPI}?mint1=${mint1}&mint2=${contractAddress}&poolType=standard&poolSortField=default&sortType=desc&pageSize=1&page=1`;

    console.log(`Fetching token details from: ${url}`);

    const response = await axios.get(url);
    if (config.twitter.settings.devMode) {
      console.log('Full response from Raydium API:', JSON.stringify(response.data, null, 2));
    }

    if (response.status === 200 && response.data?.data?.data?.length > 0) {
      return response.data.data.data[0]; // Adjusted to match nested data structure
    }

    console.error(`Token details not found for mint address: ${contractAddress}`);
    return null;
  } catch (error) {
    console.error(`Error fetching token details for ${contractAddress}:`, error.message);
    return null;
  }
}

export async function fetchMeteoraPoolInfo() {
  try {
    const response = await axios.get('https://dlmm-api.meteora.ag/pair/all_with_pagination?limit=10000&order_by=desc&hide_low_tvl=30000');
    
    if (!response.data || !response.data.pairs) {
      throw new Error('Invalid response from Meteora API');
    }

    return response.data.pairs.map(pair => ({
      poolAddress: pair.address,
      poolName: pair.name,
      tokenXMint: pair.mint_x,
      tokenYMint: pair.mint_y,
      tokenXReserveAddress: pair.reserve_x,
      tokenYReserveAddress: pair.reserve_y,
      tokenXReserveAmount: pair.reserve_x_amount,
      tokenYReserveAmount: pair.reserve_y_amount,
      binStep: pair.bin_step,
      baseFeePercent: pair.base_fee_percentage,
      maxFeePercent: pair.max_fee_percentage,
      protocolFeePercent: pair.protocol_fee_percentage,
      liquidity: pair.liquidity,
      rewardTokenXMint: pair.reward_mint_x,
      rewardTokenYMint: pair.reward_mint_y,
      fees24h: pair.fees_24h,
      todayFees: pair.today_fees,
      volume24h: pair.trade_volume_24h, 
      cumulativeVolume: pair.cumulative_trade_volume,
      cumulativeFees: pair.cumulative_fee_volume,
      currentPrice: pair.current_price,
      apr: pair.apr,
      apy: pair.apy,
      farmApr: pair.farm_apr,
      farmApy: pair.farm_apy,
      isHidden: pair.hide,
      // Add these additional fields
      rewardTokenXPriceInSOL: pair.reward_x_price,
      rewardTokenYPriceInSOL: pair.reward_y_price,
      rewardTokenXPriceInUSD: pair.reward_x_price_usd,
      rewardTokenYPriceInUSD: pair.reward_y_price_usd,
      totalTradingFeesUSD: pair.total_trading_fees_usd,
      pairCreatedAt: pair.created_at,
      updatedAt: pair.updated_at,
      // Return the original API fields as well
      raw: pair
    }));

  } catch (error) {
    console.error('Error fetching Meteora pool info:', error);
    throw new Error('Failed to fetch Meteora pool information');
  }
}

export async function fetchRugcheckSummary(tokenAddress) {
  try {
    const response = await axios.get(`${config.apis.crypto.rugcheckApi}${tokenAddress}/report/summary`);
    if (response.data) {
      return {
        tokenProgram: response.data.tokenProgram,
        tokenType: response.data.tokenType,
        risks: response.data.risks,
        score: response.data.score
      };
    }
    throw new Error('Invalid response format from rugcheck API');
  } catch (error) {
    console.error(`Error fetching rugcheck summary for ${tokenAddress}:`, error);
    return {
      tokenProgram: '',
      tokenType: '',
      risks: [],
      score: 0
    };
  }
}