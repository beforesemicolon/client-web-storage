import {MemoryStore} from "./MemoryStore";

describe("MemoryStore" , () => {
	const config = {
		storeName: "Test",
		name: "app",
		version: 1
	};
	
	it('should CRUD', async () => {
		const store = MemoryStore();
		
		store._initStorage(config);
		
		await store.setItem("1", "One");

		await expect(store.getItem("1")).resolves.toEqual("One")
		await expect(store.length()).resolves.toEqual(1)

		await store.setItem("2", "Two");
		
		await expect(store.length()).resolves.toEqual(2)
		
		await expect(store.key(1)).resolves.toEqual("2")
		await expect(store.keys()).resolves.toEqual(["1", "2"])
		
		const iterator = jest.fn();
		
		await store.iterate(iterator);
		
		expect(iterator).toHaveBeenCalledWith("One", "1", 0)
		expect(iterator).toHaveBeenCalledWith("Two", "2", 1)
		
		await expect(store.iterate((val: any, key: string) => {
			if (key === "2") {
			    return val;
			}
		})).resolves.toEqual("Two")
		
		await store.removeItem("2")
		
		await expect(store.length()).resolves.toEqual(1)
		await expect(store.keys()).resolves.toEqual(["1"])
		
		await store.clear()
		
		await expect(store.length()).resolves.toEqual(0)
		await expect(store.keys()).resolves.toEqual([])
		
		// @ts-ignore
		await store.dropInstance();
	});
})
