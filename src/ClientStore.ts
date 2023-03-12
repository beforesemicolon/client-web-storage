import 'core-js/actual/structured-clone';
import localforage from 'localforage';
import {Schema} from "./Schema";
import {MemoryStore} from "./MemoryStore";
import {
	ActionEventData,
	BeforeChangeHandler,
	Config,
	EventData,
	EventHandler,
	EventType,
	InterceptEventHandler,
	SchemaDefaultValues,
	SchemaObjectLiteral,
	StoreSubscriber,
	UnSubscriber
} from "./types";
import {defaultConfig} from "./default-config";
import {SchemaId} from "./CustomTypes/SchemaId";
import {objectToSchema} from "./utils/object-to-schema";
import {errorMessages} from "./utils/error-messages";
import {isValidObjectLiteral} from "./utils/is-valid-object-literal";
import {isObjectLiteral} from "./utils/is-object-literal";

localforage.defineDriver(MemoryStore());

const deepClone = structuredClone;

export class ClientStore<T> {
	#store: LocalForage;
	#config: Config;
	#storeName: string;
	#schema: Schema<T>;
	#subscribers: Set<StoreSubscriber<T>> = new Set();
	#eventHandlers: Map<EventType, Set<EventHandler<T>>> = new Map(Object
		.values(EventType)
		.map((event) => [event as EventType, new Set()])
	);
	#interceptEventHandlers: Map<EventType, InterceptEventHandler<T> | null> = new Map(Object
		.values(EventType)
		.map((event) => [event as EventType, null])
	);
	#beforeChangeHandler: BeforeChangeHandler<T> | null = null;
	#ready = false;
	#processes: Set<string> = new Set();
	
	constructor(storeName: string, schema: Schema<T> | SchemaObjectLiteral, config: Config = defaultConfig) {
		this.#storeName = storeName;
		this.#config = {...defaultConfig, ...config};
		
		if (!`${storeName}`.trim().length) {
			throw new Error(errorMessages.blankStoreName())
		}
		
		if (!(schema instanceof Schema)) {
			if (`${schema}` === '[object Object]') {
				schema = objectToSchema(storeName, schema);
			} else {
				throw new Error(errorMessages.invalidSchema())
			}
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
			this.#ready = true;
			this.#broadcast(EventType.READY, true);
		})
	}
	
	get schema() {
		return this.#schema;
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
		return this.#config.type;
	}
	
	/**
	 * name of the store
	 */
	get name() {
		return this.#storeName;
	}
	
	/**
	 * name of the app store belongs to
	 */
	get appName() {
		return this.#config.appName;
	}
	
	get processing() {
		return this.#processes.size > 0;
	}
	
	/**
	 * name of the item key used to id the items
	 */
	get idKeyName() {
		return (this.#config.idKeyName || defaultConfig.idKeyName) as keyof T;
	}
	
	/**
	 * name of the item key used track time the item was created
	 */
	get createdDateKeyName() {
		return (this.#config.createdDateKeyName || defaultConfig.createdDateKeyName) as keyof T;
	}
	
	/**
	 * name of the item key used track time the item was last updated
	 */
	get updatedDateKeyName() {
		return (this.#config.updatedDateKeyName || defaultConfig.updatedDateKeyName) as keyof T;
	}
	
	get processingEvents(): EventType[] {
		return Array.from(this.#processes, (event) => event.split('_')[0]) as EventType[];
	}
	
	/**
	 * the total count of items in the store
	 */
	async size() {
		return await this.#store.length();
	}
	
	/**
	 * subscribe to change in the store and react to them
	 * @param sub
	 */
	subscribe(sub: StoreSubscriber<T>): UnSubscriber {
		if (typeof sub === 'function') {
			this.#subscribers.add(sub)
			
			return () => {
				this.#subscribers.delete(sub)
			}
		}
		
		throw new Error(errorMessages.invalidSubHandler(sub));
	}
	
	on(event: EventType.PROCESSING_EVENTS, handler: (event: EventType[]) => void): UnSubscriber
	on(event: EventType.PROCESSING, handler: (processing: boolean) => void): UnSubscriber
	on(event: EventType.READY, handler: (ready: boolean) => void): UnSubscriber
	on(event: EventType.CREATED, handler: (data: T) => void): UnSubscriber
	on(event: EventType.UPDATED, handler: (data: T) => void): UnSubscriber
	on(event: EventType.LOADED, handler: (dataList: T[]) => void): UnSubscriber
	on(event: EventType.REMOVED, handler: (id: string) => void): UnSubscriber
	on(event: EventType.CLEARED, handler: (ids: string[]) => void): UnSubscriber
	on(event: EventType.ABORTED, handler: (data: ActionEventData<T>) => void): UnSubscriber
	on(event: EventType.ERROR, handler: (data: ActionEventData<T>) => void): UnSubscriber
	on(event: EventType, handler: any): UnSubscriber {
		if (typeof handler === 'function') {
			if (this.#eventHandlers.has(event)) {
				this.#eventHandlers.get(event)?.add(handler);
				
				return () => this.off(event, handler);
			}
			
			throw new Error(errorMessages.invalidEventName("ON", event));
		}
		
		throw new Error(errorMessages.invalidEventHandler("ON", event, handler));
	}
	
	off(event: EventType, handler: EventHandler<T>) {
		if (typeof handler === 'function') {
			if (this.#eventHandlers.has(event)) {
				this.#eventHandlers.get(event)?.delete(handler);
				return;
			}
			
			throw new Error(errorMessages.invalidEventName("OFF", event));
		}
		
		throw new Error(errorMessages.invalidEventHandler("OFF", event, handler));
	}
	
	/**
	 * intercept actions before they are made to the store
	 * to perform any action before it happens and gets broadcast as event
	 * @param handler
	 */
	beforeChange(handler: BeforeChangeHandler<T>): UnSubscriber {
		if (typeof handler === 'function') {
			this.#beforeChangeHandler = handler;
		} else {
			throw new Error(errorMessages.invalidEventHandler("function", "beforeChange", handler));
		}
		
		return () => {
			this.#beforeChangeHandler = null;
		}
	}
	
	intercept(event: EventType.CREATED, handler: (item: { data: T, id: string }) => Partial<T> | null | void | Promise<Partial<T> | null | void>): UnSubscriber;
	intercept(event: EventType.UPDATED, handler: (item: { data: T, id: string }) => Partial<T> | null | void | Promise<Partial<T> | null | void>): UnSubscriber;
	intercept(event: EventType.LOADED, handler: (items: { data: T[], id: null }) => Array<Partial<T>> | null | void | Promise<Array<Partial<T>> | null | void>): UnSubscriber;
	intercept(event: EventType.REMOVED, handler: (itemId: { data: string, id: string }) => null | void | Promise<null | void>): UnSubscriber;
	intercept(event: EventType.CLEARED, handler: (itemIds: { data: string[], id: null }) => null | void | Promise<null | void>): UnSubscriber;
	intercept(event: EventType, handler: any): UnSubscriber {
		if (typeof handler === 'function') {
			if (this.#interceptEventHandlers.has(event)) {
				this.#interceptEventHandlers.set(event, handler);
				
				return () => {
					this.#interceptEventHandlers.set(event, null);
				}
			}
			
			throw new Error(errorMessages.invalidEventName("INTERCEPT", event));
		}
		
		throw new Error(errorMessages.invalidEventHandler("INTERCEPT", event, handler));
	}
	
	/**
	 * updates or creates items in the store from an optionally provided list or a list
	 * returned by the LOADED interception handler
	 * @param dataList
	 * @return Array<item> | null
	 */
	async loadItems(dataList: Array<Partial<T>> = []): Promise<Array<Required<T> & SchemaDefaultValues>> {
		return this.#trackProcess(EventType.LOADED, async () => {
			try {
				const newItems = new Map();
				const {key} = this.#getDefaultKeys();
				
				for (let data of dataList) {
					if (!isValidObjectLiteral(data)) {
						throw new Error(errorMessages.invalidValueProvided("load", data))
					}
					
					const {item, id} = await this.#mergeExistingItemWithNewData(data)
					
					this.#validateData(
						item as T,
						(invalidFields) => errorMessages.missingOrInvalidFields(invalidFields, invalidFields.map(name => this.schema.getField(name) ?? undefined))
					);
					
					newItems.set(id, item);
				}
				
				let result = await this.#getWithResult(EventType.LOADED, Array.from(newItems.values()));
				
				if (result === null) {
					this.#broadcast(EventType.ABORTED, {
						action: EventType.LOADED,
						data: dataList
					});
					
					return null;
				}
				
				if (Array.isArray(result) && result.length) {
					
					for (let itemValue of result) {
						if (!isObjectLiteral(itemValue)) {
							throw new Error(errorMessages.invalidValueInterceptProvided("load", itemValue))
						}
						
						let itemId = itemValue[key];
						
						if (newItems.get(itemValue[key])) {
							newItems.set(itemValue[key], deepClone({...newItems.get(itemValue[key]), ...itemValue}))
						} else {
							const {item, id} = await this.#mergeExistingItemWithNewData(itemValue);
							newItems.set(id, item);
							itemId = id;
						}

						this.#validateData(
							newItems.get(itemId),
							(invalidFields) => errorMessages.missingOrInvalidFields(invalidFields, invalidFields.map(name => this.schema.getField(name) ?? undefined))
						);
					}
				}
				
				const setItems = await Promise.all(
					Array.from(newItems.values()).map(newItem => this.#store.setItem(`${newItem[key]}`, newItem))
				);
				
				this.#broadcast(EventType.LOADED, setItems);
				
				return setItems
			
			} catch (error: any) {
				this.#broadcast(EventType.ERROR, this.#createEventData(EventType.LOADED, dataList, null, error));
				throw error;
			}
		});
	}
	
	/**
	 * creates an item in the store given a partial item object
	 * @param data
	 * @return item | null
	 */
	async createItem(data: Partial<T>): Promise<Required<T> & SchemaDefaultValues> {
		return this.#trackProcess(EventType.CREATED, async () => {
			try {
				if (!isValidObjectLiteral(data)) {
					throw new Error(errorMessages.invalidValueProvided("create", data))
				}
				
				this.#validateData(
					data,
					(invalidFields) => errorMessages.missingOrInvalidFields(invalidFields, invalidFields.map(name => this.schema.getField(name) ?? undefined))
				);
				
				let {item, id} = await this.#mergeExistingItemWithNewData(data)
				
				const result = await this.#getWithResult(EventType.CREATED, item, id);
				
				if (result === null) {
					this.#broadcast(EventType.ABORTED, {
						action: EventType.CREATED,
						data: data
					});
					
					return null;
				}
				
				if (isObjectLiteral(result)) {
					item = deepClone({...item, ...result});
					
					this.#validateData(
						item,
						(invalidFields) => errorMessages.missingOrInvalidFields(invalidFields, invalidFields.map(name => this.schema.getField(name) ?? undefined))
					);
				}
				
				const setItem = await this.#store.setItem(String(item[this.idKeyName]), item);
				this.#broadcast(EventType.CREATED, setItem);
				
				return setItem;
			} catch (error: any) {
				this.#broadcast(EventType.ERROR, this.#createEventData(EventType.CREATED, data, null, error));
				throw error;
			}
		})
	}
	
	/**
	 * updates a single item in the store if it exists
	 * @param id
	 * @param data
	 * @return item | null
	 */
	async updateItem(id: string, data: Partial<T>): Promise<Required<T> & SchemaDefaultValues> {
		return this.#trackProcess(EventType.UPDATED, async () => {
			try {
				if (!isValidObjectLiteral(data)) {
					throw new Error(errorMessages.invalidValueProvided("update", data))
				}
				
				let existingItem = deepClone(await this.getItem(id) as T);
				
				if (existingItem) {
					let {item, id} = await this.#mergeExistingItemWithNewData(data, existingItem);
					
					this.#validateData(
						item,
						(invalidFields) => errorMessages.missingOrInvalidFields(invalidFields, invalidFields.map(name => this.schema.getField(name) ?? undefined))
					);
					
					const result = await this.#getWithResult(EventType.UPDATED, item, id);
					
					if (result === null) {
						this.#broadcast(EventType.ABORTED, {
							action: EventType.UPDATED,
							data
						});
						
						return null;
					}
					
					if (isObjectLiteral(result)) {
						item = deepClone(result as T);
						
						this.#validateData(
							item,
							(invalidFields) => errorMessages.missingOrInvalidFields(invalidFields, invalidFields.map(name => this.schema.getField(name) ?? undefined))
						);
					}
					
					const setItem = await this.#store.setItem(String(id), item);
					this.#broadcast(EventType.UPDATED, setItem);
					return setItem;
				}
			} catch (error: any) {
				this.#broadcast(EventType.ERROR, this.#createEventData(EventType.UPDATED, data, id, error));
				throw error;
			}
			
			return null;
		})
	}
	
	/**
	 * get a list of all items in the store
	 * @return Array<item>
	 */
	async getItems(): Promise<Array<Required<T>>> {
		return this.findItems(() => true);
	}
	
	/**
	 * get a single item in the store
	 * @param id
	 * @return item
	 */
	async getItem(id: string): Promise<Required<T> | null> {
		return this.#store.getItem(String(id));
	}
	
	/**
	 * removes a single item from the store if it exists
	 * @param id
	 * @return id | null
	 */
	async removeItem(id: string): Promise<string | null> {
		return this.#trackProcess(EventType.REMOVED, async () => {
			try {
				let item = await this.getItem(id) as T;
				
				if (item) {
					const result = await this.#getWithResult(EventType.REMOVED, id, id);
					
					if (result === null) {
						this.#broadcast(EventType.ABORTED, {
							action: EventType.REMOVED,
							data: id
						});
					} else {
						await this.#store.removeItem(`${id}`);
						this.#broadcast(EventType.REMOVED, id);
						return id;
					}
				}
			} catch (error: any) {
				this.#broadcast(EventType.ERROR, this.#createEventData(EventType.REMOVED, id, id, error));
				throw error;
			}
			
			return null;
		})
	}
	
	/**
	 * clear the store from all its items
	 * @return Array<id> | null
	 */
	async clear(): Promise<string[] | null> {
		return this.#trackProcess(EventType.CLEARED, async () => {
			const keys: string[] = (await this.#store.keys());
			
			try {
				const result = await this.#getWithResult(EventType.CLEARED, keys);
				
				if (result === null) {
					this.#broadcast(EventType.ABORTED, {
						action: EventType.CLEARED,
						data: keys
					});
				} else {
					await this.#store.clear();
					this.#broadcast(EventType.CLEARED, keys);
					return keys;
				}
			} catch (error: any) {
				this.#broadcast(EventType.ERROR, this.#createEventData(EventType.CLEARED, keys, null, error));
				throw error;
			}
			
			return null;
		})
	}
	
	/**
	 * find a single item in the store
	 * @param cb
	 * @return item
	 */
	async findItem(cb?: (value: Required<T>, key: string) => boolean): Promise<T | null> {
		if (typeof cb !== "function") {
		    return null
		}
		
		return await this.#store.iterate<Required<T>, any>((value, key) => {
			const matched = cb(value, key);
			if (matched) {
				return value;
			}
		}) ?? null;
	}
	
	/**
	 * find multiple items in the store
	 * @param cb
	 * @return Array<item>
	 */
	async findItems(cb?: (value: Required<T>, key: string) => boolean): Promise<Array<Required<T>>> {
		if (typeof cb !== "function") {
			return []
		}
		
		const items: Required<T>[] = [];
		
		await this.#store.iterate<Required<T>, any>((value, key) => {
			if (cb(value, key)) {
				value && items.push(value)
			}
		})
		
		return items;
	}
	
	async #mergeExistingItemWithNewData(data: Partial<T>, existingItem: T | null = null): Promise<{item: T, id: string}> {
		const {defaultKeys, key, createKey, updateKey} = this.#getDefaultKeys();
		const now = new Date();
		const itemId = data[key];
		let item: T = existingItem ?? await this.getItem(itemId as string) as T;
		
		if (item) {
			item = deepClone(item) as T;
			// @ts-ignore
			item[updateKey] = data[updateKey] ?? now;
		} else {
			item = this.schema.toValue();
			// @ts-ignore
			item[key] = itemId ?? (new SchemaId()).defaultValue;
			// @ts-ignore
			item[createKey] = data[createKey] ?? now;
			// @ts-ignore
			item[updateKey] = item[createKey];
		}
		
		for (const itemKey in data) {
			if (!defaultKeys.has(itemKey) && data.hasOwnProperty(itemKey)) {
				// @ts-ignore
				item[itemKey] = data[itemKey];
			}
		}
		
		return {
			item,
			id: item[key] as string
		};
	}
	
	#validateData(data: Partial<T> | T, getErr: (invalidFields: string[]) => string) {
		const {defaultKeys} = this.#getDefaultKeys();
		const invalidFields = this.schema.getInvalidSchemaDataFields(data as Record<string, any>, defaultKeys);
		
		if (invalidFields.length) {
			throw new Error(getErr(invalidFields))
		}
	}
	
	#broadcast(eventType: EventType, data: any) {
		this.#subscribers.forEach(sub => sub(eventType, data));
		this.#eventHandlers.get(eventType)?.forEach(handler => handler(data));
	}
	
	#createEventData(action: EventType, data: EventData<T>, id: string | null = null, error: Error | null = null): ActionEventData<EventData<T>> {
		return {
			action,
			data,
			id,
			error
		}
	}
	
	#getWithResult(event: EventType, data: EventData<T>, id: string | null = null) {
		const eventData = { data, id };
		const withHandler = this.#interceptEventHandlers.get(event);
		
		if(typeof withHandler === "function") {
			return withHandler(eventData);
		}
		
		if (this.#beforeChangeHandler) {
			return this.#beforeChangeHandler(event, eventData);
		}
	}
	
	#getDefaultKeys() {
		const key = this.idKeyName;
		const createKey = this.createdDateKeyName;
		const updateKey = this.updatedDateKeyName;
		
		return {
			key,
			createKey,
			updateKey,
			defaultKeys: new Set([key, createKey, updateKey]) as Set<string>
		}
	}
	
	async #trackProcess(type: EventType, cb: () => any) {
		const processId = `${type}_${Date.now()}`;
		this.#processes.add(processId);
		
		if (this.#processes.size === 1) { // should contain only the newly added one
			this.#broadcast(EventType.PROCESSING, true);
			this.#broadcast(EventType.PROCESSING_EVENTS, this.processingEvents);
		}
		
		try {
			const result = await cb();
			this.#processes.delete(processId);
			
			if (!this.processing) {
				this.#broadcast(EventType.PROCESSING, false);
				this.#broadcast(EventType.PROCESSING_EVENTS, this.processingEvents);
			}
			
			return result;
		} catch (e) {
			this.#processes.delete(processId);
			
			if (!this.processing) {
				this.#broadcast(EventType.PROCESSING, false);
				this.#broadcast(EventType.PROCESSING_EVENTS, this.processingEvents);
			}
			
			throw e;
		}
	}
}
