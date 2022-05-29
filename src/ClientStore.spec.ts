import {ClientStore, ClientStoreEventType, storeSubscriber, storeUnSubscriber} from "./ClientStore";
import localforage from 'localforage';
import {Schema, SchemaValue} from "./Schema";
import {MEMORY_STORAGE, MemoryStore} from "./MemoryStore";

describe('ClientStore', () => {
	const userSchema = new Schema("user", {
		name: new SchemaValue(String, true),
		avatar: new SchemaValue(String),
	});
	const todoSchema = new Schema("todo", {
		name: new SchemaValue(String, true),
		description: new SchemaValue(String),
		user: new SchemaValue(userSchema, true),
		selected: new SchemaValue(Boolean),
		state: new SchemaValue(String),
	});
	
	
	const onReady = jest.fn();
	const onChange = jest.fn();
	let todoStore: ClientStore;
	let unsub: storeUnSubscriber;
	
	beforeAll(async () => {
		await localforage.defineDriver(MemoryStore());
		todoStore = new ClientStore("todo", todoSchema, {type: MEMORY_STORAGE, appName: "Test"}, onReady);
		unsub = todoStore.subscribe(onChange);
	})
	
	afterAll(() => {
		unsub();
	})
	
	it('should create store', () => {
		expect(todoStore).toBeDefined();
		expect(todoStore.type).toBe(MEMORY_STORAGE);
		expect(todoStore.name).toBe('Test-todo');
		expect(todoStore.ready).toBe(true);
		expect(onReady).toHaveBeenCalled()
	});
	
	it('should CRUD item', async () => {
		// check failures
		await expect(todoStore.createItem({})).rejects.toThrowError('Failed to create item. Field(s) "name, user" do not match the schema:')
		await expect(todoStore.createItem({
			name: "Buy groceries"
		})).rejects.toThrowError('Failed to create item. Field(s) "user" do not match the schema:')
		await expect(todoStore.createItem({
			name: "Buy groceries",
			user: {}
		})).rejects.toThrowError('Failed to create item. Field(s) "user.name" do not match the schema:')
		
		// create
		let newTodo = await todoStore.createItem({
			name: "Buy groceries",
			user: {
				name: "John Doe"
			}
		})
		
		expect(newTodo).toEqual(expect.objectContaining({
			"createdDate": expect.any(Date),
			"description": "",
			"id": expect.any(Number),
			"lastUpdatedDate": expect.any(Date),
			"name": "Buy groceries",
			"selected": false,
			"state": "",
			"user": {
				"name": "John Doe",
			}
		}))
		expect(onChange).toHaveBeenCalledWith(ClientStoreEventType.CREATE, newTodo.id)
		
		// read
		await expect(todoStore.getItem(newTodo.id as any)).resolves.toEqual(newTodo)
		await expect(todoStore.getItems()).resolves.toEqual([newTodo])
		// update
		await expect(todoStore.updateItem(newTodo.id, {
			new: "unknown prop"
		})).rejects.toThrowError(`Failed to update item "${newTodo.id}". Key "new" is unknown or has invalid value type: null`)
		await expect(todoStore.updateItem(newTodo.id, {
			description: 120
		})).rejects.toThrowError(`Failed to update item "${newTodo.id}". Key "description" is unknown or has invalid value type:`);
		
		const updatedTodo = await todoStore.updateItem(newTodo.id, {
			description: "need to get milk and bread",
			id: 328947239487
		})
		
		expect(updatedTodo).toEqual(expect.objectContaining({
			"createdDate": expect.any(Date),
			"description": "need to get milk and bread",
			"id": expect.any(Number),
			"lastUpdatedDate": expect.any(Date),
			"name": "Buy groceries",
			"selected": false,
			"state": "",
			"user": {
				"name": "John Doe"
			}
		}))
		expect(onChange).toHaveBeenCalledWith(ClientStoreEventType.UPDATE, newTodo.id);
		expect(updatedTodo.lastUpdatedDate).not.toEqual(newTodo.lastUpdatedDate);
		expect(updatedTodo.createdDate).toEqual(newTodo.createdDate);
		expect(updatedTodo.id).toEqual(newTodo.id);
		
		// delete
		await todoStore.removeItem(updatedTodo.id);
		
		await expect(todoStore.getItem(updatedTodo.id)).resolves.toBeNull()
	});
	
	it('should create, search, and clear store', async () => {
		const user = userSchema.toValue();
		
		const todo1 = await todoStore.createItem({name: "Buy groceries", user});
		const todo2 = await todoStore.createItem({name: "Go to the gym", user});
		const todo3 = await todoStore.createItem({name: "Pick kids at school", user});
		
		expect(todoStore.size).toBe(3);
		expect((new Set([todo1.id, todo2.id, todo3.id])).size).toBe(3);
		expect((new Set([todo1.createdDate, todo2.createdDate, todo3.createdDate])).size).toBe(3);
		
		const foundItem = await todoStore.findItem((item) => {
			return /gym/i.test(item.name);
		});

		expect(foundItem).toEqual(todo2)
		
		const notfoundItem = await todoStore.findItem((item) => {
			return /100/i.test(item.name);
		});
		
		expect(notfoundItem).toBeNull();
		
		const allItems = await todoStore.findAllItems((item) => {
			return /gym|school/i.test(item.name);
		});
		
		expect(allItems).toHaveLength(2);
		expect(await todoStore.findAllItems((item) => {
			return /nothing/i.test(item.name);
		})).toHaveLength(0);
		
		await todoStore.clear();
		
		expect(todoStore.size).toBe(0);
		
	});
	
});
