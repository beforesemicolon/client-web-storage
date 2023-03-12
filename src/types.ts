import {SchemaValue} from "./SchemaValue";
import {CustomType} from "./CustomTypes/CustomType";
import {Schema} from "./Schema";
import {INDEXEDDB, LOCALSTORAGE, WEBSQL} from "localforage";
import {MEMORYSTORAGE} from "./MemoryStore";

export interface BlobConstructor {
	prototype: Blob;

	new(blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
}

export type SchemaObjectLiteral = Record<string, SchemaValueType | SchemaValueConstructorType | Record<string, SchemaValueType | SchemaValueConstructorType>>;

export type SchemaValueConstructorType =
	| typeof CustomType
	| typeof Schema
	| DateConstructor
	| NumberConstructor
	| StringConstructor
	| BooleanConstructor
	| ArrayConstructor
	| ArrayBufferConstructor
	| BlobConstructor
	| Float32ArrayConstructor
	| Float64ArrayConstructor
	| Int8ArrayConstructor
	| Int16ArrayConstructor
	| Int32ArrayConstructor
	| Uint8ArrayConstructor
	| Uint8ClampedArrayConstructor
	| Uint16ArrayConstructor
	| Uint32ArrayConstructor;

export type SchemaValueType = null
	| Schema<any>
	| CustomType
	| Date
	| Number
	| String
	| Boolean
	| Array<SchemaValueType>
	| ArrayBuffer
	| Blob
	| Float32Array
	| Float64Array
	| Int8Array
	| Int16Array
	| Int32Array
	| Uint8Array
	| Uint8ClampedArray
	| Uint16Array
	| Uint32Array;

export interface JSONValue {
	type: string;
	required: boolean;
	defaultValue: SchemaValueType | SchemaJSON;
}

export interface SchemaJSON {
	[k: string]: JSONValue | SchemaJSON
}

export interface SchemaValueMap {
	[k: string]: SchemaValue
}

export interface SchemaDefaultValues {
	_id: string;
	_createdDate: Date;
	_lastUpdatedDate: Date;
}

export interface ActionEventData<D> {
	data: D,
	error: Error | null,
	action: EventType,
	id: string | null
}

interface InterceptData<T> { data: EventData<T>, id: string | null }

export type EventData<T> = T | T[] | Partial<T> | Partial<T>[] |string | string[] | EventType[] | boolean | ActionEventData<T>;

export type StoreSubscriber<T> = (eventType: EventType, data: EventData<T>) => void;

export type EventHandler<T> = (data: EventData<T>) => void;

export type UnSubscriber = () => void;

type BeforeChangeHandlerReturn<T> = null | ActionEventData<EventData<T>> | void;

type InterceptEventHandlerReturn<T> = null | ActionEventData<EventData<T>> | void;

export type BeforeChangeHandler<T> = (eventType: EventType, data: InterceptData<T>) => Promise<BeforeChangeHandlerReturn<T>> | BeforeChangeHandlerReturn<T>;

export type InterceptEventHandler<T> = (data: InterceptData<T>) => Promise<InterceptEventHandlerReturn<T>> | InterceptEventHandlerReturn<T>;

export interface Config {
	appName?: string;
	version?: number;
	type?: string | string[];
	description?: string;
	idKeyName?: string;
	createdDateKeyName?: string;
	updatedDateKeyName?: string;
}

export enum EventType {
	READY = "ready",
	PROCESSING = "processing",
	PROCESSING_EVENTS = "processing-events",
	CREATED = "created",
	LOADED = "loaded",
	ERROR = "error",
	ABORTED = "aborted",
	REMOVED = "removed",
	UPDATED = "updated",
	CLEARED = "cleared"
}

export const StorageType = {
	LOCALSTORAGE,
	WEBSQL,
	INDEXEDDB,
  MEMORYSTORAGE
}

export interface StoreState<T> {
	items: T[];
	processing: boolean;
	creatingItems: boolean;
	updatingItems: boolean;
	deletingItems: boolean;
	loadingItems: boolean;
	clearingItems: boolean;
	error: Error | null;
	loadItems: (dataList: Array<Partial<T>>) => Promise<Array<Required<T> & SchemaDefaultValues>>;
	createItem: (data: Partial<T>) => Promise<Required<T> & SchemaDefaultValues>;
	updateItem: (id: string, data: Partial<T>) => Promise<Required<T> & SchemaDefaultValues>;
	removeItem: (id: string) => Promise<string | null>;
	clear: () => Promise<string[] | null>;
	findItem: (cb?: (value: Required<T>, key: string) => boolean) => Promise<T | null>;
	findItems: (cb?: (value: Required<T>, key: string) => boolean) => Promise<T[]>
}

