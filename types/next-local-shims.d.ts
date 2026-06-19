declare module "next/types.js" {
  export type AppRouteHandlerRoutes = string;
  export type LayoutRoutes = string;
  export type ParamMap = Record<string, Record<string, string | string[]>>;
  export type ResolvingMetadata = Promise<Record<string, unknown>>;
  export type ResolvingViewport = Promise<Record<string, unknown>>;
}

declare module "next/server.js" {
  export class NextRequest extends Request {}
  export class NextResponse extends Response {
    static json(body: unknown, init?: ResponseInit): NextResponse;
  }
}
