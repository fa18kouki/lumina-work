// Mock for next/server
export const cookies = () => ({
  get: () => null,
  set: () => {},
  delete: () => {},
  getAll: () => [],
  has: () => false,
});

export const headers = () => ({
  get: () => null,
  getAll: () => [],
  has: () => false,
  forEach: () => {},
  entries: () => [][Symbol.iterator](),
  keys: () => [][Symbol.iterator](),
  values: () => [][Symbol.iterator](),
});

interface CookieSetOptions {
  name: string;
  value: string;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  path?: string;
  maxAge?: number;
}

export class NextRequest {
  url: string;
  method: string;
  headers: Headers;
  cookies: {
    get: (name: string) => { value: string } | undefined;
    has: (name: string) => boolean;
  };
  private _body?: BodyInit | null;

  constructor(url: string, init?: RequestInit & { cookies?: Record<string, string> }) {
    this.url = url;
    this.method = init?.method ?? "GET";
    this.headers = new Headers(init?.headers);
    this._body = init?.body;
    const cookieMap = new Map<string, string>(
      Object.entries(init?.cookies ?? {}),
    );
    this.cookies = {
      get: (n) =>
        cookieMap.has(n) ? { value: cookieMap.get(n) as string } : undefined,
      has: (n) => cookieMap.has(n),
    };
  }

  async json(): Promise<unknown> {
    if (this._body === undefined || this._body === null) return undefined;
    if (typeof this._body === "string") return JSON.parse(this._body);
    throw new Error("NextRequest mock supports string body only");
  }

  nextUrl = {
    pathname: "/",
    searchParams: new URLSearchParams(),
  };
}

interface MockedResponseExtensions {
  cookies: {
    set: (opts: CookieSetOptions) => void;
    _captured: () => CookieSetOptions[];
  };
}

function attachCookies<T extends Response>(res: T): T & MockedResponseExtensions {
  const captured: CookieSetOptions[] = [];
  const extended = res as T & MockedResponseExtensions;
  extended.cookies = {
    set: (opts) => {
      captured.push(opts);
    },
    _captured: () => captured,
  };
  return extended;
}

export class NextResponse {
  static json(body: unknown, init?: ResponseInit) {
    const res = new Response(JSON.stringify(body), {
      ...init,
      headers: {
        ...init?.headers,
        "content-type": "application/json",
      },
    });
    return attachCookies(res);
  }

  static redirect(url: string | URL, status?: number) {
    const res = new Response(null, {
      status: status ?? 307,
      headers: { Location: url.toString() },
    });
    return attachCookies(res);
  }

  static next() {
    return attachCookies(new Response(null, { status: 200 }));
  }
}

export { cookies as unstable_rethrow };
