// testUtils.ts
import { getSafeRedisClient } from '../redisClient.js';
import { vi } from 'vitest';
import axios from 'axios';
export const mockedAxios = axios as unknown as { request: ReturnType<typeof vi.fn> };

import { z } from 'zod';
import { fetchAndCache } from './fetchAndCache.js';


export function mockAxiosResponse({
  data,
  status = 200,
  headers = { 'content-type': 'application/json' },
}: {
  data: any;
  status?: number;
  headers?: Record<string, string>;
}) {
  mockedAxios.request.mockResolvedValue({
    data,
    status,
    statusText: 'OK',
    headers,
    config: {},
  });
}

export async function mockFetchAndCache<T extends object>({
  cacheType,
  id,
  url,
  schema,
  responseData,
  logPrefix = 'Test',
  forceRefresh = true,
}: {
  cacheType: string;
  id: string;
  url: string;
  schema: z.ZodType<T>;
  responseData: any;
  logPrefix?: string;
  forceRefresh?: boolean;
}): Promise<T> {
  mockAxiosResponse({ data: responseData });

  const result = await fetchAndCache({
    cacheType,
    id,
    forceRefresh,
    url,
    schema,
    notFoundMessage: `${cacheType} not found`,
    logPrefix,
  });

  if ('error' in result) {
    throw new Error(`fetchAndCache returned error: ${result.error}`);
  }
  return result as T;
}

export async function mockFetchAndExpectError({
  cacheType,
  id,
  url,
  schema,
  responseData,
  expectedStatusCode,
  logPrefix = 'Test',
  forceRefresh = true,
  customMock = false,
}: {
  cacheType: string;
  id: string;
  url: string;
  schema: z.ZodTypeAny;
  responseData: any;
  expectedStatusCode: number;
  logPrefix?: string;
  forceRefresh?: boolean;
  customMock?: boolean; // true si on veut gérer le mock manuellement
}) {
  if (!customMock) {
    mockAxiosResponse({ data: responseData, status: expectedStatusCode });
  }

  const result = await fetchAndCache({
    cacheType,
    id,
    forceRefresh,
    url,
    schema,
    notFoundMessage: `${cacheType} not found`,
    logPrefix,
  });

  if (!('error' in result)) {
    throw new Error(
      `Expected an error result, but got successful response: ${JSON.stringify(result)}`
    );
  }
  expect(result.statusCode).toBe(expectedStatusCode);

  return result;
}

export function expectZodFailure({
  data,
  schema,
}: {
  data: unknown;
  schema: z.ZodTypeAny;
}) {
  const result = schema.safeParse(data);

  if (result.success) {
    throw new Error(`Expected Zod parsing to fail, but it succeeded:\n${JSON.stringify(data, null, 2)}`);
  }

  console.log('Zod parsing failed with:', result.error.format());
  return result.error;
}

export function resetAxiosMocks() {
  if (mockedAxios?.request?.mockClear) {
    mockedAxios.request.mockClear();
  } else {
    console.warn('mockedAxios.request is not a mock, ensure that vi.mock("axios") is called before the imports.');
  }
}