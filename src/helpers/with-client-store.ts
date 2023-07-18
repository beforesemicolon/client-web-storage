import {ActionEventData, EventType, StoreState, UnSubscriber} from "../types";
import {ClientStore} from "../ClientStore";

export const DefaultStoreState = <T>(store: ClientStore<T>): StoreState<T> => ({
	items: [],
	processing: false,
	creatingItems: false,
	updatingItems: false,
	deletingItems: false,
	loadingItems: false,
	clearingItems: false,
	error: null,
	createItem: (...args) => store.createItem(...args),
	updateItem: (...args) => store.updateItem(...args),
	loadItems: (...args) => store.loadItems(...args),
	removeItem: (...args) => store.removeItem(...args),
	findItems: (...args) => store.findItems(...args),
	findItem: (...args) => store.findItem(...args),
	clear: (...args) => store.clear(...args),
});

export const withClientStore = <T,>(store: ClientStore<T>, cb: (data: StoreState<T>) => void): UnSubscriber => {
	let data: StoreState<T> = DefaultStoreState<T>(store);
	data.processing = !store.ready;
	
	const loadItems = () => {
		store.getItems()
			.then(items => {
				data.items = items;
				cb(data);
			})
	}
	
	if (store.ready) {
		loadItems()
	}
	
	const updateStatuses = (events: Set<EventType>) => {
		data.processing = events.size > 0;
		data.creatingItems = events.has(EventType.CREATED);
		data.updatingItems = events.has(EventType.UPDATED);
		data.deletingItems = events.has(EventType.REMOVED);
		data.loadingItems = events.has(EventType.LOADED);
		data.clearingItems = events.has(EventType.CLEARED);
	}
	
	return store.subscribe(async (eventType, details) => {
		updateStatuses(new Set(details as EventType[]))
		
		switch (eventType) {
			case EventType.READY:
				data.items = await store.getItems();
				break;
			case EventType.ERROR:
				const {action, error} = details as ActionEventData<T>;
				
				data.error = new Error(`${action}: ${error?.message}`);
				break;
			case EventType.CREATED:
			case EventType.UPDATED:
			case EventType.REMOVED:
			case EventType.LOADED:
			case EventType.CLEARED:
				data = {...data, items: await store.getItems(), error: null};
				break;
		}
		
		cb(data);
	})
}
