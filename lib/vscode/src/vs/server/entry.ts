import { ArgumentParser } from '../platform/environment/argumentParser';
import { ServerProcessMain } from './main';
import { CreateVSServer } from './types';

export const main = async () => {
	const argumentParser = new ArgumentParser();
	const args = argumentParser.resolveArgs();

	if (!args['server']) {
		throw new Error('Server argument was not given');
	}

	const serverUrl = new URL(args['server']);

	const codeServer = new ServerProcessMain({
		args,
		authed: false,
		disableUpdateCheck: true,
		base: '/',
		csStaticBase: '/static',
		remoteAuthority: serverUrl.host,
		codeServerVersion: 'Unknown',
		serverUrl,
	});

	const netServer = await codeServer.startup();

	return new Promise(resolve => {
		netServer.on('close', resolve);
	});
};

export const createVSServer: CreateVSServer = async serverConfig => {
	const codeServer = new ServerProcessMain(serverConfig);

	return codeServer.startup({ listenWhenReady: false });
};
