type errCallback = (err: any) => void;
type successCallback<T> = (err: any, value: T) => void
type iteratee<T, U> = (value: T, key: string, iterationNumber: number) => U;

const callBackOrPromise = <T>(value: T, cb?: errCallback | successCallback<T>) => {
	return typeof cb === "function" ? cb(null, value) : Promise.resolve(value);
}

export const MEMORY_STORAGE = "Memory";

const maps: Record<string, Map<any, any>> = {};

const getMapKeyFromConfig = (config: LocalForageOptions) => `${config.storeName}-${config.name}`;

export const MemoryStore = (): LocalForageDriver => {
	
	return {
		_driver: MEMORY_STORAGE,
		_initStorage(config) {
			maps[getMapKeyFromConfig(config)] = new Map();
		},
		async clear(cb: errCallback) {
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			map.clear();
			
			callBackOrPromise([], cb);
		},
		async getItem<T>(id: string, cb?: successCallback<T>) {
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			const item = map.get(id);
			
			return callBackOrPromise(item ?? null, cb) || null;
		},
		// @ts-ignore
		async iterate<T, U>(cb: iteratee<T, U>, onErr?: successCallback<U>) {
			let i = 0;
			let res: U;
			
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			
			for (let [key, value] of map.entries()) {
				res = cb(value, key, i);
				if (res !== undefined) {
					return callBackOrPromise(res, onErr);
				}
				
				i += 1;
			}
			
			return callBackOrPromise<any>(null, onErr);
		},
		async key(key: number, cb?: successCallback<string>) {
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			const keys = Array.from(map.keys());
			
			return callBackOrPromise(keys[key], cb) || "";
		},
		async keys(cb?: successCallback<string[]>) {
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			const keys = Array.from(map.keys());
			
			return callBackOrPromise(keys, cb) || [];
		},
		async length(cb?: successCallback<number>) {
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			
			return callBackOrPromise(map.size, cb) || 0;
		},
		async removeItem(id: string, cb?: successCallback<null>) {
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			
			map.delete(id)
			
			return callBackOrPromise<any>(id, cb);
		},
		async setItem<T>(id: any, value: any, cb?: successCallback<T>) {
			// @ts-ignore
			const map = maps[getMapKeyFromConfig(this._config)];
			
			map.set(id, value)
			
			return callBackOrPromise<any>(value, cb);
		},
	}
}
