import * as Sentry from "@sentry/nextjs";

type logLevel = "fatal" | "error" | "warning" | "info" | "debug";

export const logEvent = (
  message: string,
  category: string = "general",
  data?: Record<string, any>,
  level: logLevel = "info",
  error?: unknown
) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
  });

  if (error) {
    Sentry.captureException(error, {extra: data});
  } else {
    Sentry.captureMessage(message, level);
  }
};
