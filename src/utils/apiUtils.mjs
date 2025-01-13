import axios from 'axios';
import { config } from '../config/config.mjs';

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
