import localforage, {LOCALSTORAGE, WEBSQL, INDEXEDDB} from 'localforage';
import {Schema} from "./Schema";
import {MEMORY_STORAGE} from "./MemoryStore";

const defaultConfig = {
	version: 1,
	type: [INDEXEDDB, WEBSQL, LOCALSTORAGE],
	description: "",
	appName: "App",
}

export namespace ClientStore {
	export interface Config {
		appName?: string;
		version?: LocalForageOptions['version'];
		type?: LocalForageOptions['driver'] | string;
		description?: LocalForageOptions['description'];
	}
}

export enum ClientStoreEventType {
	CREATE = "created",
	DELETE = "deleted",
	UPDATE = "updated",
	CLEAR = "cleared"
}

export const ClientStoreType = {
	LOCALSTORAGE,
	WEBSQL,
	INDEXEDDB,
	MEMORY_STORAGE
}

export class ClientStore {
	#store: LocalForage;
	#config: ClientStore.Config;
	#storeName: string;
	#schema: Schema;
	#subscribers: ((eventType: ClientStoreEventType, id?: number | null) => void)[] = [];
	#ready = false;
	#size = 0;
	
	constructor(storeName: string, schema: Schema, config: ClientStore.Config = defaultConfig, whenReady = () => {
	}) {
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
			if (typeof whenReady === 'function') {
				whenReady();
			}
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
	
	#broadcast(eventType: ClientStoreEventType, id: number | null = null) {
		this.#subscribers.forEach(sub => sub(eventType, id))
	}
	
	subscribe(listener: () => void) {
		if (typeof listener === 'function') {
			this.#subscribers.push(listener)
		}
	}
	
	async createItem(value: any) {
		const invalidFields = this.#schema.getInvalidSchemaDataFields(value);
		
		if (!invalidFields.length) {
			const newItem = this.#schema.toValue();
			
			for (const valueKey in value) {
				if (value.hasOwnProperty(valueKey) && !this.#schema.defaultKeys.includes(valueKey)) {
					newItem[valueKey] = value[valueKey]
				}
			}
			
			try {
				await this.#store.setItem(`${newItem.id}`, newItem);
				this.#size = await this.#store.length();
			} catch (error) {
				console.error(`Failed to create item "${value}"`, error);
			}
			
		  this.#broadcast(ClientStoreEventType.CREATE, newItem.id as number);
			
			return newItem;
		}
		
		throw new Error(`Failed to create item. Field(s) "${invalidFields.join(', ')}" do not match the schema: ${this.#schema}`)
	}
	
	async updateItem(id: number, data: any) {
		for (let dataKey in data) {
			if (data.hasOwnProperty(dataKey) && !this.#schema.defaultKeys.includes(dataKey) && !this.#schema.isValidFieldValue(dataKey, data[dataKey])) {
				throw new Error(`Failed to update item "${id}". Key "${dataKey}" is unknown or has invalid value type: ${this.#schema.getField(dataKey)}`)
			}
		}
		
		const item: any = await this.getItem(id);
		const updatedItem = {
			...item,
			...data,
			lastUpdatedDate: new Date(),
			id: item.id
		};
		
		try {
			await this.#store.setItem(`${item.id}`, updatedItem);
		} catch (error) {
			console.error(`Failed to update item "${item}"`, error);
		}
		
		this.#broadcast(ClientStoreEventType.UPDATE, id);
		
		return updatedItem;
	}
	
	async getItems() {
		const keys = await this.#store.keys();
		return Promise.all(
			keys.map(key => this.#store.getItem(key))
		)
	}
	
	getItem(id: number) {
		return this.#store.getItem(`${id}`)
	}
	
	removeItem(id: number) {
		return this.#store.removeItem(`${id}`).then(async () => {
			this.#size = await this.#store.length();
			this.#broadcast(ClientStoreEventType.DELETE, id)
		})
	}
	
	clear() {
		return this.#store.clear().then(async () => {
			this.#size = await this.#store.length();
			this.#broadcast(ClientStoreEventType.CLEAR);
		})
	}
	
	async findItem(cb: (value: any, key: string) => boolean = () => false) {
		return this.#store.iterate((value, key) => {
			const m = cb(value, key);
			if (m) {
				return value;
			}
		}) || null;
	}
	
	async findAllItems(cb: (value: any, key: string) => boolean = () => false) {
		const items: any[] = [];
		
		await this.#store.iterate((value, key) => {
			if (cb(value, key)) {
				value && items.push(value)
			}
		})
		
		return items;
	}
}
