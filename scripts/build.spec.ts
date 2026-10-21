/** @jest-environment node */
jest.mock('child_process', () => ({exec: jest.fn()}));

const initialExitCode = process.exitCode;
const initialLocal = process.env.LOCAL;

beforeEach(() => {
  jest.resetModules();
  process.exitCode = undefined;
  delete process.env.LOCAL;
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  process.exitCode = initialExitCode;
  if (initialLocal === undefined) delete process.env.LOCAL;
  else process.env.LOCAL = initialLocal;
  jest.restoreAllMocks();
});

async function runBuild(failedCommand?: string) {
  const execMock = require('child_process').exec as jest.Mock;
  execMock.mockImplementation((command: string, callback: Function) => {
    callback(command === failedCommand ? new Error('Build command failed') : null, '', '');
  });
  require('./build');
  await new Promise(resolve => setImmediate(resolve));
  return execMock;
}

test('successful builds leave a successful exit status', async () => {
  const execMock = await runBuild();
  expect(execMock).toHaveBeenCalledTimes(6);
  expect(process.exitCode).toBeUndefined();
  expect(console.error).not.toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Build Successful'), expect.any(String));
});

test('failed compilation returns a failing exit status and stops packaging', async () => {
  const execMock = await runBuild('tsc');
  expect(process.exitCode).toBe(1);
  expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  expect(execMock).toHaveBeenCalledTimes(3);
  expect(console.log).not.toHaveBeenCalled();
});

test('local builds enable the existing unminified build mode', async () => {
  const {scripts} = require('../package.json');
  expect(scripts['build:local']).toBe('LOCAL=true npm run build');
  expect(scripts.local).toContain('npm run build:local');

  process.env.LOCAL = 'true';
  const execMock = await runBuild();
  expect(execMock.mock.calls[1][0]).toContain('esbuild src/client.ts --bundle');
  expect(execMock.mock.calls[1][0]).not.toContain('--minify');
  expect(process.exitCode).toBeUndefined();
});
