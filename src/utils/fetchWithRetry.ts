import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logApiCall } from '../monitoring/apiMonitor.js';
import { getRedisClient } from '../redisClient.js';

function redis() {
    return getRedisClient();
}

const RETRY_KEY = 'adaptive_retry_delay_ms';
const COUNT_KEY = 'adaptive_retry_count';
const DEFAULT_DELAY = 300; // ms
const MIN_DELAY = 100;     // ms
const MAX_DELAY = 5000;    // ms

async function getAdaptiveDelay() {
    const val = await redis().get(RETRY_KEY);
    return val ? Number(val) : DEFAULT_DELAY;
}

async function setAdaptiveDelay(delay: number) {
    await redis().set(RETRY_KEY, Math.round(delay));
}

async function getRetryCount() {
    const val = await redis().get(COUNT_KEY);
    return val ? Number(val) : 1;
}

async function setRetryCount(count: number) {
    await redis().set(COUNT_KEY, count);
}

function randomize(base: number, spread: number) {
    return base + Math.floor(Math.random() * spread);
}

export async function fetchWithRetry<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
    maxRetries = 3,
    timeout = 10000
): Promise<AxiosResponse<T>> {
    let attempt = 0;

    let delay = await getAdaptiveDelay();
    let count = await getRetryCount();

    while (attempt < maxRetries) {
        try {
            const response = await axios.request<T>({
                url,
                timeout: timeout,
                ...config,
            });
            logApiCall(url, response.status);

            const step = Math.max(10, 1000 / Math.sqrt(count));
            delay = Math.max(MIN_DELAY, delay - step);
            await setAdaptiveDelay(delay);
            await setRetryCount(count + 1);

            return response;
        } catch (error: any) {
            attempt++;

            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 500;
                const message = error.message;

                logApiCall(url, status, message);

                if (status === 429) {
                    const step = Math.max(50, 2000 / Math.sqrt(count));
                    delay = Math.min(MAX_DELAY, delay + step);
                    await setAdaptiveDelay(delay);
                    await setRetryCount(count + 1);

                    const delayMs = randomize(delay, 200);
                    console.warn(`Rate limit reached. Retrying after ${delayMs}ms (adaptive)...`);
                    await new Promise(res => setTimeout(res, delayMs));
                } else if (error.code === 'ETIMEDOUT') {
                    const delayMs = randomize(1000, 1000);
                    console.warn(`Timeout on attempt ${attempt} for ${url}, retrying after ${delayMs}ms...`);
                    await new Promise(res => setTimeout(res, delayMs));
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
