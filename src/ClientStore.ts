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
	#beforeChangeHandler: ClientStore.BeforeChangeHandler = () => true;
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
			this.#broadcast(ClientStore.EventType.READY, true);
		})
	}
	
	/**
	 * whether the store has successfully loaded
	 */
	get ready() {
		return this.#ready;
	}
	
	/**
	 * the type of the store
	 */
	get type() {
		return this.#store.driver();
	}
	
	/**
	 * name of the store
	 */
	get name() {
		return `${this.#config.appName}-${this.#storeName}`;
	}
	
	/**
	 * the total count of items in the store
	 */
	get size() {
		return this.#size;
	}
	
	#broadcast(eventType: ClientStore.EventType, data: any) {
		this.#subscribers.forEach(sub => sub(eventType, data))
	}
	
	/**
	 * subscribe to change in the store and react to them
	 * @param sub
	 */
	subscribe(sub: ClientStore.StoreSubscriber): ClientStore.UnSubscriber {
		if (typeof sub === 'function') {
			this.#subscribers.push(sub)
		}
		
		return () => {
			this.#subscribers = this.#subscribers.filter(s => s !== sub)
		}
	}
	
	/**
	 * intercept actions before they are made to the store
	 * to perform any action before it happens and gets broadcast as event
	 * @param handler
	 */
	beforeChange(handler: ClientStore.BeforeChangeHandler): ClientStore.UnSubscriber {
		if (typeof handler === 'function') {
			this.#beforeChangeHandler = handler;
		}
		
		return () => {
			this.#beforeChangeHandler = () => true;
		}
	}
	
	/**
	 * update or create items in bulk
	 * @param items
	 */
	async loadItems(items: Partial<T>[] = []): Promise<Array<T | null> | null> {
		if (items.length) {
			try {
				const shouldChange = await this.#beforeChangeHandler(ClientStore.EventType.LOADED, items);
				
				if (shouldChange === true) {
					const mappedItems = (await this.getItems()).reduce((acc, item) => ({...acc, [item.id as string]: item}), {} as {[k: string]: T});
					const newItems = [];
					
					for (let item of items) {
						let newItem = mappedItems[item.id as string] || this.#schema.toValue();
						
						for (const itemKey in item) {
							if (item.hasOwnProperty(itemKey)) {
								// @ts-ignore
								newItem[itemKey] = item[itemKey];
								
								await this.#store.setItem(`${newItem.id}`, newItem);
								
								newItems.push(newItem);
							}
						}
					}
					
					this.#size = await this.#store.length();
					this.#broadcast(ClientStore.EventType.LOADED, newItems);
					
					return newItems;
				} else {
					this.#broadcast(ClientStore.EventType.ABORTED, {
						action: ClientStore.EventType.LOADED,
						data: items
					});
				}
			} catch(error) {
				this.#broadcast(ClientStore.EventType.ERROR, {
					action: ClientStore.EventType.LOADED,
					error,
					data: items
				});
			}
		}
		
		return null;
	}
	
	/**
	 * create an item in the store
	 * @param value
	 */
	async createItem(value: Partial<T>): Promise<T | null> {
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
				const shouldChange = await this.#beforeChangeHandler(ClientStore.EventType.CREATED, newItem);
				
				if (shouldChange === true) {
					await this.#store.setItem(`${newItem.id}`, newItem);
					this.#size = await this.#store.length();
					this.#broadcast(ClientStore.EventType.CREATED, newItem);
					return newItem;
				} else {
					this.#broadcast(ClientStore.EventType.ABORTED, {
						action: ClientStore.EventType.CREATED,
						data: value
					});
				}
			} catch (error) {
				console.error(`Failed to create item "${JSON.stringify(value, null, 2)}"`, error);
				this.#broadcast(ClientStore.EventType.ERROR, {
					action: ClientStore.EventType.CREATED,
					error,
					data: value
				});
			}
			
			
			return null;
		}
		
		throw new Error(`Failed to create item. Field(s) "${invalidFields.join(', ')}" do not match the schema: ${this.#schema}`)
	}
	
	/**
	 * update a single item in the store
	 * @param id
	 * @param data
	 */
	async updateItem(id: T['id'], data: Partial<T>): Promise<T | null> {
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
			const shouldChange = await this.#beforeChangeHandler(ClientStore.EventType.UPDATED, updatedItem);
			
			if (shouldChange === true) {
				await this.#store.setItem(`${item.id}`, updatedItem);
				this.#broadcast(ClientStore.EventType.UPDATED, updatedItem);
				return updatedItem;
			} else {
				this.#broadcast(ClientStore.EventType.ABORTED, {
					action: ClientStore.EventType.UPDATED,
					data
				});
			}
		} catch (error) {
			console.error(`Failed to update item with id "${id}"`, error);
			this.#broadcast(ClientStore.EventType.ERROR, {
				action: ClientStore.EventType.UPDATED,
				error,
				data
			});
		}
		
		return null;
	}
	
	/**
	 * get a list of all items in the store
	 */
	async getItems(): Promise<Array<T>> {
		return this.findItems(() => true);
	}
	
	/**
	 * get a single item in the store
	 * @param id
	 */
	getItem(id: T['id']): Promise<T | null> {
		return this.#store.getItem(`${id}`);
	}
	
	/**
	 * remove a single item from the store
	 * @param id
	 */
	async removeItem(id: T['id']): Promise<true | null> {
		try {
			const shouldChange = await this.#beforeChangeHandler(ClientStore.EventType.DELETED, id as T['id']);
			
			if (shouldChange === true) {
				await this.#store.removeItem(`${id}`);
				this.#size = await this.#store.length();
				this.#broadcast(ClientStore.EventType.DELETED, id);
				
				return true;
			} else {
				this.#broadcast(ClientStore.EventType.ABORTED, {
					action: ClientStore.EventType.DELETED,
					data: id
				});
			}
		} catch (error) {
			console.error(`Failed to delete item with id "${id}"`, error);
			this.#broadcast(ClientStore.EventType.ERROR, {
				action: ClientStore.EventType.DELETED,
				error,
				data: id
			});
		}
		
		return null;
	}
	
	/**
	 * clear the store from all its items
	 */
	async clear(): Promise<string[] | null> {
		const keys: string[] = (await this.#store.keys());
		
		try {
			const shouldChange = await this.#beforeChangeHandler(ClientStore.EventType.CLEARED, keys);
			
			if (shouldChange) {
				await this.#store.clear();
				this.#size = await this.#store.length();
				this.#broadcast(ClientStore.EventType.CLEARED, keys);
				return keys;
			} else {
				this.#broadcast(ClientStore.EventType.ABORTED, {
					action: ClientStore.EventType.CLEARED,
					data: keys
				});
			}
		} catch (error) {
			console.error(`Failed to clear the store`, error);
			this.#broadcast(ClientStore.EventType.ERROR, {
				action: ClientStore.EventType.CLEARED,
				error,
				data: keys
			});
		}
		
		return null;
	}
	
	/**
	 * find a single item in the store
	 * @param cb
	 */
	async findItem(cb: (value: T, key: string) => boolean = () => false) {
		return this.#store.iterate<T, any>((value, key) => {
			const matched = cb(value, key);
			if (matched) {
				return value;
			}
		}) || null;
	}
	
	/**
	 * find multiple items in the store
	 * @param cb
	 */
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
	
	export type UnSubscriber = () => void;
	
	export type BeforeChangeHandler = (eventType: ClientStore.EventType, data: any) => Promise<boolean> | boolean;
	
	export interface Config {
		appName?: string;
		version?: LocalForageOptions['version'];
		type?: LocalForageOptions['driver'] | string;
		description?: LocalForageOptions['description'];
	}
	
	export enum EventType {
		READY = "ready",
		CREATED = "created",
		LOADED = "loaded",
		ERROR = "error",
		ABORTED = "aborted",
		DELETED = "deleted",
		UPDATED = "updated",
		CLEARED = "cleared"
	}
	
	export const Type = {
		LOCALSTORAGE,
		WEBSQL,
		INDEXEDDB,
		MEMORY_STORAGE
	}
}
