/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Schemas } from 'vs/base/common/network';
import { URI } from 'vs/base/common/uri';
import { createServerURITransformer } from 'vs/base/common/uriServer';
import { NativeEnvironmentService } from 'vs/platform/environment/node/environmentService';
import { getLogLevel } from 'vs/platform/log/common/log';
import { toWorkspaceFolder } from 'vs/platform/workspace/common/workspace';
import { getLocaleFromConfig, getNlsConfiguration } from 'vs/server/nls';
import { IProductConfiguration, IServerWorkbenchConstructionOptions, IWorkspace } from 'vs/workbench/workbench.web.api';
import { memoize } from '../base/common/decorators';
import { Writeable } from '../base/common/types';
import { NativeParsedArgs } from '../platform/environment/common/argv';
import { INativeEnvironmentService } from '../platform/environment/common/environment';
import { refineServiceDecorator } from '../platform/instantiation/common/instantiation';
import { IProductService } from '../platform/product/common/productService';

export interface IEnvironmentServerService extends INativeEnvironmentService {
	extensionEnabledProposedApi: string[] | undefined;
	remoteAuthority: string;
	createWorkbenchConstructionOptions: (requestPathPrefix: string) => Promise<IServerWorkbenchConstructionOptions>;
}

export const IEnvironmentServerService = refineServiceDecorator<INativeEnvironmentService, IEnvironmentServerService>(INativeEnvironmentService);

export interface IEnvironmentServerServiceConfiguration {
	readonly serverUrl: URL;
	readonly remoteAuthority: string;
	readonly disableUpdateCheck: boolean;
}

export class EnvironmentServerService extends NativeEnvironmentService implements IEnvironmentServerService {
	constructor(args: NativeParsedArgs, productService: IProductService, private configuration: IEnvironmentServerServiceConfiguration) {
		super(args, productService);
	}

	public async createWorkbenchConstructionOptions(requestPathPrefix: string): Promise<IServerWorkbenchConstructionOptions> {
		const { remoteAuthority, productService } = this;
		const workspace = this.parseWorkspaceArgs();
		const transformer = createServerURITransformer(remoteAuthority);

		/**
		 * Only append dynamic properties here.
		 * Static properties should be inherited when constructing `EnvironmentServerService`
		 */

		const logoutEndpointUrl = new URL(this.configuration.serverUrl.toString());
		logoutEndpointUrl.pathname = path.join(requestPathPrefix, '/logout') + `?base=${requestPathPrefix}`;

		const webEndpointUrl = new URL(this.configuration.serverUrl.toString());
		// TODO add commit prefix.
		webEndpointUrl.pathname = path.join(requestPathPrefix, '/static');

		const productConfiguration: Writeable<IProductConfiguration> = {
			...productService,
			logoutEndpointUrl: logoutEndpointUrl.toString(),
			webEndpointUrl: webEndpointUrl.toString(),
		};

		if (!this.configuration.disableUpdateCheck) {
			productConfiguration.updateUrl = path.join(requestPathPrefix, '/update/check');
		}

		return {
			...workspace,
			remoteAuthority,
			logLevel: getLogLevel(this),
			workspaceProvider: {
				workspace,
				trusted: undefined,
				payload: [
					['userDataPath', this.userDataPath],
					['enableProposedApi', JSON.stringify(this.extensionEnabledProposedApi || [])],
				],
			},
			remoteUserDataUri: transformer.transformOutgoing(URI.file(this.userDataPath)),
			productConfiguration,
			nlsConfiguration: await getNlsConfiguration(this.args.locale || (await getLocaleFromConfig(this.userDataPath)), this.userDataPath),
		};
	}

	private createWorkbenchURIs(paths: string[]) {
		return paths.map(path =>
			toWorkspaceFolder(
				URI.from({
					scheme: Schemas.vscodeRemote,
					authority: this.remoteAuthority,
					path,
				}),
			),
		);
	}

	/**
	 * A workspace to open in the workbench can either be:
	 * - a workspace file with 0-N folders (via `workspaceUri`)
	 * - a single folder (via `folderUri`)
	 * - empty (via `undefined`)
	 */
	private parseWorkspaceArgs(): IWorkspace | undefined {
		/** @todo `startPath` should eventually be merged with the parsed path arg. */
		//  const workbenchPaths: string[] = startPath ? [startPath.url] : this.args._.slice(1);
		const workbenchPaths: string[] = this.args._.slice(1);

		if (!workbenchPaths.length) {
			return;
		}

		const workbenchURIs = this.createWorkbenchURIs(workbenchPaths);

		// TODO: multiple workbench entries needs further testing.
		// const hasSingleEntry = workbenchURIs.length > 0;
		// const isSingleEntry = workbenchURIs.length === 1;

		return {
			// workspaceUri: isSingleEntry ? undefined : fs.stat(path),
			workspaceUri: undefined,
			folderUri: workbenchURIs[0].uri,
		};
	}

	@memoize
	public get commit(): string {
		return this.productService.commit || 'development';
	}

	@memoize
	public get remoteAuthority(): string {
		return this.configuration.remoteAuthority;
	}

	@memoize
	public get disableUpdateCheck(): boolean {
		return this.configuration.disableUpdateCheck;
	}

	@memoize
	public get environmentPaths(): string[] {
		return [this.extensionsPath, this.logsPath, this.globalStorageHome.fsPath, this.workspaceStorageHome.fsPath, ...this.extraExtensionPaths, ...this.extraBuiltinExtensionPaths];
	}

	@memoize
	public get piiPaths(): string[] {
		return [
			path.join(this.userDataPath, 'clp'), // Language packs.
			this.appRoot,
			this.extensionsPath,
			this.builtinExtensionsPath,
			...this.extraExtensionPaths,
			...this.extraBuiltinExtensionPaths,
		];
	}
}
