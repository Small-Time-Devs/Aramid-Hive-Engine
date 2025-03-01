import { config } from '../config/config.mjs';
import {
    fetchTokenNameAndSymbol,
    checkTokenAuthority,
    fetchTokenPairs,
    fetchRugcheckSummary,
} from './apiUtils.mjs';

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

    // Step 3 - Gather The Token Pair Data from the different dexIds
    const quoteTokenSymbol = 'SOL';
    const TokenPairData = await fetchTokenPairs(chain, quoteTokenSymbol, contractAddress);

    const RaydiumTokenPairDataTokenName = TokenPairData.tokenName || "No Token Name Displayed From Dexscreener Pair Data";
    const RaydiumTokenPairDataTokenSymbol = TokenPairData.tokenSymbol || "No Token Symbol Displayed From Dexscreener Pair Data";
    const TimeCreated = TokenPairData.timeCreated || "No Time Created Displayed From Dexscreener Pair Data";

    const PriceNative = TokenPairData.priceNative || "No Price Native Displayed From Dexscreener Pair Data";
    const PriceUSD = TokenPairData.priceUsd || "No Price USD Displayed From Dexscreener Pair Data";

    const Transactions5m = TokenPairData.txns5m || "No Transactions 5m Displayed From Dexscreener Pair Data";
    const Transactions1h = TokenPairData.txns1h || "No Transactions 1h Displayed From Dexscreener Pair Data";
    const Transactions6h = TokenPairData.txns6h || "No Transactions 6h Displayed From Dexscreener Pair Data";
    const Transactions24h = TokenPairData.txns24h || "No Transactions 24h Displayed From Dexscreener Pair Data";

    const volume5m = TokenPairData.volume5m || "No Volume 5m Displayed From Dexscreener Pair Data";
    const volume1h = TokenPairData.volume1h || "No Volume 1h Displayed From Dexscreener Pair Data";
    const volume6h = TokenPairData.volume6h || "No Volume 6h Displayed From Dexscreener Pair Data";
    const Volume24h = TokenPairData.volume24h || "No Volume 24h Displayed From Dexscreener Pair Data";

    const PriceChange5m = TokenPairData.priceChange5m || "No Price Change 5m Displayed From Dexscreener Pair Data";
    const PriceChange1h = TokenPairData.priceChange1h || "No Price Change 1h Displayed From Dexscreener Pair Data";
    const PriceChange6h = TokenPairData.priceChange6h || "No Price Change 6h Displayed From Dexscreener Pair Data";
    const PriceChange24h = TokenPairData.priceChange24h || "No Price Change 24h Displayed From Dexscreener Pair Data";

    const LiquidityUSD = TokenPairData.liquidityUsd || "No Liquidity USD Displayed From Dexscreener Pair Data";
    const LiquidityBase = TokenPairData.liquidityBase || "No Liquidity Base Displayed From Dexscreener Pair Data";
    const LiquidityQuote = TokenPairData.liquidityQuote || "No Liquidity Quote Displayed From Dexscreener Pair Data";

    const FDV = TokenPairData.fdv || "No FDV Displayed From Dexscreener Pair Data";
    const MarketCap = TokenPairData.marketCap || "No Market Cap Displayed From Dexscreener Pair Data";

    const Websites = TokenPairData.info.websites ? 
        JSON.stringify(TokenPairData.info.websites) : 
        "No Websites Displayed From Dexscreener Pair Data";
    
    const Socials = TokenPairData.info.socials ? 
        JSON.stringify(TokenPairData.info.socials) : 
        "No Socials Displayed From Dexscreener Pair Data";

    const ImageURL = TokenPairData.info.imageUrl || "No Image URL Displayed From Dexscreener Pair Data";
    const Header = TokenPairData.info.header || "No Header Displayed From Dexscreener Pair Data";
    const OpenGraph = TokenPairData.info.openGraph || "No Open Graph Displayed From Dexscreener Pair Data";
    
    // Add Rugcheck Summary Data
    const rugcheckData = await fetchRugcheckSummary(contractAddress);
    
    // Process rugcheck risks into separate fields
    const rugcheckRisks = rugcheckData.risks || [];
    const processedRisks = {};
    
    rugcheckRisks.forEach((risk, index) => {
        const riskPrefix = `risk${index + 1}`;
        processedRisks[`${riskPrefix}Name`] = risk.name || '';
        processedRisks[`${riskPrefix}Value`] = risk.value || '';
        processedRisks[`${riskPrefix}Description`] = risk.description || '';
        processedRisks[`${riskPrefix}Score`] = risk.score || 0;
        processedRisks[`${riskPrefix}Level`] = risk.level || '';
    });

    const TokenData = {

        TokenName,
        TokenSymbol,
        TokenDecimals,

        isTokenSafe,
        hasFreeze,
        hasMint,
        
        // Add processed rugcheck risks
        rugcheckTotalRisks: rugcheckRisks.length,
        ...processedRisks,

        // Original rugcheck data as JSON string for backwards compatibility
        rugCheckRisks: JSON.stringify(rugcheckRisks),

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


    }

    return TokenData;
}