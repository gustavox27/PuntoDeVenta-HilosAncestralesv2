interface CachedFinancialData {
  data: Record<string, { saldoDisponible: number; deudaPendiente: number }>;
  timestamp: number;
  ttl: number;
}

class FinancialCacheService {
  private cache: CachedFinancialData | null = null;
  private readonly DEFAULT_TTL = 45000;

  isValid(): boolean {
    if (!this.cache) return false;
    const now = Date.now();
    return now - this.cache.timestamp < this.cache.ttl;
  }

  get(): Record<string, { saldoDisponible: number; deudaPendiente: number }> | null {
    return this.isValid() ? this.cache?.data || null : null;
  }

  set(data: Record<string, { saldoDisponible: number; deudaPendiente: number }>): void {
    this.cache = {
      data,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL
    };
  }

  invalidate(): void {
    this.cache = null;
  }

  getRemainingTime(): number {
    if (!this.cache) return 0;
    const elapsed = Date.now() - this.cache.timestamp;
    return Math.max(0, this.cache.ttl - elapsed);
  }
}

export const financialCacheService = new FinancialCacheService();
