import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let responseBody: any = {};
    let errorMessage = "Something went wrong. Please try again.";

    try {
      // Try to parse response as JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await res.text();
        if (text) {
          responseBody = JSON.parse(text);
          // Get user-friendly message without technical details
          errorMessage = responseBody.message || responseBody.error || errorMessage;

          // Further sanitize the error message to remove sensitive info
          if (errorMessage.includes('Error:')) {
            errorMessage = errorMessage.split('Error:')[1].trim();
          }

          // Remove any error codes
          errorMessage = errorMessage.replace(/^\d+:?\s*/, '');

          // Remove any server paths or technical stack traces
          errorMessage = errorMessage.replace(/\/.*\.js:\d+:\d+/g, '');
          errorMessage = errorMessage.replace(/at\s+.*?\s+\(.*?\)/g, '');

          // Provide generic messages for certain error types
          if (res.status === 401 || res.status === 403) {
            errorMessage = "You don't have permission to access this resource.";
          } else if (res.status === 404) {
            errorMessage = "The requested resource was not found.";
          } else if (res.status === 500) {
            errorMessage = "Something went wrong on our server. Please try again later.";
          }
        }
      } else {
        // If not JSON, just get text but sanitize it
        const text = await res.text();
        if (text) {
          // Simplify the error message
          errorMessage = "An error occurred. Please try again.";
        }
      }
    } catch (e) {
      console.error("Error parsing API response:", e);
    }

    // Create a custom error with additional properties
    // Store original data for debugging but show sanitized message to user
    const error: any = new Error(errorMessage);
    error.status = res.status;
    error.response = res;
    error.responseBody = responseBody;

    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isFormData = data instanceof FormData;

  const res = await fetch(url, {
    method,
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
