"use client";

import { useQuery } from "@tanstack/react-query";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "";

/**
 * Strapi client modeled after apiClient used elsewhere.
 * Supports caching via the fetch cache option.
 */
export async function strapiClient({
  url,
  method = "GET",
  data,
  cache = "force-cache",
}) {
  if (!STRAPI_BASE_URL) {
    throw new Error("STRAPI base URL is not configured");
  }

  const fullUrl = `${STRAPI_BASE_URL}${url}`;
  const headers = {
    "Content-Type": "application/json",
  };

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    cache,
  });

  let json = null;
  try {
    json = await response.json();
  } catch (err) {
    // ignore parse errors; handled below
  }

  if (!response.ok) {
    const message =
      json?.error?.message ||
      json?.message ||
      "Failed to fetch Strapi content";
    throw new Error(message);
  }

  return json;
}

export async function fetchStrapiContent(path, cache = "force-cache") {
  return strapiClient({ url: path, method: "GET", cache });
}

export function useStrapiQuery({ path, cache = "force-cache", enabled = true }) {
  return useQuery({
    queryKey: ["strapi", path],
    enabled: Boolean(path) && enabled,
    queryFn: () => fetchStrapiContent(path, cache),
  });
}
