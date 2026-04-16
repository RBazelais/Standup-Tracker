export async function fetchWithTimeout(
    input: RequestInfo,
    init?: RequestInit,
    timeoutMs = 10000,
) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(input, { ...(init || {}), signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}
