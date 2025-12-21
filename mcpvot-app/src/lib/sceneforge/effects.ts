export type SeededRandom = () => number;

export function createSeededRandom(seed: number): SeededRandom {
    let state = seed % 2147483647;
    if (state <= 0) {
        state += 2147483646;
    }

    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
}

export function choose<T>(rand: SeededRandom, items: T[]): T {
    return items[Math.floor(rand() * items.length) % items.length];
}

export function rangeDistribution(rand: SeededRandom, count: number, min = 0.2, max = 1): number[] {
    const span = max - min;
    return Array.from({ length: count }, () => min + rand() * span);
}

export function jitter(value: number, amount: number, rand: SeededRandom) {
    return value + (rand() - 0.5) * amount * 2;
}
