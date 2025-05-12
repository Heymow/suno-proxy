export interface AdaptiveRateService {
    // Adaptive delay
    getDelay(domain: string): Promise<number>;
    increaseDelay(domain: string, factor: number): Promise<void>;
    decreaseDelay(domain: string): Promise<void>;

    // Circuit breaker
    isCircuitOpen(domain: string): Promise<boolean>;
    openCircuit(domain: string, seconds: number): Promise<void>;
    resetCircuit(domain: string): Promise<void>;

    // Consecutive failures
    getFailureCount(domain: string): Promise<number>;
    incrementFailureCount(domain: string): Promise<number>;
    resetFailureCount(domain: string): Promise<void>;
}