import { logger } from "@coder/logger"
import { getClientConfiguration, normalize, logError } from "../common/util"

export async function registerServiceWorker(): Promise<void> {
  const options = getClientConfiguration()

  const path = normalize(`${options.csStaticBase}/out/browser/serviceWorker.js`)
  try {
    await navigator.serviceWorker.register(path, {
      scope: options.base + "/",
    })
    logger.info(`[Service Worker] registered`)
  } catch (error) {
    logError(logger, `[Service Worker] registration`, error)
  }
}

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  registerServiceWorker()
} else {
  logger.error(`[Service Worker] navigator is undefined`)
}
