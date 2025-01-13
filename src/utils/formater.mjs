export function formatCryptoData(cryptoData) {
    const cryptoName = Object.keys(cryptoData)[0];
    const price = cryptoData[cryptoName].usd;
    return `**${cryptoName.charAt(0).toUpperCase() + cryptoName.slice(1)} Price**: $${price.toFixed(2)} USD`;
}
