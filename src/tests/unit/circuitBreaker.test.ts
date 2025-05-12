import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

vi.mock('../../services/RedisAdaptiveRateService.js', () => ({
    rateService: {
        isCircuitOpen: vi.fn().mockResolvedValue(false),
        getFailureCount: vi.fn().mockResolvedValue(0),
        incrementFailureCount: vi.fn().mockResolvedValue(1),
        openCircuit: vi.fn().mockResolvedValue(undefined),
        resetFailureCount: vi.fn().mockResolvedValue(undefined),
        resetCircuit: vi.fn().mockResolvedValue(undefined),
        decreaseDelay: vi.fn().mockResolvedValue(undefined),
        increaseDelay: vi.fn().mockResolvedValue(undefined),
        getDelay: vi.fn().mockResolvedValue(0)
    }
}));

import { rateService } from '../../services/RedisAdaptiveRateService.js';

describe('Circuit Breaker Direct Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should open circuit breaker when failure count exceeds threshold', async () => {
        (rateService.getFailureCount as Mock).mockResolvedValueOnce(4);

        async function checkCircuitBreakerState(domain: string) {
            const isOpen = await rateService.isCircuitOpen(domain);
            if (isOpen) {
                throw new Error(`Circuit breaker open for ${domain}`);
            }

            const failures = await rateService.getFailureCount(domain);
            if (failures >= 3) {
                await rateService.openCircuit(domain, 60);
                throw new Error(`Circuit breaker open for ${domain}`);
            }
        }

        try {
            await checkCircuitBreakerState('api.example.com');
            expect.fail('Should have thrown circuit breaker open error');
        } catch (error: any) {
            expect(error.message).toContain('Circuit breaker open');
            expect(rateService.openCircuit).toHaveBeenCalledWith('api.example.com', 60);
        }
    });

    it('should detect already open circuit breaker', async () => {
        (rateService.isCircuitOpen as Mock).mockResolvedValue(true);

        async function checkCircuitBreakerState(domain: string) {
            const isOpen = await rateService.isCircuitOpen(domain);
            if (isOpen) {
                throw new Error(`Circuit breaker open for ${domain}`);
            }
            return false;
        }

        try {
            await checkCircuitBreakerState('api.example.com');
            expect.fail('Should have thrown circuit breaker open error');
        } catch (error: any) {
            expect(error.message).toContain('Circuit breaker open');
            expect(rateService.openCircuit).not.toHaveBeenCalled();
        }
    });

    it('should reset circuit breaker after successful request', async () => {
        async function handleSuccessfulRequest(domain: string) {
            await rateService.resetFailureCount(domain);
            await rateService.decreaseDelay(domain);
            return true;
        }

        const result = await handleSuccessfulRequest('api.example.com');
        expect(result).toBe(true);
        expect(rateService.resetFailureCount).toHaveBeenCalledWith('api.example.com');
        expect(rateService.decreaseDelay).toHaveBeenCalledWith('api.example.com');
    });

    it('should increment failure count after error', async () => {
        (rateService.incrementFailureCount as Mock).mockResolvedValue(2);

        async function handleRequestError(domain: string) {
            const failures = await rateService.incrementFailureCount(domain);
            return failures;
        }

        const failures = await handleRequestError('api.example.com');
        expect(failures).toBe(2);
        expect(rateService.incrementFailureCount).toHaveBeenCalledWith('api.example.com');
    });
});