import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWithRetry<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
    maxRetries = 3
): Promise<AxiosResponse<T>> {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            return await axios.get<T>(url, { timeout: 15000, ...config });
        } catch (error: any) {
            attempt++;

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
                    console.warn(`Rate limit reached. Retrying after ${retryAfter}s...`);
                    await sleep(retryAfter * 1000);
                } else if (error.code === 'ETIMEDOUT') {
                    console.warn(`Timeout on attempt ${attempt} for ${url}`);
                    await sleep(3000);
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }

    throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}
