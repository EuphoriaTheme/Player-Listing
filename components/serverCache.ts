const serverCache = new Map<string, { value?: any; expiresAt: number; inFlight?: Promise<any> }>();

export const getCachedServer = async <T>(key: string, fetcher: () => Promise<T>, ttlMs = 60_000): Promise<T> => {
    const now = Date.now();
    const existing = serverCache.get(key);

    if (existing?.value && existing.expiresAt > now) {
        return existing.value as T;
    }

    if (existing?.inFlight) {
        return existing.inFlight as Promise<T>;
    }

    const inFlight = (async () => {
        const value = await fetcher();
        serverCache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
        return value;
    })();

    serverCache.set(key, {
        value: existing?.value,
        expiresAt: existing?.expiresAt ?? 0,
        inFlight,
    });

    try {
        return await inFlight;
    } finally {
        const latest = serverCache.get(key);
        if (latest?.inFlight === inFlight) {
            serverCache.set(key, {
                value: latest.value,
                expiresAt: latest.expiresAt,
            });
        }
    }
};
