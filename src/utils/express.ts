import http from 'node:http';
import url from 'node:url';

export interface Request extends http.IncomingMessage {
  body?: any;
  query?: any;
  params?: Record<string, string>;
  ip?: string;
  originalUrl?: string;
  cookies?: Record<string, string>;
  admin?: any;
}

export interface Response extends http.ServerResponse {
  status(code: number): Response;
  json(data: any): Response;
  cookie(name: string, value: string, options?: any): Response;
  clearCookie(name: string, options?: any): Response;
}

export type NextFunction = (err?: any) => void;
export type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

interface RouteLayer {
  method: string | null;
  path: string | null;
  handler: Middleware;
  isPrefix?: boolean;
}

export function Router() {
  return new RouterInstance();
}

export class RouterInstance {
  layers: RouteLayer[] = [];

  use(pathOrHandler: string | Middleware, ...handlers: Middleware[]) {
    if (typeof pathOrHandler === 'string') {
      for (const h of handlers) {
        this.layers.push({ method: null, path: pathOrHandler, handler: h, isPrefix: true });
      }
    } else {
      this.layers.push({ method: null, path: null, handler: pathOrHandler, isPrefix: true });
      for (const h of handlers) {
        this.layers.push({ method: null, path: null, handler: h, isPrefix: true });
      }
    }
    return this;
  }

  get(path: string, ...handlers: Middleware[]) {
    return this.addRoute('GET', path, handlers);
  }

  post(path: string, ...handlers: Middleware[]) {
    return this.addRoute('POST', path, handlers);
  }

  patch(path: string, ...handlers: Middleware[]) {
    return this.addRoute('PATCH', path, handlers);
  }

  put(path: string, ...handlers: Middleware[]) {
    return this.addRoute('PUT', path, handlers);
  }

  delete(path: string, ...handlers: Middleware[]) {
    return this.addRoute('DELETE', path, handlers);
  }

  private addRoute(method: string, path: string, handlers: Middleware[]) {
    for (const h of handlers) {
      this.layers.push({ method, path, handler: h });
    }
    return this;
  }
}

export class ExpressApp extends RouterInstance {
  settings: Record<string, any> = {};

  set(setting: string, val: any) {
    this.settings[setting] = val;
    return this;
  }

  listen(port: number, callback?: () => void): http.Server {
    const server = http.createServer(async (rawReq, rawRes) => {
      const req = rawReq as Request;
      const res = rawRes as Response;

      // Augment Response
      res.status = function (code: number) {
        res.statusCode = code;
        return res;
      };

      res.json = function (data: any) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
        return res;
      };

      res.cookie = function (name: string, value: string, options: any = {}) {
        let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
        if (options.maxAge) cookieStr += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
        if (options.httpOnly) cookieStr += '; HttpOnly';
        if (options.secure) cookieStr += '; Secure';
        if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
        if (options.path) cookieStr += `; Path=${options.path}`;
        if (options.domain) cookieStr += `; Domain=${options.domain}`;

        const prev = res.getHeader('Set-Cookie');
        if (Array.isArray(prev)) {
          res.setHeader('Set-Cookie', [...prev, cookieStr]);
        } else if (prev) {
          res.setHeader('Set-Cookie', [String(prev), cookieStr]);
        } else {
          res.setHeader('Set-Cookie', [cookieStr]);
        }
        return res;
      };

      res.clearCookie = function (name: string, options: any = {}) {
        return res.cookie(name, '', { ...options, maxAge: 0 });
      };

      // Augment Request
      const parsedUrl = url.parse(req.url || '/', true);
      req.query = parsedUrl.query || {};
      req.params = {};
      req.originalUrl = req.url;
      req.ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;

      // Parse JSON body if present
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        if (bodyData) {
          try {
            req.body = JSON.parse(bodyData);
          } catch {
            req.body = bodyData;
          }
        } else {
          req.body = {};
        }

        // Execute middleware pipeline
        await this.handle(req, res, parsedUrl.pathname || '/');
      });
    });

    return server.listen(port, callback);
  }

  async handle(req: Request, res: Response, pathname: string) {
    const queue: Array<{ handler: Middleware; params?: Record<string, string> }> = [];

    this.flattenLayers(this, '', pathname, req.method || 'GET', queue);

    let idx = 0;
    const next = async (err?: any) => {
      if (err) {
        // Find error handler (handler with 4 args or last)
        const errorLayer = queue.find(q => q.handler.length === 4);
        if (errorLayer) {
          try {
            return (errorLayer.handler as any)(err, req, res, () => {});
          } catch (e) {
            return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
          }
        }
        return res.status(err.status || 500).json({
          success: false,
          error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' }
        });
      }

      if (idx >= queue.length) {
        if (!res.writableEnded) {
          return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` } });
        }
        return;
      }

      const layer = queue[idx++];
      if (layer.handler.length === 4) {
        // Skip error handling middleware during normal request flow
        return next();
      }

      if (layer.params) {
        req.params = { ...req.params, ...layer.params };
      }

      try {
        await layer.handler(req, res, next);
      } catch (e) {
        await next(e);
      }
    };

    await next();
  }

  private flattenLayers(
    router: RouterInstance,
    prefix: string,
    pathname: string,
    method: string,
    queue: Array<{ handler: Middleware; params?: Record<string, string> }>
  ) {
    for (const layer of router.layers) {
      if ((layer.handler as any) instanceof RouterInstance) {
        const subRouter = layer.handler as any as RouterInstance;
        const subPrefix = (prefix + (layer.path || '')).replace(/\/+/g, '/');
        if (pathname.startsWith(subPrefix)) {
          this.flattenLayers(subRouter, subPrefix, pathname, method, queue);
        }
      } else {
        const rawFullPath = (prefix + (layer.path || '')).replace(/\/+/g, '/');
        const normFullPath = rawFullPath.length > 1 && rawFullPath.endsWith('/') ? rawFullPath.slice(0, -1) : rawFullPath;
        const normPathname = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

        if (layer.isPrefix) {
          if (!layer.path || normPathname.startsWith(normFullPath)) {
            queue.push({ handler: layer.handler });
          }
        } else {
          if (layer.method && layer.method !== method && method !== 'OPTIONS') {
            continue;
          }

          if (layer.path === '*' || normFullPath === normPathname) {
            queue.push({ handler: layer.handler });
          } else if (normFullPath.includes(':')) {
            const match = this.matchParams(normFullPath, normPathname);
            if (match) {
              queue.push({ handler: layer.handler, params: match });
            }
          }
        }
      }
    }
  }

  private matchParams(routePattern: string, actualPath: string): Record<string, string> | null {
    const routeParts = routePattern.split('/').filter(Boolean);
    const actualParts = actualPath.split('/').filter(Boolean);

    if (routeParts.length !== actualParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].substring(1)] = actualParts[i];
      } else if (routeParts[i] !== actualParts[i]) {
        return null;
      }
    }
    return params;
  }
}

export function express(): ExpressApp {
  return new ExpressApp();
}

express.Router = () => new Router();
express.json = () => (req: Request, res: Response, next: NextFunction) => next();
express.urlencoded = () => (req: Request, res: Response, next: NextFunction) => next();

export default express;
