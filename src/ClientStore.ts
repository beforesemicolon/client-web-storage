import localforage, {LOCALSTORAGE, WEBSQL, INDEXEDDB} from 'localforage';
import {Schema} from "./Schema";
import {MEMORY_STORAGE, MemoryStore} from "./MemoryStore";

localforage.defineDriver(MemoryStore());

const defaultConfig = {
	version: 1,
	type: [INDEXEDDB, WEBSQL, LOCALSTORAGE, MEMORY_STORAGE],
	description: "",
	appName: "App",
}

export class ClientStore<T extends Schema.DefaultValue> {
	#store: LocalForage;
	#config: ClientStore.Config;
	#storeName: string;
	#schema: Schema<T>;
	#subscribers: ClientStore.StoreSubscriber[] = [];
	#ready = false;
	#size = 0;
	
	constructor(storeName: string, schema: Schema<T>, config: ClientStore.Config = defaultConfig) {
		this.#storeName = storeName;
		this.#config = {...defaultConfig, ...config};
		
		if (!(schema instanceof Schema)) {
			throw new Error('Missing or unknown "Schema"')
		}
		
		const name = this.#config.appName || "App";
		
		this.#schema = schema;
		this.#store = localforage.createInstance({
			driver: this.#config.type,
			version: this.#config.version,
			description: this.#config.description,
			name,
			storeName,
		});
		
		this.#store.ready(() => {
			console.info(`[Info] ClientStore "${storeName}" successfully created`);
			this.#ready = true;
			this.#broadcast(ClientStore.EventType.READY, null);
		})
	}
	
	get ready() {
		return this.#ready;
	}
	
	get type() {
		return this.#store.driver();
	}
	
	get name() {
		return `${this.#config.appName}-${this.#storeName}`;
	}
	
	get size() {
		return this.#size;
	}
	
	#broadcast(eventType: ClientStore.EventType, id: number | number[] | null = null) {
		this.#subscribers.forEach(sub => sub(eventType, id))
	}
	
	subscribe(sub: ClientStore.StoreSubscriber): ClientStore.StoreUnSubscriber {
		if (typeof sub === 'function') {
			this.#subscribers.push(sub)
		}
		
		return () => {
			this.#subscribers = this.#subscribers.filter(s => s !== sub)
		}
	}
	
	async createItem(value: Partial<T>) {
		const invalidFields = this.#schema.getInvalidSchemaDataFields(value);
		
		if (!invalidFields.length) {
			const newItem = this.#schema.toValue();
			
			for (const valueKey in value) {
				if (value.hasOwnProperty(valueKey) && !this.#schema.defaultKeys.includes(valueKey)) {
					// @ts-ignore
					newItem[valueKey] = value[valueKey]
				}
			}
			
			try {
				await this.#store.setItem(`${newItem.id}`, newItem);
				this.#size = await this.#store.length();
			} catch (error) {
				console.error(`Failed to create item "${value}"`, error);
			}
			
		  this.#broadcast(ClientStore.EventType.CREATE, newItem.id as number);
			
			return newItem;
		}
		
		throw new Error(`Failed to create item. Field(s) "${invalidFields.join(', ')}" do not match the schema: ${this.#schema}`)
	}
	
	async updateItem(id: T['id'], data: Partial<T>) {
		for (let dataKey in data) {
			if (data.hasOwnProperty(dataKey) && !this.#schema.defaultKeys.includes(dataKey) && !this.#schema.isValidFieldValue(dataKey, data[dataKey])) {
				throw new Error(`Failed to update item "${id}". Key "${dataKey}" is unknown or has invalid value type: ${this.#schema.getField(dataKey)}`)
			}
		}
		
		const item: any = await this.getItem(id);
		const updatedItem = {
			...item,
			...data,
			createdDate: item.createdDate,
			lastUpdatedDate: new Date(),
			id: item.id
		};
		
		try {
			await this.#store.setItem(`${item.id}`, updatedItem);
		} catch (error) {
			console.error(`Failed to update item "${item}"`, error);
		}
		
		this.#broadcast(ClientStore.EventType.UPDATE, id);
		
		return updatedItem;
	}
	
	async getItems(): Promise<Array<T>> {
		return this.findItems(() => true);
	}
	
	getItem(id: T['id']): Promise<T | null> {
		return this.#store.getItem(`${id}`);
	}
	
	removeItem(id: T['id']) {
		return this.#store.removeItem(`${id}`).then(async () => {
			this.#size = await this.#store.length();
			this.#broadcast(ClientStore.EventType.DELETE, id)
		})
	}
	
	async clear() {
		const keys: number[] = (await this.#store.keys()).map(Number);
		return this.#store.clear().then(async () => {
			this.#size = await this.#store.length();
			this.#broadcast(ClientStore.EventType.CLEAR, keys);
		})
	}
	
	async findItem(cb: (value: T, key: string) => boolean = () => false) {
		return this.#store.iterate<T, any>((value, key) => {
			const matched = cb(value, key);
			if (matched) {
				return value;
			}
		}) || null;
	}
	
	async findItems(cb: (value: T, key: string) => boolean = () => false) {
		const items: T[] = [];
		
		await this.#store.iterate<T, any>((value, key) => {
			if (cb(value, key)) {
				value && items.push(value)
			}
		})
		
		return items;
	}
}

export namespace ClientStore {
	export type StoreSubscriber = (eventType: ClientStore.EventType, id?: number | number[] | null) => void;
	
	export type StoreUnSubscriber = () => void;
	
	export interface Config {
		appName?: string;
		version?: LocalForageOptions['version'];
		type?: LocalForageOptions['driver'] | string;
		description?: LocalForageOptions['description'];
	}
	
	export enum EventType {
		READY = "ready",
		CREATE = "created",
		DELETE = "deleted",
		UPDATE = "updated",
		CLEAR = "cleared"
	}
	
	export const Type = {
		LOCALSTORAGE,
		WEBSQL,
		INDEXEDDB,
		MEMORY_STORAGE
	}
}
