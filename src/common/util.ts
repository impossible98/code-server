import { ClientConfiguration } from "../../lib/vscode/src/vs/server/types"

/**
 * Split a string up to the delimiter. If the delimiter doesn't exist the first
 * item will have all the text and the second item will be an empty string.
 */
export const split = (str: string, delimiter: string): [string, string] => {
  const index = str.indexOf(delimiter)
  return index !== -1 ? [str.substring(0, index).trim(), str.substring(index + 1)] : [str, ""]
}

/**
 * Appends an 's' to the provided string if count is greater than one;
 * otherwise the string is returned
 */
export const plural = (count: number, str: string): string => (count === 1 ? str : `${str}s`)

export const generateUuid = (length = 24): string => {
  const possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  return Array(length)
    .fill(1)
    .map(() => possible[Math.floor(Math.random() * possible.length)])
    .join("")
}

/**
 * Remove extra slashes in a URL.
 */
export const normalize = (url: string, keepTrailing = false): string => {
  return url.replace(/\/\/+/g, "/").replace(/\/+$/, keepTrailing ? "/" : "")
}

/**
 * Remove leading and trailing slashes.
 */
export const trimSlashes = (url: string): string => {
  return url.replace(/^\/+|\/+$/g, "")
}

/**
 * Resolve a relative base against the window location. This is used for
 * anything that doesn't work with a relative path.
 */
export const resolveBase = (base?: string): string => {
  // After resolving the base will either start with / or be an empty string.
  if (!base || base.startsWith("/")) {
    return base ?? ""
  }
  const parts = location.pathname.split("/")
  parts[parts.length - 1] = base
  const url = new URL(location.origin + "/" + parts.join("/"))
  return normalize(url.pathname)
}

/**
 * Get client-side configuration embedded in the HTML or query params.
 */
export const getClientConfiguration = <T extends ClientConfiguration>(): T => {
  let config: T
  try {
    config = JSON.parse(document.getElementById("coder-options")!.getAttribute("data-settings")!)
  } catch (error) {
    config = {} as T
  }

  // You can also pass options in stringified form to the options query
  // variable. Options provided here will override the ones in the options
  // element.
  const params = new URLSearchParams(location.search)
  const queryOpts = params.get("options")
  if (queryOpts) {
    config = {
      ...config,
      ...JSON.parse(queryOpts),
    }
  }

  config.base = resolveBase(config.base)
  config.csStaticBase = resolveBase(config.csStaticBase)

  return config
}

/**
 * Wrap the value in an array if it's not already an array. If the value is
 * undefined return an empty array.
 */
export const arrayify = <T>(value?: T | T[]): T[] => {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === "undefined") {
    return []
  }
  return [value]
}

/**
 * Get the first string. If there's no string return undefined.
 */
export const getFirstString = (value: string | string[] | object | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return typeof value === "string" ? value : undefined
}

// TODO: Might make sense to add Error handling to the logger itself.
export function logError(logger: { error: (msg: string) => void }, prefix: string, err: Error | string): void {
  if (err instanceof Error) {
    logger.error(`${prefix}: ${err.message} ${err.stack}`)
  } else {
    logger.error(`${prefix}: ${err}`)
  }
}
