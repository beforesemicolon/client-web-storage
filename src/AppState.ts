import {ClientStore} from "./ClientStore";
import {Schema} from "./Schema";
import {ActionEventData, EventType, SchemaDefaultValues, SchemaObjectLiteral, UnSubscriber} from "./types";

export class AppState<T> {
	#store: ClientStore<T>;
	#item: T & SchemaDefaultValues = {} as T & SchemaDefaultValues;
	
	get value(): T {
		return this.#extractStateFromItem(this.#item);
	}
	
	constructor(name: string, schema: Schema<T> | SchemaObjectLiteral) {
		this.#store = new ClientStore<T>(name, schema);
		this.#item = this.#store.schema.toValue() as T & SchemaDefaultValues;
	}
	
	async update(data: Partial<T>) {
		if (this.#item._id) {
			return this.#store.updateItem(this.#item._id, {
				...data
			}).then(item => {
				this.#item = item;
				return this.#extractStateFromItem(item);
			})
		}
		
		// @ts-ignore
		return this.#store.createItem({
			...this.#item,
			...data
		}).then(item => {
			this.#item = item;
			return this.#extractStateFromItem(item);
		})
	}
	
	subscribe(handler: (data: T | null, error: Error | null) => void): UnSubscriber {
		return this.#store.subscribe((eventType, data) => {
			switch (eventType) {
				case EventType.CREATED:
				case EventType.UPDATED:
					handler(this.#extractStateFromItem(data as T), null);
					break;
				case EventType.ERROR:
					handler(null, (data as ActionEventData<T>).error);
					break;
			}
		})
	}
	
	intercept(handler: (data: T) => void): UnSubscriber {
		const unListenFromCreate = this.#store.intercept(EventType.CREATED, ({data}) => {
			handler(data);
		})
		
		const unListenFromUpdate = this.#store.intercept(EventType.UPDATED, ({data}) => {
			handler(data);
		})
		
		return () => {
			unListenFromCreate();
			unListenFromUpdate();
		}
	}
	
	#extractStateFromItem(data: T): T {
		const {_id, _createdDate, _lastUpdatedDate, ...state} = data as T & SchemaDefaultValues;
		return state as T;
	}
}
