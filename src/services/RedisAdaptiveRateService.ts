import { AdaptiveRateService } from '../types/adaptiveRateService.js';
import { getRedisClient } from '../redisClient.js';

const DEFAULT_DELAY = 300; // ms
const MIN_DELAY = 100;     // ms
const MAX_DELAY = 5000;    // ms

interface DomainCache {
    [domain: string]: { delay: number; count: number; timestamp: number };
}

export class RedisAdaptiveRateService implements AdaptiveRateService {
    private domainCaches: DomainCache = {};

    private getDomainRetryKey(domain: string): string {
        return `adaptive_retry_delay_ms:${domain}`;
    }

    private getDomainCountKey(domain: string): string {
        return `adaptive_retry_count:${domain}`;
    }

    private getCircuitKey(domain: string): string {
        return `circuit_breaker:${domain}`;
    }

    private getFailureKey(domain: string): string {
        return `consecutive_failures:${domain}`;
    }

    private redis() {
        return getRedisClient();
    }

    private getCachedValues(domain: string) {
        const now = Date.now();
        if (!this.domainCaches[domain] || now - this.domainCaches[domain].timestamp >= 1000) {
            this.domainCaches[domain] = {
                delay: DEFAULT_DELAY,
                count: 1,
                timestamp: 0
            };
        }
        return this.domainCaches[domain];
    }

    async getDelay(domain: string): Promise<number> {
        const cache = this.getCachedValues(domain);
        if (Date.now() - cache.timestamp < 1000) {
            return cache.delay;
        }

        const val = await this.redis().get(this.getDomainRetryKey(domain));
        return val ? Number(val) : DEFAULT_DELAY;
    }

    async increaseDelay(domain: string, factor: number): Promise<void> {
        let delay = await this.getDelay(domain);
        delay = Math.min(MAX_DELAY, delay * factor);
        await this.redis().set(this.getDomainRetryKey(domain), Math.round(delay).toString());

        const cache = this.getCachedValues(domain);
        cache.delay = delay;
        cache.timestamp = Date.now();
    }

    async decreaseDelay(domain: string): Promise<void> {
        const [delayVal, countVal] = await this.redis().mGet([
            this.getDomainRetryKey(domain),
            this.getDomainCountKey(domain)
        ]);

        let delay = delayVal ? Number(delayVal) : DEFAULT_DELAY;
        let count = countVal ? Number(countVal) : 1;

        const step = Math.max(1, 1000 / Math.sqrt(count));
        delay = Math.max(MIN_DELAY, delay - step);
        count = count + 1;

        if (count > 10000) count = 1000;

        await this.redis().mSet({
            [this.getDomainRetryKey(domain)]: Math.round(delay).toString(),
            [this.getDomainCountKey(domain)]: count.toString()
        });

        const cache = this.getCachedValues(domain);
        cache.delay = delay;
        cache.count = count;
        cache.timestamp = Date.now();
    }

    async isCircuitOpen(domain: string): Promise<boolean> {
        const status = await this.redis().get(this.getCircuitKey(domain));
        return status === 'open';
    }

    async openCircuit(domain: string, seconds: number): Promise<void> {
        await this.redis().set(this.getCircuitKey(domain), 'open', { EX: seconds });
    }

    async resetCircuit(domain: string): Promise<void> {
        await this.redis().del(this.getCircuitKey(domain));
    }

    async getFailureCount(domain: string): Promise<number> {
        const failures = await this.redis().get(this.getFailureKey(domain));
        return failures ? Number(failures) : 0;
    }

    async incrementFailureCount(domain: string): Promise<number> {
        const failures = await this.getFailureCount(domain);
        const newCount = failures + 1;
        await this.redis().set(this.getFailureKey(domain), newCount.toString());
        return newCount;
    }

    async resetFailureCount(domain: string): Promise<void> {
        await this.redis().set(this.getFailureKey(domain), '0');
    }
}

export const rateService = new RedisAdaptiveRateService();