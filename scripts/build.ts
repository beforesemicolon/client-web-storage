/**
 * This script will handle putting the folder ready to be packaged for npm
 *
 * Parameters
 * - LOCAL => creates un-minified build
 *
 * !!!! It should be executed from the root directory
 */
import {exec} from 'child_process';
import {promisify} from 'util';
import packageJSON from '../package.json';

const execAsync = promisify(exec);

const local = process.env.LOCAL === "true";

const clientCMD = local
	? "esbuild src/client.ts --bundle --target=es2020 --outfile=dist/client-web-storage.min.js"
	: "esbuild src/client.ts --bundle --minify --keep-names --sourcemap --target=es2020 --outfile=dist/client-web-storage.min.js"

async function run() {
	try {
		const tarFileName = `${packageJSON.name + "-" + packageJSON.version}.tgz`;
		await execAsync("rm -rf dist")
		await execAsync(clientCMD)
		await execAsync("tsc")
		await execAsync("cp README.md LICENSE package.json dist")
		await execAsync("cd dist && npm pack")
		await execAsync(`mv dist/${tarFileName} .`)
		
		console.log('Build Successful =>', tarFileName);
		
		const publishCommand = packageJSON.version.endsWith('-next')
			? `npm publish ${tarFileName} --tag next`
			: `npm publish ${tarFileName}`;
		
		console.log('\nPublish with command:');
		console.log(publishCommand);
	} catch (e) {
		console.error(e);
	}
}

run();
