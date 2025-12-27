import { z } from 'zod';
import { insertEvStatSchema, insertForecastSchema, evStats, forecasts, regions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  stats: {
    list: {
      method: 'GET' as const,
      path: '/api/stats',
      input: z.object({
        region: z.string().optional(),
        evType: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof evStats.$inferSelect>()),
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/stats/upload',
      // Multipart form data not fully typed in Zod for input, handled in route
      responses: {
        201: z.object({ message: z.string(), count: z.number() }),
        400: errorSchemas.validation,
      },
    },
    clearAll: {
      method: 'DELETE' as const,
      path: '/api/stats/clear-all',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  forecasts: {
    generate: {
      method: 'POST' as const,
      path: '/api/forecasts/generate',
      input: z.object({
        region: z.string(),
        evType: z.string(),
        startYear: z.number(),
        endYear: z.number(),
      }),
      responses: {
        201: z.array(z.custom<typeof forecasts.$inferSelect>()),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/forecasts',
      input: z.object({
        region: z.string().optional(),
        evType: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof forecasts.$inferSelect>()),
      },
    },
  },
  regions: {
    list: {
      method: 'GET' as const,
      path: '/api/regions',
      responses: {
        200: z.array(z.string()),
      },
    },
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          totalEvs: z.number(),
          totalDemand: z.number(),
          topRegion: z.string(),
          growthRate: z.number(),
        }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
