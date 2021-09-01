import { logger } from "@coder/logger"
import { JSONSchemaForNPMPackageJsonFiles } from "@schemastore/package"
import * as os from "os"
import * as path from "path"

export const WORKBENCH_WEB_CONFIG_ID = "vscode-workbench-web-configuration"

export function getPackageJson(relativePath: string): JSONSchemaForNPMPackageJsonFiles {
  let pkg = {}
  try {
    pkg = require(relativePath)
  } catch (error) {
    logger.warn(error.message)
  }

  return pkg
}

const pkg = getPackageJson("../../package.json")

export const version = pkg.version || "development"
export const commit = pkg.commit || "development"
export const rootPath = path.resolve(__dirname, "../..")
export const vsRootPath = path.join(rootPath, "lib/vscode")
export const tmpdir = path.join(os.tmpdir(), "code-server")
export const isDevMode = commit === "development"
