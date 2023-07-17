import "fake-indexeddb/auto";
import {ClientStore} from "./ClientStore";
import {Schema} from "./Schema";
import {MEMORYSTORAGE} from "./MemoryStore";
import {Config, EventType} from "./types";
import {SchemaValue} from "./SchemaValue";
import {SchemaId} from "./CustomTypes/SchemaId";
import {INDEXEDDB, LOCALSTORAGE} from "localforage";
import {generateUUID} from "./utils/generate-uuid";
import {OneOf} from "./CustomTypes/OneOf";
import {Null} from "./CustomTypes/Null";

interface User {
	name: string;
	avatar?: string;
}

interface UserExtended {
	name: string;
	avatar?: string;
	id?: string;
	dateCreated?: Date;
	dateUpdated?: Date;
}

interface ToDo {
	name: string;
	description?: string;
	user: User;
	selected?: boolean;
	state?: string;
}

interface ToDoExtended {
	name: string;
	description?: string;
	user: User;
	selected?: boolean;
	state?: string;
	id?: string;
	dateCreated?: Date;
	dateUpdated?: Date;
}

describe('ClientStore', () => {
	afterEach(() => {
		jest.clearAllMocks();
	})
	
	describe('should create', () => {
		it('in-memory store', () => {
			const todos = new ClientStore(`todo-${generateUUID()}`, {name: String});
			
			expect(todos.type).toBe(MEMORYSTORAGE);
			expect(todos.name).toMatch(/todo-.+/);
			expect(todos.appName).toBe("App");
			expect(todos.schema.toJSON()).toEqual({
				"name": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				}
			});
			expect(todos.ready).toBe(false);
		});
		
		it('in-memory store with full config and schema object', () => {
			const todos = new ClientStore(`todo-${generateUUID()}`, getTodoSchemaObject(), {
				appName: "Todo App",
				idKeyName: "_id",
				createdDateKeyName: "createDate",
				updatedDateKeyName: "updateDate"
			});
			
			expect(todos.type).toBe(MEMORYSTORAGE);
			expect(todos.name).toMatch(/todo-.+/);
			expect(todos.appName).toBe("Todo App");
			expect(todos.idKeyName).toBe("_id");
			expect(todos.createdDateKeyName).toBe("createDate");
			expect(todos.updatedDateKeyName).toBe("updateDate");
			expect(todos.schema.toJSON()).toEqual({
				"description": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				},
				"name": {
					"defaultValue": "",
					"required": true,
					"type": "String"
				},
				"selected": {
					"defaultValue": false,
					"required": false,
					"type": "Boolean"
				},
				"state": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				},
				"user": {
					"defaultValue": {
						"avatar": "",
						"name": ""
					},
					"required": true,
					"type": "Schema<user>"
				}
			});
		});
		
		it('in-memory store with full config and schema instance', () => {
			const todos = new ClientStore(`todo-${generateUUID()}`, getTodoSchemaInstance(), {
				appName: "Todo App",
				idKeyName: "_id",
				createdDateKeyName: "createDate",
				updatedDateKeyName: "updateDate"
			});
			
			expect(todos.type).toBe(MEMORYSTORAGE);
			expect(todos.name).toMatch(/todo-.+/);
			expect(todos.appName).toBe("Todo App");
			expect(todos.idKeyName).toBe("_id");
			expect(todos.createdDateKeyName).toBe("createDate");
			expect(todos.updatedDateKeyName).toBe("updateDate");
			expect(todos.schema.toJSON()).toEqual({
				"description": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				},
				"name": {
					"defaultValue": "",
					"required": true,
					"type": "String"
				},
				"selected": {
					"defaultValue": false,
					"required": false,
					"type": "Boolean"
				},
				"state": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				},
				"user": {
					"defaultValue": {
						"avatar": "",
						"name": ""
					},
					"required": true,
					"type": "Schema<user>"
				}
			});
		});
		
		it('localStorage store', () => {
			const todos = new ClientStore(`todo-${generateUUID()}`, {name: String}, {
				type: MEMORYSTORAGE
			});
			
			expect(todos.type).toBe(MEMORYSTORAGE);
			expect(todos.name).toMatch(/todo-.+/);
			expect(todos.appName).toBe("App");
			expect(todos.schema.toJSON()).toEqual({
				"name": {
					"defaultValue": "",
					"required": false,
					"type": "String"
				}
			});
		});
		
		it('multiple stores instances to the same table', async () => {
			const todoStore1 = new ClientStore("todo", {
				$name: String
			})
			const todoStore2 = new ClientStore("todo", {
				$name: String,
				description: "No Description"
			})
			
			await todoStore2.createItem({
				name: "sample"
			})
			
			expect(todoStore1 === todoStore2).toBeFalsy();
			await expect(todoStore1.size()).resolves.toBe(1)
			await expect(todoStore2.size()).resolves.toBe(1)
		});
		
		it('multiple stores instances to the same table with different storage types', async () => {
			const todoStore1 = new ClientStore("todo", {
				$name: String
			}, {type: INDEXEDDB})
			const todoStore2 = new ClientStore("todo", {
				$name: String,
				description: "No Description"
			}, {type: LOCALSTORAGE})
			
			await todoStore2.createItem({
				name: "sample"
			})
			
			expect(todoStore1 === todoStore2).toBeFalsy();
			await expect(todoStore1.size()).resolves.toBe(0)
			await expect(todoStore2.size()).resolves.toBe(1)
		});
		
		it('multiple stores instances to different apps', async () => {
			const todoStore1 = new ClientStore("todo", {
				$name: String
			}, {appName: "Test1"})
			const todoStore2 = new ClientStore("todo", {
				$name: String,
				description: "No Description"
			}, {appName: "Test2"})
			
			await todoStore2.createItem({
				name: "sample"
			})
			
			expect(todoStore1 === todoStore2).toBeFalsy();
			await expect(todoStore1.size()).resolves.toBe(0)
			await expect(todoStore2.size()).resolves.toBe(1)
		});
	});
	
	describe('should throw error', () => {
		const partialItem = {name: "go to gym", user: {name: "John Doe"}};
		let store: ClientStore<ToDo>;
		
		beforeAll(() => {
			store = createDefaultTodoStoreWithSchemaObject();
		})
		
		afterEach(async () => {
			await store.clear();
		})
		
		it('if created without or invalid schema', () => {
			// @ts-ignore
			expect(() => new ClientStore("todo")).toThrowError('Invalid "Schema" instance or object')
			// @ts-ignore
			expect(() => new ClientStore("todo", () => {})).toThrowError('Invalid "Schema" instance or object')
			// @ts-ignore
			expect(() => new ClientStore("todo", null)).toThrowError('Invalid "Schema" instance or object')
		});
		
		it('if created with invalid schema', () => {
			expect(() => new ClientStore("todo", {
				// @ts-ignore
				name: Function
			})).toThrowError('Unsupported Schema Type => key: "name", type: "Function" (estimated)')
			
			expect(() => new ClientStore("todo", new Schema("todo", {
				// @ts-ignore
				name: new SchemaValue(Function)
			}))).toThrowError('Invalid SchemaValue type provided. Received "Function"')
		});
		
		it('if created with blank name', () => {
			expect(() => new ClientStore("", {})).toThrowError('ClientStore must have a non-blank name')
		});
		
		it('if invalid fields on create', async () => {
			// @ts-ignore
			await expect(() => store.createItem({name: 12}))
				.rejects.toThrowError('Missing or invalid field types for "name, user" keys. Should be')
		});
		
		it('if unknown field is provided on create', async () => {
			// @ts-ignore
			await expect(() => store.createItem({...partialItem, item: 12}))
				.rejects.toThrowError('Missing or invalid field types for "item" keys. Should be [item, undefined]')
		});
		
		it('if invalid value on create', async () => {
			// @ts-ignore
			await expect(() => store.createItem(null))
				.rejects.toThrowError('Invalid "value" provided to create item => null')
		});
		
		it('if invalid fields on update', async () =>{
			const item = await store.createItem(partialItem)
			
			// @ts-ignore
			await expect(() => store.updateItem(item._id, {name: 12}))
				.rejects.toThrowError('Missing or invalid field types for "name" keys. Should be')
		});
		
		it('if unknown field is provided on update', async () =>{
			const item = await store.createItem(partialItem)
			
			// @ts-ignore
			await expect(() => store.updateItem(item._id, {item: 12}))
				.rejects.toThrowError('Missing or invalid field types for "item" keys. Should be [item, undefined]')
		});
		
		it('if invalid value on update', async () =>{
			const item = await store.createItem(partialItem)
			
			// @ts-ignore
			await expect(() => store.updateItem(item._id, null))
				.rejects.toThrowError('Invalid "value" provided to update item => null')
		});
		
		it('if invalid fields on load', async () =>{
			// @ts-ignore
			await expect(() => store.loadItems([{name: 12}]))
				.rejects.toThrowError('Missing or invalid field types for "name, user.name" keys. Should be ')
		});
		
		it('if unknown field is provided on load', async () =>{
			// @ts-ignore
			await expect(() => store.loadItems([{...partialItem, item: 12}]))
				.rejects.toThrowError('Missing or invalid field types for "item" keys. Should be [item, undefined]')
		});
		
		it('if invalid value on load', async () => {
			// @ts-ignore
			await expect(() => store.loadItems([null]))
				.rejects.toThrowError('Invalid "value" provided to load item => null')
		});
		
		it('if create item fails', async () => {
			const clearIntercept = store.intercept(EventType.CREATED, () => {
				throw new Error("failed")
			})
			
			await expect(() => store.createItem(partialItem))
				.rejects.toThrowError('failed')
			
			clearIntercept()
		});
		
		it('if create item fails intercept data validation', async () => {
			// @ts-ignore
			const clearIntercept = store.intercept(EventType.CREATED, () => {
				return {
					unknown: 12
				}
			})
			
			await expect(() => store.createItem(partialItem))
				.rejects.toThrowError('Missing or invalid field types for "unknown" keys. Should be [unknown, undefined]')
			
			clearIntercept()
		});
		
		it('if update item fails', async () =>{
			const item = await store.createItem(partialItem)
			
			const clearIntercept = store.intercept(EventType.UPDATED, () => {
				throw new Error("failed")
			})
			
			await expect(() => store.updateItem(item._id, {name: "different"}))
				.rejects.toThrowError('failed')
			
			clearIntercept()
		});
		
		it('if update item fails intercept data validation', async () =>{
			const item = await store.createItem(partialItem)
			
			// @ts-ignore
			const clearIntercept = store.intercept(EventType.UPDATED, () => {
				return {
					unknown: 12
				}
			})
			
			await expect(() => store.updateItem(item._id, {name: "different"}))
				.rejects.toThrowError('Missing or invalid field types for "unknown, name, user" keys. Should be [unknown, undefined]')
			
			clearIntercept()
		});
		
		it('if remove item fails', async () => {
			const item = await store.createItem(partialItem)
			
			const clearIntercept = store.intercept(EventType.REMOVED, () => {
				throw new Error("failed")
			})
			
			await expect(() => store.removeItem(item._id))
				.rejects.toThrowError('failed')
			
			clearIntercept()
		});
		
		it('if clear items fails', async () => {
			await store.createItem(partialItem)
			
			const clearIntercept = store.intercept(EventType.CLEARED, () => {
				throw new Error("failed")
			})
			
			await expect(() => store.clear())
				.rejects.toThrowError('failed')
			
			clearIntercept()
		});
		
		it('if loading items fails', async () => {
			const clearIntercept = store.intercept(EventType.LOADED, () => {
				throw new Error("failed")
			})
			
			await expect(() => store.loadItems([partialItem]))
				.rejects.toThrowError('failed')
			
			clearIntercept()
		});
		
		it('if loading items fails intercept data validation', async () => {
			const clearIntercept = store.intercept(EventType.LOADED, () => {
				return [{}]
			})
			
			await expect(() => store.loadItems([partialItem]))
				.rejects.toThrowError('Missing or invalid field types for "name, user.name" keys. Should be')
			
			clearIntercept()
		});
		
		it('if loading items fails intercept data is not a valid data', async () => {
			// @ts-ignore
			const clearIntercept = store.intercept(EventType.LOADED, () => {
				return [undefined]
			})
			
			await expect(() => store.loadItems([partialItem]))
				.rejects.toThrowError('Invalid "value" returned via load intercept handler - item => undefined')
			
			clearIntercept()
		});
		
		it('if invalid subscribe handler provided', () => {
			// @ts-ignore
			expect(() => store.subscribe(null)).toThrowError('Received invalid "subscribe" handler => null')
		});
		
		it('if invalid beforeChange handler provided', () => {
			// @ts-ignore
			expect(() => store.beforeChange(null)).toThrowError('Received invalid function "beforeChange" event handler => null')
		});
		
		it('if invalid ON handler or event type provided', () => {
			// @ts-ignore
			expect(() => store.on("event", () => {})).toThrowError('Received unknown ON "event" event')
			// @ts-ignore
			expect(() => store.on(EventType.CREATED, null)).toThrowError('Received invalid ON "created" event handler => null')
		});
		
		it('if invalid OFF handler or event type provided', () => {
			// @ts-ignore
			expect(() => store.off("event", () => {})).toThrowError('Received unknown OFF "event" event')
			// @ts-ignore
			expect(() => store.off(EventType.CREATED, null)).toThrowError('Received invalid OFF "created" event handler => null')
		});
		
		it('if invalid INTERCEPT handler or event type provided', () => {
			// @ts-ignore
			expect(() => store.intercept("event", () => {})).toThrowError('Received unknown INTERCEPT "event" event')
			// @ts-ignore
			expect(() => store.intercept(EventType.CREATED, null)).toThrowError('Received invalid INTERCEPT "created" event handler => null')
		});
	})
	
	it("should unsubscribe correctly", async () => {
		const store = createDefaultTodoStoreWithSchemaObject();
		
		const sub = jest.fn();
		
		const unsub = store.subscribe(sub);
		
		await store.createItem({
			name: "test this",
			user: {
				name: "John Doe"
			}
		})
		
		expect(sub).toHaveBeenCalledTimes(6);
		
		sub.mockClear();
		
		unsub();
		
		await store.createItem({
			name: "test this again",
			user: {
				name: "John Doe"
			}
		})
		
		expect(sub).toHaveBeenCalledTimes(0);
	})
	
	it("should un-listen to event correctly", async () => {
		const store = createDefaultTodoStoreWithSchemaObject();
		
		const handler = jest.fn();
		
		const unListen = store.on(EventType.CREATED, handler);
		
		await store.createItem({
			name: "test this",
			user: {
				name: "John Doe"
			}
		})
		
		expect(handler).toHaveBeenCalledTimes(1);
		
		handler.mockClear();
		
		unListen();
		
		await store.createItem({
			name: "test this again",
			user: {
				name: "John Doe"
			}
		})
		
		expect(handler).toHaveBeenCalledTimes(0);
	})
	
	it('should return null if item does not exist', async () => {
		const todoStore = createDefaultTodoStoreWithSchemaInstance();
		
		expect(await todoStore.getItem('some-id')).toEqual(null)
	});
	
	it('should return empty array if store has no items', async () => {
		const todoStore = createDefaultTodoStoreWithSchemaInstance();
		
		expect(await todoStore.getItems()).toEqual([])
	});
	
	describe('should CRUD store', () => {
		const crud = async (todoStore: ClientStore<ToDoExtended | ToDo>) => {
			const {
				readyEventHandler,
				processingEventHandler,
				createEventHandler,
				deleteEventHandler,
				updateEventHandler,
				subscribeHandler,
				beforeChangeHandler
			} = getHandlersMock();
			todoStore.beforeChange(beforeChangeHandler);
			todoStore.subscribe(subscribeHandler);
			todoStore.on(EventType.READY, readyEventHandler);
			todoStore.on(EventType.PROCESSING, processingEventHandler);
			todoStore.on(EventType.CREATED, createEventHandler);
			todoStore.on(EventType.REMOVED, deleteEventHandler);
			todoStore.on(EventType.UPDATED, updateEventHandler);
			
			const newTodo = await todoStore.createItem({
				name: "Buy groceries",
				user: {
					name: "John Doe",
					avatar: ""
				}
			});
			
			expect(beforeChangeHandler).toHaveBeenCalledTimes(1)
			expect(subscribeHandler).toHaveBeenCalledTimes(6)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.READY, true)
			expect(readyEventHandler).toHaveBeenCalledWith(true)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, true)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [EventType.CREATED])
			expect(processingEventHandler).toHaveBeenCalledWith(true)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.CREATED, newTodo)
			expect(createEventHandler).toHaveBeenCalledWith(newTodo)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, false)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [])
			expect(processingEventHandler).toHaveBeenCalledWith(false)
			
			beforeChangeHandler.mockClear()
			subscribeHandler.mockClear()
			processingEventHandler.mockClear()
			
			expect(newTodo).toEqual({
				[todoStore.createdDateKeyName]: expect.any(Date),
				[todoStore.idKeyName]: expect.any(String),
				[todoStore.updatedDateKeyName]: expect.any(Date),
				"description": "",
				"name": "Buy groceries",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			})
			
			expect(await todoStore.getItem(<string>newTodo[todoStore.idKeyName])).toEqual(newTodo)
			
			const updatedTodo = await todoStore.updateItem(<string>newTodo[todoStore.idKeyName], {
				name: "Buy tomatoes and potatoes",
				description: "sweet potatoes and green tomatoes"
			})
			
			expect(beforeChangeHandler).toHaveBeenCalledTimes(1)
			expect(subscribeHandler).toHaveBeenCalledTimes(5)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, true)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [EventType.UPDATED])
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.UPDATED, updatedTodo)
			expect(updateEventHandler).toHaveBeenCalledWith(updatedTodo)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, false)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [])
			
			beforeChangeHandler.mockClear()
			subscribeHandler.mockClear()
			
			expect(updatedTodo).toEqual({
				[todoStore.createdDateKeyName]: expect.any(Date),
				[todoStore.idKeyName]: expect.any(String),
				[todoStore.updatedDateKeyName]: expect.any(Date),
				"description": "sweet potatoes and green tomatoes",
				"name": "Buy tomatoes and potatoes",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			})
			expect(`${updatedTodo[todoStore.createdDateKeyName]}`).toEqual(`${newTodo[todoStore.createdDateKeyName]}`)
			expect( `${updatedTodo[todoStore.updatedDateKeyName]}`).toEqual(`${newTodo[todoStore.updatedDateKeyName]}`)
			
			const res = await todoStore.removeItem(<string>newTodo[todoStore.idKeyName]);
			
			expect(beforeChangeHandler).toHaveBeenCalledTimes(1)
			expect(subscribeHandler).toHaveBeenCalledTimes(5)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, true)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [EventType.REMOVED])
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.REMOVED, <string>newTodo[todoStore.idKeyName])
			expect(deleteEventHandler).toHaveBeenCalledWith(<string>newTodo[todoStore.idKeyName])
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, false)
			expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [])
			
			expect(res).toBe(<string>newTodo[todoStore.idKeyName]);
			
			todoStore.off(EventType.READY, readyEventHandler);
			todoStore.off(EventType.PROCESSING, processingEventHandler);
			todoStore.off(EventType.CREATED, createEventHandler);
			todoStore.off(EventType.REMOVED, deleteEventHandler);
			todoStore.off(EventType.UPDATED, updateEventHandler);
		}
		
		describe('In memory store', () => {
			it('with default keys and schema object', async () => {
				await crud(createDefaultTodoStoreWithSchemaObject())
			});
			
			it('with custom keys keys and schema object', async () => {
				await crud(createDefaultTodoStoreWithExtendedSchemaObject({
					idKeyName: "id",
					createdDateKeyName: "dateCreated",
					updatedDateKeyName: "dateUpdated"
				}))
			});
			
			it('with default keys and schema instance', async () => {
				await crud(createDefaultTodoStoreWithSchemaInstance())
			});
			
			it('with custom keys keys and schema instance', async () => {
				await crud(createDefaultTodoStoreWithExtendedSchemaInstance({
					idKeyName: "id",
					createdDateKeyName: "dateCreated",
					updatedDateKeyName: "dateUpdated"
				}))
			});
		})
		
		describe('IndexedDb store', () => {
			it('with default keys and schema object', async () => {
				await crud(createDefaultTodoStoreWithSchemaObject({type: INDEXEDDB}))
			});
			
			it('with custom keys keys and schema object', async () => {
				await crud(createDefaultTodoStoreWithExtendedSchemaObject({
					idKeyName: "id",
					createdDateKeyName: "dateCreated",
					updatedDateKeyName: "dateUpdated",
					type: INDEXEDDB
				}))
			});
			
			it('with default keys and schema instance', async () => {
				await crud(createDefaultTodoStoreWithSchemaInstance({type: INDEXEDDB}))
			});
			
			it('with custom keys keys and schema instance', async () => {
				await crud(createDefaultTodoStoreWithExtendedSchemaInstance({
					idKeyName: "id",
					createdDateKeyName: "dateCreated",
					updatedDateKeyName: "dateUpdated",
					type: INDEXEDDB
				}))
			});
		})
	})
	
	it('should handle loading items', async () => {
		const {
			readyEventHandler,
			processingEventHandler,
			loadEventHandler,
			subscribeHandler,
			beforeChangeHandler
		} = getHandlersMock();
		const todoStore = createDefaultTodoStoreWithSchemaInstance();
		todoStore.beforeChange(beforeChangeHandler);
		todoStore.subscribe(subscribeHandler);
		todoStore.on(EventType.LOADED, loadEventHandler);
		todoStore.on(EventType.READY, readyEventHandler);
		todoStore.on(EventType.PROCESSING, processingEventHandler);
		
		const user = {
			name: "John Doe",
			avatar: ""
		};
		
		expect(await todoStore.getItems()).toEqual([])
		
		const items = await todoStore.loadItems([
			{
				name: "Buy groceries",
				user
			},
			{
				name: "Go to gym",
				user
			},
			{
				name: "Pick kids up",
				user
			}
		]);
		
		expect(beforeChangeHandler).toHaveBeenCalledTimes(1)
		expect(subscribeHandler).toHaveBeenCalledTimes(6)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.READY, true)
		expect(readyEventHandler).toHaveBeenCalledWith(true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [EventType.LOADED])
		expect(processingEventHandler).toHaveBeenCalledWith(true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.LOADED, items)
		expect(loadEventHandler).toHaveBeenCalledWith(items)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, false)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [])
		expect(processingEventHandler).toHaveBeenCalledWith(false)

		beforeChangeHandler.mockClear()
		subscribeHandler.mockClear()
		loadEventHandler.mockClear()
		readyEventHandler.mockClear()
		processingEventHandler.mockClear()

		expect(items).toEqual([
			{
				"_createdDate": expect.any(Date),
				"_id": expect.any(String),
				"_lastUpdatedDate": expect.any(Date),
				"description": "",
				"name": "Buy groceries",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			},
			{
				"_createdDate": expect.any(Date),
				"_id": expect.any(String),
				"_lastUpdatedDate": expect.any(Date),
				"description": "",
				"name": "Go to gym",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			},
			{
				"_createdDate": expect.any(Date),
				"_id": expect.any(String),
				"_lastUpdatedDate": expect.any(Date),
				"description": "",
				"name": "Pick kids up",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			}
		])

		expect(await todoStore.getItems()).toEqual(items);

		// should update existing items
		const updatedItems = await todoStore.loadItems(items.map(item => ({
			_id: item._id,
			description: "today's todo"
		})));

		expect(beforeChangeHandler).toHaveBeenCalledTimes(1)
		expect(subscribeHandler).toHaveBeenCalledTimes(5)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [EventType.LOADED])
		expect(processingEventHandler).toHaveBeenCalledWith(true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.LOADED, updatedItems)
		expect(loadEventHandler).toHaveBeenCalledWith(updatedItems)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, false)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [])
		expect(processingEventHandler).toHaveBeenCalledWith(false)

		expect(updatedItems.every(item => item.description === "today's todo")).toBeTruthy()

		expect(items[0]._createdDate).toEqual(updatedItems[0]._createdDate)
		expect(items[1]._createdDate).toEqual(updatedItems[1]._createdDate)
		expect(items[2]._createdDate).toEqual(updatedItems[2]._createdDate)
		expect(items[0]._lastUpdatedDate).not.toEqual(updatedItems[0]._lastUpdatedDate)
		expect(items[1]._lastUpdatedDate).not.toEqual(updatedItems[1]._lastUpdatedDate)
		expect(items[2]._lastUpdatedDate).not.toEqual(updatedItems[2]._lastUpdatedDate)

		await expect(todoStore.size()).resolves.toBe(3);

		expect(updatedItems).toEqual([
			{
				"_createdDate": expect.any(Date),
				"_id": expect.any(String),
				"_lastUpdatedDate": expect.any(Date),
				"description": "today's todo",
				"name": "Buy groceries",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			},
			{
				"_createdDate": expect.any(Date),
				"_id": expect.any(String),
				"_lastUpdatedDate": expect.any(Date),
				"description": "today's todo",
				"name": "Go to gym",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			},
			{
				"_createdDate": expect.any(Date),
				"_id": expect.any(String),
				"_lastUpdatedDate": expect.any(Date),
				"description": "today's todo",
				"name": "Pick kids up",
				"selected": false,
				"state": "",
				"user": {
					"avatar": "",
					"name": "John Doe"
				}
			}
		])
		
		beforeChangeHandler.mockClear()
		subscribeHandler.mockClear()
		loadEventHandler.mockClear()
		readyEventHandler.mockClear()
		processingEventHandler.mockClear()

		todoStore.off(EventType.LOADED, loadEventHandler);
		todoStore.off(EventType.READY, readyEventHandler);
		todoStore.off(EventType.PROCESSING, processingEventHandler);
	});
	
	it('should load items with empty list provided', async () => {
		const {
			readyEventHandler,
			processingEventHandler,
			subscribeHandler,
			loadEventHandler,
			beforeChangeHandler
		} = getHandlersMock();
		const todoStore = createDefaultTodoStoreWithSchemaInstance();
		todoStore.beforeChange(beforeChangeHandler);
		todoStore.subscribe(subscribeHandler);
		todoStore.on(EventType.LOADED, loadEventHandler);
		todoStore.on(EventType.READY, readyEventHandler);
		todoStore.on(EventType.PROCESSING, processingEventHandler);
		
		const user = {
			name: "John Doe",
			avatar: ""
		};
		
		const fetcher = jest.fn(async () => ([
			{
				name: "Buy groceries",
				user
			},
			{
				name: "Go to gym",
				user
			},
			{
				name: "Pick kids up",
				user
			}
		]));
		
		const clearIntercept = todoStore.intercept(EventType.LOADED, ({data}) => {
			if (!data.length) {
			  return fetcher();
			}
		})
		
		await expect(todoStore.size()).resolves.toBe(0);
		
		const items = await todoStore.loadItems();
		
		expect(beforeChangeHandler).toHaveBeenCalledTimes(0)
		expect(subscribeHandler).toHaveBeenCalledTimes(6)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.READY, true)
		expect(readyEventHandler).toHaveBeenCalledWith(true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [EventType.LOADED])
		expect(processingEventHandler).toHaveBeenCalledWith(true)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.LOADED, items)
		expect(loadEventHandler).toHaveBeenCalledWith(items)
		expect(fetcher).toHaveBeenCalled()
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING, false)
		expect(subscribeHandler).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [])
		expect(processingEventHandler).toHaveBeenCalledWith(false)
		
		await expect(todoStore.size()).resolves.toBe(3);
		
		clearIntercept();
		todoStore.off(EventType.LOADED, loadEventHandler);
		todoStore.off(EventType.READY, readyEventHandler);
		todoStore.off(EventType.PROCESSING, processingEventHandler);
	});
	
	describe('should intercept', () => {
		describe('and abort', () => {
			it('create action', async () => {
				const {
					processingEventHandler,
					createEventHandler,
					abortEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ABORTED, abortEventHandler);
				todoStore.on(EventType.CREATED, createEventHandler);
				todoStore.intercept(EventType.CREATED, () => {
					return null;
				})
				
				const data = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const res = await todoStore.createItem(data);
				
				expect(beforeChangeHandler).not.toHaveBeenCalled();
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(createEventHandler).not.toHaveBeenCalled();
				expect(abortEventHandler).toHaveBeenCalledWith({"action": EventType.CREATED, data})
				expect(res).toBeNull()
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.CREATED, createEventHandler);
				todoStore.off(EventType.ABORTED, abortEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('update action', async () => {
				const {
					processingEventHandler,
					abortEventHandler,
					updateEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ABORTED, abortEventHandler);
				todoStore.on(EventType.UPDATED, updateEventHandler);
				todoStore.intercept(EventType.UPDATED, () => {
					return null;
				})
				
				const item = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const newTodo = await todoStore.createItem(item);
				
				processingEventHandler.mockClear()
				
				const data = {
					name: "go to gym at 2"
				}
				
				const res = await todoStore.updateItem(newTodo._id, data)
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.CREATED, {
					data: newTodo,
					id: newTodo._id
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(updateEventHandler).not.toHaveBeenCalled();
				expect(abortEventHandler).toHaveBeenCalledWith({"action": EventType.UPDATED, data})
				expect(res).toBeNull()
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.UPDATED, updateEventHandler);
				todoStore.off(EventType.ABORTED, abortEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('remove action', async () => {
				const {
					processingEventHandler,
					deleteEventHandler,
					abortEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ABORTED, abortEventHandler);
				todoStore.on(EventType.REMOVED, deleteEventHandler);
				
				todoStore.intercept(EventType.REMOVED, () => {
					return null;
				})
				
				const item = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const newTodo = await todoStore.createItem(item);
				
				processingEventHandler.mockClear()
				
				const res = await todoStore.removeItem(newTodo._id)
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.CREATED, {
					data: newTodo,
					id: newTodo._id
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(deleteEventHandler).not.toHaveBeenCalled();
				expect(abortEventHandler).toHaveBeenCalledWith({"action": EventType.REMOVED, data: newTodo._id})
				expect(res).toBeNull()
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.REMOVED, deleteEventHandler);
				todoStore.off(EventType.ABORTED, abortEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('load action', async () => {
				const {
					abortEventHandler,
					processingEventHandler,
					loadEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ABORTED, abortEventHandler);
				todoStore.on(EventType.LOADED, loadEventHandler);
				todoStore.intercept(EventType.LOADED, () => {
					return null;
				})
				
				const data = [
					{
						name: "go to gym",
						user: {
							name: "John Doe"
						}
					},
					{
						name: "buy groceries",
						user: {
							name: "John Doe"
						}
					}
				];
				
				const res = await todoStore.loadItems(data);
				
				expect(beforeChangeHandler).not.toHaveBeenCalled();
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(loadEventHandler).not.toHaveBeenCalled();
				expect(abortEventHandler).toHaveBeenCalledWith({"action": EventType.LOADED, data})
				expect(res).toBeNull()
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.LOADED, loadEventHandler);
				todoStore.off(EventType.ABORTED, abortEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('clear action', async () => {
				const {
					processingEventHandler,
					clearEventHandler,
					abortEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ABORTED, abortEventHandler);
				todoStore.on(EventType.CLEARED, clearEventHandler);
				todoStore.intercept(EventType.CLEARED, () => {
					return null;
				})
				
				const data = [
					{
						name: "buy xmas gifts",
						user: {
							name: "John Doe"
						}
					},
					{
						name: "go to gym",
						user: {
							name: "John Doe"
						}
					}
				];
				
				const items = await todoStore.loadItems(data);
				
				processingEventHandler.mockClear()
				
				const res = await todoStore.clear()
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.LOADED, {
					data: items,
					id: null
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(clearEventHandler).not.toHaveBeenCalled();
				expect(abortEventHandler).toHaveBeenCalledWith({"action": EventType.CLEARED, data: items.map(item => item._id)})
				expect(res).toBeNull()
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.CLEARED, clearEventHandler);
				todoStore.off(EventType.ABORTED, abortEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
		})
		
		describe('and throw error', () => {
			it('create action', async () => {
				const {
					processingEventHandler,
					createEventHandler,
					errorEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ERROR, errorEventHandler);
				todoStore.on(EventType.CREATED, createEventHandler);
				todoStore.intercept(EventType.CREATED, () => {
					throw new Error("failed")
				})
				
				const data = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				await expect(todoStore.createItem(data)).rejects.toThrowError("failed");
				
				expect(beforeChangeHandler).not.toHaveBeenCalled();
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(createEventHandler).not.toHaveBeenCalled();
				expect(errorEventHandler).toHaveBeenCalledWith({action: EventType.CREATED, data, error: new Error("failed"), id: null})
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.CREATED, createEventHandler);
				todoStore.off(EventType.ERROR, errorEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('update action', async () => {
				const {
					processingEventHandler,
					errorEventHandler,
					updateEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ERROR, errorEventHandler);
				todoStore.on(EventType.UPDATED, updateEventHandler);
				todoStore.intercept(EventType.UPDATED, () => {
					throw new Error("failed")
				})
				
				const item = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const newTodo = await todoStore.createItem(item);
				
				processingEventHandler.mockClear()
				
				const data = {
					name: "go to gym at 2"
				}
				
				await expect(todoStore.updateItem(newTodo._id, data)).rejects.toThrowError("failed")
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.CREATED, {
					data: newTodo,
					id: newTodo._id
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(updateEventHandler).not.toHaveBeenCalled();
				expect(errorEventHandler).toHaveBeenCalledWith({action: EventType.UPDATED, data, error: new Error("failed"), id: newTodo._id})
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.UPDATED, updateEventHandler);
				todoStore.off(EventType.ERROR, errorEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('remove action', async () => {
				const {
					processingEventHandler,
					deleteEventHandler,
					errorEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ERROR, errorEventHandler);
				todoStore.on(EventType.REMOVED, deleteEventHandler);
				
				todoStore.intercept(EventType.REMOVED, () => {
					throw new Error("failed")
				})
				
				const item = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const newTodo = await todoStore.createItem(item);
				
				processingEventHandler.mockClear()
				
				await expect(todoStore.removeItem(newTodo._id)).rejects.toThrowError("failed")
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.CREATED, {
					data: newTodo,
					id: newTodo._id
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(deleteEventHandler).not.toHaveBeenCalled();
				expect(errorEventHandler).toHaveBeenCalledWith({action: EventType.REMOVED, data: newTodo._id, error: new Error("failed"), id: newTodo._id})
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.REMOVED, deleteEventHandler);
				todoStore.off(EventType.ERROR, errorEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('load action', async () => {
				const {
					errorEventHandler,
					processingEventHandler,
					loadEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ERROR, errorEventHandler);
				todoStore.on(EventType.LOADED, loadEventHandler);
				todoStore.intercept(EventType.LOADED, () => {
					throw new Error("failed")
				})
				
				const data = [
					{
						name: "go to gym",
						user: {
							name: "John Doe"
						}
					},
					{
						name: "buy groceries",
						user: {
							name: "John Doe"
						}
					}
				];
				
				await expect(todoStore.loadItems(data)).rejects.toThrowError("failed")
				
				expect(beforeChangeHandler).not.toHaveBeenCalled();
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(loadEventHandler).not.toHaveBeenCalled();
				expect(errorEventHandler).toHaveBeenCalledWith({
					action: EventType.LOADED,
					data: data,
					error: new Error("failed"),
					id: null
				})
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.LOADED, loadEventHandler);
				todoStore.off(EventType.ERROR, errorEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
			
			it('clear action', async () => {
				const {
					processingEventHandler,
					clearEventHandler,
					errorEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.ERROR, errorEventHandler);
				todoStore.on(EventType.CLEARED, clearEventHandler);
				todoStore.intercept(EventType.CLEARED, () => {
					throw new Error("failed")
				})
				
				const data = [
					{
						name: "buy xmas gifts",
						user: {
							name: "John Doe"
						}
					},
					{
						name: "go to gym",
						user: {
							name: "John Doe"
						}
					}
				];
				
				const items = await todoStore.loadItems(data);
				
				processingEventHandler.mockClear()
				
				await expect(todoStore.clear()).rejects.toThrowError("failed")
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.LOADED, {
					data: items,
					id: null
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(clearEventHandler).not.toHaveBeenCalled();
				expect(errorEventHandler).toHaveBeenCalledWith({action: EventType.CLEARED, data: items.map(item => item._id), error: new Error("failed"), id: null})
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				
				todoStore.off(EventType.CLEARED, clearEventHandler);
				todoStore.off(EventType.ERROR, errorEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
			});
		})
		
		describe('and return new value', () => {
			it('create action', async () => {
				const {
					processingEventHandler,
					createEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				const removeBCHandler = todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.CREATED, createEventHandler);
				const unIntercept = todoStore.intercept(EventType.CREATED, ({data}) => {
					return {
						...data,
						description: "do tonight",
						_id: "unique"
					};
				})
				
				const data = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const newTodo = await todoStore.createItem(data);
				const goItem = await todoStore.getItem(newTodo._id);
				
				expect(goItem).not.toBeNull();
				
				expect(beforeChangeHandler).not.toHaveBeenCalled();
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(createEventHandler).toHaveBeenCalledWith(newTodo);
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				expect(newTodo).toEqual({
					"_createdDate": expect.any(Date),
					"_id": "unique",
					"_lastUpdatedDate": expect.any(Date),
					"description": "do tonight",
					"name": "go to gym",
					"selected": false,
					"state": "",
					"user": {
						"name": "John Doe"
					}
				});

				todoStore.off(EventType.CREATED, createEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
				unIntercept();
				removeBCHandler();
			});
			
			it('update action', async () => {
				const {
					processingEventHandler,
					updateEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				const removeBCHandler = todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.UPDATED, updateEventHandler);
				const now = new Date();
				const unIntercept = todoStore.intercept(EventType.UPDATED, ({data, id}) => {
					return {
						...data,
						description: "asap",
						_id: "unique",
						_lastUpdatedDate: now
					};
				})
				
				const data = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const newTodo = await todoStore.createItem(data);
				
				const updatedTodo = await todoStore.updateItem(newTodo._id, {
					name: "go home"
				})
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.CREATED, {
					data: newTodo,
					id: newTodo._id
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(updateEventHandler).toHaveBeenCalledWith(updatedTodo);
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				expect(updatedTodo).toEqual({
					"_createdDate": expect.any(Date),
					"_id": "unique",
					"_lastUpdatedDate": now,
					"description": "asap",
					"name": "go home",
					"selected": false,
					"state": "",
					"user": {
						"name": "John Doe"
					}
				});
				
				todoStore.off(EventType.UPDATED, updateEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
				unIntercept();
				removeBCHandler();
			});
			
			it('remove action', async () => {
				const {
					processingEventHandler,
					deleteEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				const removeBCHandler = todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.REMOVED, deleteEventHandler);
				const removed = jest.fn();
				const unIntercept = todoStore.intercept(EventType.REMOVED, removed)
				
				const data = {
					name: "go to gym",
					user: {
						name: "John Doe"
					}
				}
				
				const newTodo = await todoStore.createItem(data);
				
				const res = await todoStore.removeItem(newTodo._id)
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.CREATED, {
					data: newTodo,
					id: newTodo._id
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(deleteEventHandler).toHaveBeenCalledWith(newTodo._id);
				expect(removed).toHaveBeenCalledWith({
					data: newTodo._id,
					id: newTodo._id
				});
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				expect(res).toEqual(newTodo._id);
				
				todoStore.off(EventType.REMOVED, deleteEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
				unIntercept();
				removeBCHandler();
			});
			
			it('load action', async () => {
				const {
					processingEventHandler,
					loadEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				const removeBCHandler = todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.LOADED, loadEventHandler);
				const unIntercept = todoStore.intercept(EventType.LOADED, ({data}) => {
					return data.map(item => ({
						...item,
						description: "do tonight"
					}));
				})
				
				const data = [
					{
						name: "go to gym",
						user: {
							name: "John Doe"
						}
					},
					{
						name: "go home",
						user: {
							name: "John Doe"
						}
					}
				]
				
				const newItems = await todoStore.loadItems(data);
				
				expect(beforeChangeHandler).not.toHaveBeenCalled();
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(loadEventHandler).toHaveBeenCalledWith(newItems);
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				expect(newItems).toEqual([
					{
						"_createdDate": expect.any(Date),
						"_id": expect.any(String),
						"_lastUpdatedDate": expect.any(Date),
						"description": "do tonight",
						"name": "go to gym",
						"selected": false,
						"state": "",
						"user": {
							"name": "John Doe"
						}
					},
					{
						"_createdDate": expect.any(Date),
						"_id": expect.any(String),
						"_lastUpdatedDate": expect.any(Date),
						"description": "do tonight",
						"name": "go home",
						"selected": false,
						"state": "",
						"user": {
							"name": "John Doe"
						}
					}
				]);
				
				todoStore.off(EventType.LOADED, loadEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
				unIntercept();
				removeBCHandler();
			});
			
			it('clear action', async () => {
				const {
					processingEventHandler,
					clearEventHandler,
					beforeChangeHandler
				} = getHandlersMock();
				const todoStore = createDefaultTodoStoreWithSchemaObject();
				const removeBCHandler = todoStore.beforeChange(beforeChangeHandler);
				todoStore.on(EventType.PROCESSING, processingEventHandler);
				todoStore.on(EventType.CLEARED, clearEventHandler);
				const cleared = jest.fn()
				const unIntercept = todoStore.intercept(EventType.CLEARED, cleared)
				
				const data = [
					{
						name: "go to gym",
						user: {
							name: "John Doe"
						}
					},
					{
						name: "go home",
						user: {
							name: "John Doe"
						}
					}
				]
				
				const newItems = await todoStore.loadItems(data);
				const newItemsIds = newItems.map(item => item._id)
				const res = await todoStore.clear();
				
				expect(beforeChangeHandler).toHaveBeenCalledWith(EventType.LOADED, {
					data: newItems,
					id: null
				});
				expect(processingEventHandler).toHaveBeenCalledWith(true);
				expect(clearEventHandler).toHaveBeenCalledWith(newItemsIds);
				expect(cleared).toHaveBeenCalledWith({
					data: res,
					id: null
				});
				expect(processingEventHandler).toHaveBeenCalledWith(false);
				expect(res).toEqual(newItemsIds);
				
				todoStore.off(EventType.CLEARED, clearEventHandler);
				todoStore.off(EventType.PROCESSING, processingEventHandler);
				unIntercept();
				removeBCHandler();
			});
		})
	})
	
	it("should have correct processing state for multiple actions at once", async () => {
		const store = createDefaultTodoStoreWithSchemaObject();
		
		const user = {
			name: "John Doe"
		}
		
		const sub = jest.fn();
		
		const unsub = store.subscribe(sub);
		
		const [item1, item2] = await Promise.all([
			store.createItem({name: "Go Shopping", user}),
			store.createItem({name: "Go To Gym", user}),
		]);
		
		expect(sub).toHaveBeenCalledWith(EventType.READY, true)
		expect(sub).toHaveBeenCalledWith(EventType.PROCESSING, true)
		expect(sub).toHaveBeenCalledWith(EventType.PROCESSING_EVENTS, [EventType.CREATED])
		expect(sub).toHaveBeenCalledWith(EventType.CREATED, item1)
		expect(sub).toHaveBeenCalledWith(EventType.CREATED, item2)
		expect(sub).toHaveBeenCalledWith(EventType.PROCESSING, false)
		
		unsub();
	})
	
	it('should handle finding items', async () => {
		const store = createDefaultTodoStoreWithSchemaObject();
		
		const user = {
			name: "John Doe",
			avatar: ""
		};
		
		const items = await store.loadItems([
			{
				name: "Buy groceries",
				user
			},
			{
				name: "Go to gym",
				user
			},
			{
				name: "Pick kids up",
				user: {
					name: "Jane Doe"
				}
			}
		]);
		
		await expect(store.findItem()).resolves.toEqual(null)
		await expect(store.findItem((item) => item.name === "Go to gym")).resolves.toEqual(items[1])
		await expect(store.findItem((item) => item.name === "not valid")).resolves.toEqual(null)
		await expect(store.findItem((item, idx) => idx === items[0]._id)).resolves.toEqual(items[0])
		await expect(store.findItems((item, idx) => idx === items[0]._id)).resolves.toEqual([items[0]])
		await expect(store.findItems((item) => item.user.name === user.name)).resolves.toEqual([items[0], items[1]])
		await expect(store.findItems((item) => item.user.name === "diff")).resolves.toEqual([])
		await expect(store.findItems()).resolves.toEqual([])
	});
	
	it('should handle loading empty items', async () => {
		const {
			loadEventHandler,
		} = getHandlersMock();
		const todoStore = createDefaultTodoStoreWithSchemaObject();
		const offLoaded = todoStore.on(EventType.LOADED, loadEventHandler);
		const unIntercept = todoStore.intercept(EventType.LOADED, () => {
			return [];
		})
		
		const newItems = await todoStore.loadItems();
		
		expect(newItems).toEqual([]);
		expect(loadEventHandler).toHaveBeenCalledWith([]);
		
		offLoaded();
		unIntercept();
	});
	
	it('should handle loading empty items but intercept return same data', async () => {
		const {
			loadEventHandler,
		} = getHandlersMock();
		const todoStore = createDefaultTodoStoreWithSchemaObject();
		const offLoaded = todoStore.on(EventType.LOADED, loadEventHandler);
		const unIntercept = todoStore.intercept(EventType.LOADED, () => {
			return [
				{
					name: "go to bed",
					_id :"403357f5-50ab-4ca2-b502-656f1ae108c8",
					user: {
						name: "John Doe",
					}
				}
			];
		})
		
		await todoStore.loadItems();
		await todoStore.loadItems();
		await todoStore.loadItems();
		await todoStore.loadItems();
		
		await expect(todoStore.size()).resolves.toBe(1);
		
		offLoaded();
		unIntercept();
	});
	
	it('should handle trying to update non-existing item', async () => {
		const todoStore = createDefaultTodoStoreWithSchemaObject();
		
		const result = await todoStore.updateItem('dddd', {
			name: "J D"
		});
		
		expect(result).toEqual(null);
	});
	
	it('should handle null', async () => {
		const data = new ClientStore<any>(`todo-${generateUUID()}`, {
			name: String,
			status: OneOf([Number, Null], null),
			none: Null
		});
		
		expect(data.schema.toJSON()).toEqual({
			"name": {
				"defaultValue": "",
				"required": false,
				"type": "String"
			},
			"none": {
				"defaultValue": null,
				"required": false,
				"type": "Null"
			},
			"status": {
				"defaultValue": null,
				"required": false,
				"type": "Number | Null"
			}
		});
		
		let item = await data.createItem({
			name: "sample",
			status: 1
		})
		
		expect(item.name).toBe('sample')
		expect(item.status).toBe(1)
		
		let item2 = await data.createItem({
			status: null
		})
		
		expect(item2.status).toBe(null)
	});
});

function getHandlersMock() {
	return {
		subscribeHandler: jest.fn(),
		beforeChangeHandler: jest.fn(),
		readyEventHandler: jest.fn(),
		processingEventHandler: jest.fn(),
		createEventHandler: jest.fn(),
		clearEventHandler: jest.fn(),
		loadEventHandler: jest.fn(),
		deleteEventHandler: jest.fn(),
		updateEventHandler: jest.fn(),
		abortEventHandler: jest.fn(),
		errorEventHandler: jest.fn(),
	}
}

function getUserSchemaObject<U>(extended = false) {
	const userSchema: Record<string, any> = {
		$name: "",
		avatar: ""
	};
	
	if (extended) {
		userSchema['id'] = SchemaId;
		userSchema["dateCreated"] = Date;
		userSchema["dateUpdated"] = Date;
	}
	
	return userSchema;
}

function getTodoSchemaObject<T, U>(extended = false): Record<keyof ToDo, any> {
	const todoSchema: Record<string, any> = {
		$name: "",
		description: String,
		$user: getUserSchemaObject<U>(extended),
		selected: Boolean,
		state: String,
	};
	
	if (extended) {
		todoSchema["id"] = SchemaId;
		todoSchema["dateCreated"] = Date;
		todoSchema["dateUpdated"] = Date;
	}
	
	return todoSchema;
}

function createDefaultTodoStoreWithSchemaObject(config: Config = {}) {
	const todoSchema = getTodoSchemaObject<ToDo, User>();
	
	const uuid = generateUUID();
	
	return new ClientStore<ToDo>(`todo-${uuid}`, todoSchema, {
		appName: `Test-${uuid}`,
		description: `test app ${uuid}`,
		type: MEMORYSTORAGE,
		version: 1,
		...config
	});
}

function createDefaultTodoStoreWithExtendedSchemaObject(config: Config = {}) {
	const todoSchema = getTodoSchemaObject<ToDoExtended, UserExtended>(true);
	
	const uuid = generateUUID();
	
	return new ClientStore<ToDoExtended>(`todo-${uuid}`, todoSchema, {
		appName: `Test-${uuid}`,
		description: `test app ${uuid}`,
		type: MEMORYSTORAGE,
		version: 1,
		...config
	});
}

function getUserSchemaInstance<U>(extended = false) {
	const userSchema = new Schema<U>("user", {
		name: new SchemaValue(String, true),
		avatar: new SchemaValue(String),
	});
	
	if (extended) {
		userSchema.defineField("id", SchemaId);
		userSchema.defineField("dateCreated", Date);
		userSchema.defineField("dateUpdated", Date);
	}
	
	return userSchema;
}

function getTodoSchemaInstance<T, U>(extended = false) {
	const todoSchema = new Schema<T>("todo", {
		name: new SchemaValue(String, true),
		description: new SchemaValue(String),
		user: new SchemaValue(getUserSchemaInstance<U>(extended), true),
		selected: new SchemaValue(Boolean),
		state: new SchemaValue(String),
	});
	
	if (extended) {
		todoSchema.defineField("id", SchemaId);
		todoSchema.defineField("dateCreated", Date);
		todoSchema.defineField("dateUpdated", Date);
	}
	
	return todoSchema;
}

function createDefaultTodoStoreWithSchemaInstance(config: Config = {}) {
	const todoSchema = getTodoSchemaInstance<ToDo, User>();
	
	const uuid = generateUUID();
	
	return new ClientStore<ToDo>(`todo-${uuid}`, todoSchema, {
		appName: `Test-${uuid}`,
		description: `test app ${uuid}`,
		type: MEMORYSTORAGE,
		version: 1,
		...config
	});
}

function createDefaultTodoStoreWithExtendedSchemaInstance(config: Config = {}) {
	const todoSchema = getTodoSchemaInstance<ToDoExtended, UserExtended>(true);
	
	const uuid = generateUUID();
	
	return new ClientStore<ToDoExtended>(`todo-${uuid}`, todoSchema, {
		appName: `Test-${uuid}`,
		description: `test app ${uuid}`,
		type: MEMORYSTORAGE,
		version: 1,
		...config
	});
}
