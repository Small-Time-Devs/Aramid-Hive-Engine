import { config } from '../../config/config.mjs';
import {
    fetchTokenNameAndSymbol,
    checkTokenAuthority,
    fetchTokenPairs,
} from '../../utils/apiUtils.mjs';

export async function gatherAllTokenData(chain, contractAddress)  {

    // Step 1 - Gather The Token Name, Symbol, and Decimals
    const TokenBaseData = await fetchTokenNameAndSymbol(contractAddress);

    const TokenName = TokenBaseData.tokenName || "No Token Name Displayed From Raydium IDS";
    const TokenSymbol = TokenBaseData.tokenSymbol || "No Token Symbol Displayed From Raydium IDS";
    const TokenDecimals = TokenBaseData.decimals || "No Token Decimals Displayed From Raydium IDS";

    // Step 2 - Gather The Token Authority Data
    const TokenAuthorityData = await checkTokenAuthority(contractAddress);

    const isTokenSafe = TokenAuthorityData.safe;
    const hasFreeze = TokenAuthorityData.hasFreeze;
    const hasMint = TokenAuthorityData.hasMint;

    // Step 3 - Gather The Token Pair Data for Raydium
    const dexID = 'raydium';
    const quoteTokenSymbol = 'SOL';
    const RaydiumTokenPairData = await fetchTokenPairs(chain, dexID, quoteTokenSymbol, contractAddress);

    const RaydiumTokenPairDataTokenName = RaydiumTokenPairData.tokenName || "No Token Name Displayed From Dexscreener Pair Data";
    const RaydiumTokenPairDataTokenSymbol = RaydiumTokenPairData.tokenSymbol || "No Token Symbol Displayed From Dexscreener Pair Data";
    const TimeCreated = RaydiumTokenPairData.timeCreated || "No Time Created Displayed From Dexscreener Pair Data";

    const PriceNative = RaydiumTokenPairData.priceNative || "No Price Native Displayed From Dexscreener Pair Data";
    const PriceUSD = RaydiumTokenPairData.priceUsd || "No Price USD Displayed From Dexscreener Pair Data";

    const Transactions5m = RaydiumTokenPairData.txns5m || "No Transactions 5m Displayed From Dexscreener Pair Data";
    const Transactions1h = RaydiumTokenPairData.txns1h || "No Transactions 1h Displayed From Dexscreener Pair Data";
    const Transactions6h = RaydiumTokenPairData.txns6h || "No Transactions 6h Displayed From Dexscreener Pair Data";
    const Transactions24h = RaydiumTokenPairData.txns24h || "No Transactions 24h Displayed From Dexscreener Pair Data";

    const volume5m = RaydiumTokenPairData.volume5m || "No Volume 5m Displayed From Dexscreener Pair Data";
    const volume1h = RaydiumTokenPairData.volume1h || "No Volume 1h Displayed From Dexscreener Pair Data";
    const volume6h = RaydiumTokenPairData.volume6h || "No Volume 6h Displayed From Dexscreener Pair Data";
    const Volume24h = RaydiumTokenPairData.volume24h || "No Volume 24h Displayed From Dexscreener Pair Data";

    const PriceChange5m = RaydiumTokenPairData.priceChange5m || "No Price Change 5m Displayed From Dexscreener Pair Data";
    const PriceChange1h = RaydiumTokenPairData.priceChange1h || "No Price Change 1h Displayed From Dexscreener Pair Data";
    const PriceChange6h = RaydiumTokenPairData.priceChange6h || "No Price Change 6h Displayed From Dexscreener Pair Data";
    const PriceChange24h = RaydiumTokenPairData.priceChange24h || "No Price Change 24h Displayed From Dexscreener Pair Data";

    const LiquidityUSD = RaydiumTokenPairData.liquidityUsd || "No Liquidity USD Displayed From Dexscreener Pair Data";
    const LiquidityBase = RaydiumTokenPairData.liquidityBase || "No Liquidity Base Displayed From Dexscreener Pair Data";
    const LiquidityQuote = RaydiumTokenPairData.liquidityQuote || "No Liquidity Quote Displayed From Dexscreener Pair Data";

    const FDV = RaydiumTokenPairData.fdv || "No FDV Displayed From Dexscreener Pair Data";
    const MarketCap = RaydiumTokenPairData.marketCap || "No Market Cap Displayed From Dexscreener Pair Data";

    const Websites = RaydiumTokenPairData.info.websites ? 
        JSON.stringify(RaydiumTokenPairData.info.websites) : 
        "No Websites Displayed From Dexscreener Pair Data";
    
    const Socials = RaydiumTokenPairData.info.socials ? 
        JSON.stringify(RaydiumTokenPairData.info.socials) : 
        "No Socials Displayed From Dexscreener Pair Data";

    const ImageURL = RaydiumTokenPairData.info.imageUrl || "No Image URL Displayed From Dexscreener Pair Data";
    const Header = RaydiumTokenPairData.info.header || "No Header Displayed From Dexscreener Pair Data";
    const OpenGraph = RaydiumTokenPairData.info.openGraph || "No Open Graph Displayed From Dexscreener Pair Data";
    
    const TokenData = {
        BaseInfo: {
            TokenName,
            TokenSymbol,
            TokenDecimals,
        },

        AuthorityData: {
            isTokenSafe,
            hasFreeze,
            hasMint,
        },

        PairData: {
            RaydiumTokenPairDataTokenName,
            RaydiumTokenPairDataTokenSymbol,
            TimeCreated,

            PriceNative,
            PriceUSD,

            Transactions5m,
            Transactions1h,
            Transactions6h,
            Transactions24h,

            volume5m,
            volume1h,
            volume6h,
            Volume24h,

            PriceChange5m,
            PriceChange1h,
            PriceChange6h,
            PriceChange24h,

            LiquidityUSD,
            LiquidityBase,
            LiquidityQuote,

            FDV,
            MarketCap,
            
            Websites,
            Socials,
            ImageURL,
            Header,
            OpenGraph,
        },
    }

    return TokenData;
}