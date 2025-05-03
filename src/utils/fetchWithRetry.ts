import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logApiCall } from '../monitoring/apiMonitor.js';

const API_RETRY_COUNT = Number(process.env.API_RETRY_COUNT) || 3;
const API_RETRY_DELAY = Number(process.env.API_RETRY_DELAY_SECONDS) || 5;
const API_TIMEOUT = Number(process.env.API_TIMEOUT_SECONDS) * 1000 || 10000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithRetry<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
    maxRetries = API_RETRY_COUNT,
    retryDelay = API_RETRY_DELAY,
    timeout = API_TIMEOUT
): Promise<AxiosResponse<T>> {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await axios.request<T>({
                url,
                timeout: timeout,
                ...config,
            });
            logApiCall(url, response.status);
            return response;
        } catch (error: any) {
            attempt++;

            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 500;
                const message = error.message;

                logApiCall(url, status, message);

                if (status === 429) {
                    const retryAfter = parseInt(error.response?.headers['retry-after']) || retryDelay;
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
