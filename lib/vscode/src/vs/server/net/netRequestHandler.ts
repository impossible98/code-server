/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Coder Technologies. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as net from 'net';
import * as http from 'http';
import { Disposable } from 'vs/base/common/lifecycle';
import { ILogService } from 'vs/platform/log/common/log';
import { IEnvironmentServerService } from 'vs/server/environmentService';
// eslint-disable-next-line code-import-patterns
import { requestHandler as defaultRequestHandler } from '../../../../resources/web/code-web';

export class NetRequestHandler extends Disposable {
	constructor(private readonly netServer: net.Server, private readonly environmentService: IEnvironmentServerService, private readonly logService: ILogService) {
		super();

		this.netServer.on('request', this.requestListener);
	}

	private requestListener = async (req: http.IncomingMessage, res: http.ServerResponse) => {
		this.logService.trace('[Net Request]', `Received request at ${req.url || 'unknown'}`);

		const requestPrefix = this.requestPathPrefix(req);
		// webEndpointUrl.pathname = path.join(csStaticBase, 'lib/vscode');

		const workbenchConstructionOptions = await this.environmentService.createWorkbenchConstructionOptions(requestPrefix);
		defaultRequestHandler(req, res, workbenchConstructionOptions);
	};

	/**
	 * Generates a prefix used to normalize a request's base path.
	 * @remark This is especially useful when serving the editor from directory.
	 * e.g. `"localhost:8080/some/user/path/"
	 */
	public requestPathPrefix(req: http.IncomingMessage): string {
		return '/';
	}

	override dispose(): void {
		super.dispose();

		if (this.netServer) {
			this.netServer.off('request', this.requestListener);
		}
	}
}
