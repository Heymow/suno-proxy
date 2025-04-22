import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logApiCall } from '../monitoring/apiMonitor.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithRetry<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
    maxRetries = 3
): Promise<AxiosResponse<T>> {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await axios.get<T>(url, { timeout: 15000, ...config });
            logApiCall(url, response.status);
            return response;
        } catch (error: any) {
            attempt++;

            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 500;
                const message = error.message;

                logApiCall(url, status, message);

                if (status === 429) {
                    const retryAfter = parseInt(error.response?.headers['retry-after']) || 60;
                    console.warn(`Rate limit reached. Retrying after ${retryAfter}s...`);
                    await sleep(retryAfter * 1000);
                } else if (error.code === 'ETIMEDOUT') {
                    console.warn(`Timeout on attempt ${attempt} for ${url}`);
                    await sleep(3000);
                } else {
                    throw error;
                }
            } else {
                logApiCall(url, 500, 'Non-Axios error');
                throw error;
            }
        }
    }

    logApiCall(url, 500, `Failed after ${maxRetries} retries`);
    throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}
