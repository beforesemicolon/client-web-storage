import {ClientStore} from "./ClientStore";
import {Schema, SchemaValue} from "./Schema";
import {MEMORY_STORAGE} from "./MemoryStore";
import UnSubscriber = ClientStore.UnSubscriber;
import objectContaining = jasmine.objectContaining;

describe('ClientStore', () => {
	interface User extends Schema.DefaultValue {
		name: string;
		avatar: string;
	}
	
	interface ToDo extends Schema.DefaultValue {
		name: string;
		description: string;
		user: User;
		selected: boolean;
		state: string;
	}
	
	const userSchema = new Schema<User>("user", {
		name: new SchemaValue(String, true),
		avatar: new SchemaValue(String),
	});
	const todoSchema = new Schema<ToDo>("todo", {
		name: new SchemaValue(String, true),
		description: new SchemaValue(String),
		user: new SchemaValue(userSchema, true),
		selected: new SchemaValue(Boolean),
		state: new SchemaValue(String),
	});
	
	let onChange = jest.fn();
	let beforeChange = jest.fn(() => true);
	let todoStore: ClientStore<ToDo>;
	let unsubChange: UnSubscriber;
	let unsubBeforeChange: UnSubscriber;
	
	beforeEach(async () => {
		onChange = jest.fn();
		beforeChange = jest.fn(() => true);
		
		todoStore = new ClientStore<ToDo>("todo", todoSchema, {
			appName: "Test",
			description: "test app",
			type: ClientStore.Type.MEMORY_STORAGE,
			version: 1
		});
		await todoStore.clear();
		
		unsubChange = todoStore.subscribe(onChange);
		unsubBeforeChange = todoStore.beforeChange(beforeChange);
	})
	
	afterEach(() => {
		unsubChange();
		unsubBeforeChange();
	})
	
	it('should throw error is provided schema is invalid', () => {
		// @ts-ignore
		expect(() => new ClientStore("sample", {})).toThrowError('Missing or unknown "Schema"')
		expect(() => new ClientStore("sample", {
			// @ts-ignore
			sample: Symbol('invalid')
		})).toThrowError('Missing or unknown "Schema"')
	});
	
	describe('should abort when', () => {
		const data = {
			name: "Buy groceries",
			user: {
				name: "John Doe",
				avatar: ""
			}
		};
		
		beforeEach(async () => {
			await todoStore.clear()
		})
		
		afterEach(() => {
			beforeChange.mockRestore();
		})
		
		it('create item', async () => {
			onChange.mockClear();
			beforeChange.mockReturnValue(false);
			
			const newTodo = await todoStore.createItem(data);
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ABORTED, expect.objectContaining({
				action: ClientStore.EventType.CREATED,
				data
			}));
			expect(newTodo).toBe(null)
			expect(todoStore.size).toBe(0);
			
			beforeChange.mockRestore();
		});
		
		it('update item', async () => {
			const newTodo = await todoStore.createItem(data);
			
			onChange.mockClear();
			
			beforeChange.mockReturnValue(false);
			
			const res = await todoStore.updateItem(newTodo?.id, {
				name: "buy shoes"
			});
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ABORTED, {
				action: ClientStore.EventType.UPDATED,
				data: {
					name: "buy shoes"
				}
			});
			expect(res).toBe(null)
		});
		
		it('load items', async () => {
			onChange.mockClear();
			beforeChange.mockReturnValue(false);
			
			await todoStore.loadItems([data]);
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ABORTED, expect.objectContaining({
				action: ClientStore.EventType.LOADED,
				data: [data]
			}));
			expect(todoStore.size).toBe(0);

			beforeChange.mockRestore();
		});
		
		it('remove item', async () => {
			const newTodo = await todoStore.createItem(data);
			
			onChange.mockClear();
			
			beforeChange.mockReturnValue(false);
			
			const res = await todoStore.removeItem(newTodo?.id);
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ABORTED, {
				action: ClientStore.EventType.DELETED,
				data: newTodo?.id
			});
			expect(res).toBe(null)
		});
		
		it('clear items', async () => {
			const newTodo = await todoStore.createItem(data);
			
			onChange.mockClear();
			
			beforeChange.mockReturnValue(false);
			
			const res = await todoStore.clear();
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ABORTED, {
				action: ClientStore.EventType.CLEARED,
				data: [newTodo?.id]
			});
			expect(res).toBe(null)
		});
	});
	
	describe('should broadcast error if', () => {
		const data = {
			name: "Buy groceries",
			user: {
				name: "John Doe",
				avatar: ""
			}
		};
		const error = new Error('random');
		const createTodo = () => todoStore.createItem(data);
		const setupBeforeChangeFn = () => todoStore.beforeChange(() => {
			throw error
		});
		
		beforeEach(async () => {
			await todoStore.clear()
		})
		
		it('createItem fails', async () => {
			onChange.mockClear();
			
			const unsub = setupBeforeChangeFn();
			
			await createTodo();
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ERROR, expect.objectContaining({
				action: ClientStore.EventType.CREATED,
				data: expect.objectContaining(data),
				error
			}));
			
			unsub();
		});
		
		it('updateItem fails', async () => {
			const todo = await createTodo();
			
			onChange.mockClear();
			
			const unsub = setupBeforeChangeFn();
			
			await todoStore.updateItem(todo?.id, data);
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ERROR, expect.objectContaining({
				action: ClientStore.EventType.UPDATED,
				data: expect.objectContaining(data),
				error
			}));

			unsub();
		});
		
		it('loadItems fails', async () => {
			onChange.mockClear();
			
			const unsub = setupBeforeChangeFn();
			
			await todoStore.loadItems([data])
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ERROR, expect.objectContaining({
				action: ClientStore.EventType.LOADED,
				data: expect.arrayContaining([data]),
				error
			}));
			
			unsub();
		});
		
		it('removeItem fails', async () => {
			const todo = await createTodo();
			
			onChange.mockClear();
			
			const unsub = setupBeforeChangeFn();
			
			await todoStore.removeItem(todo?.id);
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ERROR, expect.objectContaining({
				action: ClientStore.EventType.DELETED,
				data: todo?.id,
				error
			}));
			
			unsub();
		});
		
		it('clear fails', async () => {
			const todo = await createTodo();
			
			onChange.mockClear();
			
			const unsub = setupBeforeChangeFn();
			
			await todoStore.clear();
			
			expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.ERROR, expect.objectContaining({
				action: ClientStore.EventType.CLEARED,
				data: [todo?.id],
				error
			}));
			
			unsub();
		});
	});
	
	it('should create store', () => {
		expect(todoStore).toBeDefined();
		expect(todoStore.type).toBe(MEMORY_STORAGE);
		expect(todoStore.name).toBe('Test-todo');
		expect(todoStore.ready).toBe(true);
		expect(todoStore.size).toBe(0);
	});
	
	it('should load items', async () => {
		onChange.mockClear();
		const user = {
			...userSchema.toValue(),
			name: "John Doe"
		}
		
		await expect(todoStore.loadItems()).resolves.toEqual(null);
		await expect(todoStore.loadItems([])).resolves.toEqual(null);
		
		expect(todoStore.size).toBe(0);
		
		await todoStore.loadItems([
			{name: "Go Shopping", user},
			{name: "Go To Gym", user}
		]);
		
		let items = await todoStore.getItems();
		
		expect(todoStore.size).toBe(2)
		expect(items).toEqual([
			expect.objectContaining({
				name: "Go Shopping",
				description: ""
			}),
			expect.objectContaining({
				name: "Go To Gym",
				description: "",
			})
		])
		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.LOADED, expect.arrayContaining([
			expect.objectContaining({name: "Go Shopping", user}),
			expect.objectContaining({name: "Go To Gym", user}),
		]));
		
		onChange.mockClear()
		
		await todoStore.loadItems([
			{...items[0], description: "Buy milk and bread"}
		]);

		items = await todoStore.getItems();
		
		expect(todoStore.size).toBe(2)
		expect(items).toEqual([
			expect.objectContaining({
				name: "Go Shopping",
				description: "Buy milk and bread"
			}),
			expect.objectContaining({
				name: "Go To Gym",
				description: "",
			})
		]);
		expect(onChange).toHaveBeenCalledTimes(1)
		expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.LOADED, expect.arrayContaining([
			expect.objectContaining({name: "Go Shopping", description: "Buy milk and bread"}),
		]));
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
		} as any)).rejects.toThrowError('Failed to create item. Field(s) "user.name" do not match the schema:')
		
		// create
		let newTodo = await todoStore.createItem({
			name: "Buy groceries",
			user: {
				name: "John Doe"
			}
		} as any) as ToDo
		
		expect(newTodo).toEqual(expect.objectContaining({
			"createdDate": expect.any(Date),
			"description": "",
			"id": expect.any(String),
			"lastUpdatedDate": expect.any(Date),
			"name": "Buy groceries",
			"selected": false,
			"state": "",
			"user": {
				"name": "John Doe",
			}
		}))
		expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.CREATED, newTodo)
		onChange.mockClear()
		// read
		await expect(todoStore.getItem(newTodo.id as any)).resolves.toEqual(newTodo)
		await expect(todoStore.getItems()).resolves.toEqual([newTodo])
		// update
		await expect(todoStore.updateItem(newTodo.id, {
			new: "unknown prop"
		} as any)).rejects.toThrowError(`Failed to update item "${newTodo.id}". Key "new" is unknown or has invalid value type: null`)
		await expect(todoStore.updateItem(newTodo.id, {
			description: 120
		} as any)).rejects.toThrowError(`Failed to update item "${newTodo.id}". Key "description" is unknown or has invalid value type:`);

		const updatedTodo = await todoStore.updateItem(newTodo.id, {
			description: "need to get milk and bread",
			id: '328947239487'
		}) as ToDo;

		expect(updatedTodo).toEqual(expect.objectContaining({
			"createdDate": expect.any(Date),
			"description": "need to get milk and bread",
			"id": expect.any(String),
			"lastUpdatedDate": expect.any(Date),
			"name": "Buy groceries",
			"selected": false,
			"state": "",
			"user": {
				"name": "John Doe"
			}
		}))
		expect(onChange).toHaveBeenCalledWith(ClientStore.EventType.UPDATED, expect.objectContaining({
			description: "need to get milk and bread",
			id: updatedTodo.id
		}));
		expect(updatedTodo.lastUpdatedDate).not.toEqual(newTodo.lastUpdatedDate);
		expect(updatedTodo.createdDate).toEqual(newTodo.createdDate);
		expect(updatedTodo.id).toEqual(newTodo.id);
		onChange.mockClear()
		// delete
		await todoStore.removeItem(updatedTodo.id);

		await expect(todoStore.getItem(updatedTodo.id)).resolves.toBeNull()
	});
	
	it('should create, search, and clear store', async () => {
		onChange.mockClear(); // skip the ready event
		const user = userSchema.toValue();
		
		const todo1 = await todoStore.createItem({name: "Buy groceries", user}) as ToDo;
		const todo2 = await todoStore.createItem({name: "Go to the gym", user}) as ToDo;
		const todo3 = await todoStore.createItem({name: "Pick kids at school", user}) as ToDo;
		
		expect(onChange).toHaveBeenCalledTimes(3);
		onChange.mockClear();
		
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
		
		const allItems = await todoStore.findItems((item) => {
			return /gym|school/i.test(item.name);
		});
		
		expect(allItems).toHaveLength(2);
		expect(await todoStore.findItems((item) => {
			return /nothing/i.test(item.name);
		})).toHaveLength(0);
		
		await todoStore.clear();
		
		expect(onChange).toHaveBeenCalledWith(
			ClientStore.EventType.CLEARED, expect.arrayContaining([expect.any(String), expect.any(String), expect.any(String)])
		)
		
		expect(todoStore.size).toBe(0);
		
	});
	
});
