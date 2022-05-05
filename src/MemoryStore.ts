type errCallback = (err: any) => void;
type successCallback<T> = (err: any, value: T) => void
type iteratee<T, U> = (value: T, key: string, iterationNumber: number) => U;

const callBackOrPromise = <T>(value: T, cb?: errCallback | successCallback<T>) => {
	return typeof cb === "function" ? cb(null, value) : Promise.resolve(value);
}

	export const MEMORY_STORAGE = "Memory"

export const MemoryStore = (): LocalForageDriver => {
	const map = new Map();
	
	return {
		_driver: MEMORY_STORAGE,
		_initStorage() {
			return map;
		},
		async clear(cb: errCallback) {
			callBackOrPromise(map.clear(), cb);
		},
		async getItem<T>(id: string, cb?: successCallback<T>) {
			return callBackOrPromise(map.get(id) ?? null, cb) || null;
		},
		// @ts-ignore
		async iterate<T, U>(cb: iteratee<T, U>, onErr?: successCallback<U>) {
			let i = 0;
			let res: U;
			
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
			return callBackOrPromise<string>(Array.from(map.keys())[key], cb) || "";
		},
		async keys(cb?: successCallback<string[]>) {
			return callBackOrPromise<string[]>(Array.from(map.keys()), cb) || [];
		},
		async length(cb?: successCallback<number>) {
			return callBackOrPromise<number>(map.size, cb) || 0;
		},
		async removeItem(id: string, cb?: successCallback<null>) {
			return callBackOrPromise<any>(map.delete(id), cb);
		},
		async setItem<T>(id: any, value: any, cb?: successCallback<T>) {
			return callBackOrPromise<any>(map.set(id, value), cb);
		},
	}
}
