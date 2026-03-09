import Bottleneck from "bottleneck";

export class KeyLimiterService {
  private readonly limiters = new Map<string, Bottleneck>();

  async schedule<T>(
    apiKeyId: string,
    requestsPerSecond: number,
    task: () => Promise<T>,
  ): Promise<T> {
    const limiter = this.getLimiter(apiKeyId, requestsPerSecond);
    return limiter.schedule(task);
  }

  private getLimiter(apiKeyId: string, requestsPerSecond: number): Bottleneck {
    const existing = this.limiters.get(apiKeyId);
    if (existing) {
      return existing;
    }

    const limiter = new Bottleneck({
      maxConcurrent: 1,
      reservoir: requestsPerSecond,
      reservoirRefreshAmount: requestsPerSecond,
      reservoirRefreshInterval: 1000,
      minTime: Math.ceil(1000 / requestsPerSecond),
    });

    this.limiters.set(apiKeyId, limiter);
    return limiter;
  }
}
