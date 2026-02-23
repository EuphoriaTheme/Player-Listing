type PostRconJsonOptions = {
    endpoint: string;
    csrfToken?: string | null;
    payload: unknown;
    defaultErrorMessage: string;
};

const extractHtmlTitle = (raw: string): string | null => {
    const titleMatch = raw.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch?.[1]?.trim();
    return title && title.length > 0 ? title : null;
};

export const postRconJson = async <T = any>({ endpoint, csrfToken, payload, defaultErrorMessage }: PostRconJsonOptions): Promise<T> => {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': csrfToken || '',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const rawPayload = await response.text();
    let data: any = null;

    if (rawPayload.trim() !== '') {
        try {
            data = JSON.parse(rawPayload);
        } catch {
            const errorMessage = extractHtmlTitle(rawPayload) || `RCON endpoint returned a non-JSON response (HTTP ${response.status}).`;
            throw new Error(errorMessage);
        }
    }

    if (!response.ok || !data?.success) {
        const errorMessage = data?.error || `${defaultErrorMessage} (HTTP ${response.status}).`;
        throw new Error(errorMessage);
    }

    return data as T;
};
