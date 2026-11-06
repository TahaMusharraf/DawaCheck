export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
    }
}

function authHeaders(init: RequestInit): Headers {
    const headers = new Headers(init.headers);
    if (init.body) headers.set('Content-Type', 'application/json');
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }
    return headers;
}

async function request(path: string, init: RequestInit): Promise<Response> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, { ...init, headers: authHeaders(init) });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        const msg = Array.isArray(body?.message) ? body?.message.join(', ') : body?.message;
        throw new ApiError(msg ?? `Request failed: ${response.status}`, response.status);
    }
    return response;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await request(path, init);
    return (await response.json().catch(() => null)) as T;
}

/** For JSON bodies: send('POST', '/recalls', { batchId, reason }) */
export function send<T>(method: 'POST' | 'PUT' | 'PATCH', path: string, body?: unknown): Promise<T> {
    return api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
}

/** Downloads a file response (e.g. the labels PDF) through the browser. */
export async function download(path: string, filename: string): Promise<void> {
    const response = await request(path, {});
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
