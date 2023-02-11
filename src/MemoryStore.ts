type errCallback = (err: any) => void;
type successCallback<T> = (err: any, value: T) => void
type iteratee<T, U> = (value: T, key: string, iterationNumber: number) => U;

const callBackOrPromise = <T>(value: T, cb?: errCallback | successCallback<T>) => {
	return typeof cb === "function" ? cb(null, value) : Promise.resolve(value);
}

export const MEMORYSTORAGE = "Memory";

const maps: Record<string, Map<string, any>> = {};

const getMapKeyFromConfig = (config: LocalForageOptions) => `${config.storeName}-${config.name}-${config.version}`;
const getMap = ({_config}: any) => {
	return maps[getMapKeyFromConfig(_config)] ?? {}
}

export const MemoryStore = (): LocalForageDriver => {
	
	return {
		_driver: MEMORYSTORAGE,
		_initStorage(config) {
			// @ts-ignore
			this._config = config;
			maps[getMapKeyFromConfig(config)] = new Map();
		},
		async clear(cb: errCallback) {
			getMap(this).clear();
			
			callBackOrPromise([], cb);
		},
		async getItem<T>(id: string, cb?: successCallback<T>) {
			const item = getMap(this).get(id);
			
			return callBackOrPromise(item ?? null, cb) || null;
		},
		// @ts-ignore
		async iterate<T, U>(cb: iteratee<T, U>, onErr?: successCallback<U>) {
			let i = 0;
			let res: U;
			
			for (let [key, value] of getMap(this).entries()) {
				res = cb(value, key, i);
				if (res !== undefined) {
					return callBackOrPromise(res, onErr);
				}
				
				i += 1;
			}
			
			return callBackOrPromise<any>(null, onErr);
		},
		async key(key: number, cb?: successCallback<string>) {
			const keys = Array.from(getMap(this).keys());
			
			return callBackOrPromise(keys[key], cb) || "";
		},
		async keys(cb?: successCallback<string[]>) {
			const keys = Array.from(getMap(this).keys());
			
			return callBackOrPromise(keys, cb) || [];
		},
		async length(cb?: successCallback<number>) {
			return callBackOrPromise(getMap(this).size, cb) || 0;
		},
		async removeItem(id: string, cb?: successCallback<null>) {
			getMap(this).delete(id)
			
			return callBackOrPromise<any>(id, cb);
		},
		async setItem<T>(id: any, value: any, cb?: successCallback<T>) {
			getMap(this).set(id, value)
			
			return callBackOrPromise<any>(value, cb);
		},
		async dropInstance() {
			// @ts-ignore
			delete maps[getMapKeyFromConfig(this._config)]
		}
	}
}
