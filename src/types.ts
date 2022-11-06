import {SchemaValue} from "./SchemaValue";
import {CustomType} from "./CustomTypes/CustomType";

export interface BlobConstructor {
	prototype: Blob;

	new(blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
}

export interface Schema<T extends SchemaDefaultValues> extends CustomType {
	new (name: string, obj: SchemaValueMap | null, includeDefaultKey: boolean): Schema<T>;
	readonly name: string;
	readonly includeDefaultKeys: boolean;
	readonly defaultKeys: ["id", "createdDate", "lastUpdatedDate"];
	defineField: (name: keyof T, type: SchemaValueConstructorType, options: { defaultValue: any, required: boolean; }) => void;
	removeField: (name: string | keyof T) => void;
	hasField: (name: string | keyof T) => boolean;
	getField: (name: string | keyof T) => SchemaValue | null;
	isValidFieldValue: (name: string | keyof T, value: any) => boolean;
	getInvalidSchemaDataFields: (value: { [k: string]: any }) => string[];
	toJSON: () => SchemaJSON;
	toString: () => string;
	toValue: () => T;
}

export type SchemaValueConstructorType =
	| typeof CustomType
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
	id?: string;
	createdDate?: Date;
	lastUpdatedDate?: Date;
}
