import {ActionEventData, EventType, StoreState, UnSubscriber} from "../types";
import {ClientStore} from "../ClientStore";

export const DefaultStoreState = {
	items: [],
	processing: false,
	creatingItems: false,
	updatingItems: false,
	deletingItems: false,
	loadingItems: false,
	clearingItems: false,
	error: null
};

export const withClientStore = <T,>(store: ClientStore<T>, cb: (data: StoreState<T>) => void): UnSubscriber => {
	let data: StoreState<T> = {
		...DefaultStoreState,
		processing: !store.ready
	};
	
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
	
	return store.subscribe(async (eventType, details) => {
		switch (eventType) {
			case EventType.READY:
				data.items = await store.getItems();
				cb(data);
				break;
			case EventType.PROCESSING_EVENTS:
				const events = new Set(details as EventType[]);
				data = {
					...data,
					processing: events.size > 0,
					creatingItems: events.has(EventType.CREATED),
					updatingItems: events.has(EventType.UPDATED),
					deletingItems: events.has(EventType.REMOVED),
					loadingItems: events.has(EventType.LOADED),
					clearingItems: events.has(EventType.CLEARED),
				};
				cb(data);
				break;
			case EventType.ERROR:
				const {action, error} = details as ActionEventData<T>;
				
				data = {...data, error: new Error(`${action}: ${error?.message}`)};
				cb(data);
				break;
			case EventType.CREATED:
			case EventType.UPDATED:
			case EventType.REMOVED:
			case EventType.LOADED:
			case EventType.CLEARED:
				data = {...data, items: await store.getItems(), error: null};
				cb(data);
				break;
		}
	})
}
