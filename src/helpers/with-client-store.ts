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
		switch (eventType) {
			case EventType.READY:
				data.items = await store.getItems();
				break;
			case EventType.ERROR:
				const {action, error} = details as ActionEventData<T>;
				
				data.error = new Error(`${action}: ${error?.message}`);
				break;
			case EventType.PROCESSING_EVENTS:
				updateStatuses(new Set(details as EventType[]))
				break;
			case EventType.CREATED:
				data = {...data, creatingItems: false, items: await store.getItems(), error: null};
				break;
			case EventType.UPDATED:
				data = {...data, updatingItems: false, items: await store.getItems(), error: null};
				break;
			case EventType.REMOVED:
				data = {...data, deletingItems: false, items: await store.getItems(), error: null};
				break;
			case EventType.LOADED:
				data = {...data, loadingItems: false, items: await store.getItems(), error: null};
				break;
			case EventType.CLEARED:
				data = {...data, clearingItems: false, items: await store.getItems(), error: null};
				break;
		}
		
		cb(data);
	})
}
