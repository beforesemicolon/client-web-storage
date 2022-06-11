import {isNil} from "./utils/is-nil";
import {uniqueId} from "./utils/unique-id";

export class SchemaId {
	value = uniqueId();
}

const getDefaultValue = (type: Schema.Type) => {
	switch (type) {
		case Number:
			return 0;
		case Boolean:
			return false;
		case String:
			return "";
		case Array:
		case Float32Array:
		case Float64Array:
		case Int8Array:
		case Int16Array:
		case Int32Array:
		case Uint8Array:
		case Uint8ClampedArray:
		case Uint16Array:
		case Uint32Array:
			return new type();
		case ArrayBuffer:
			return new type(0);
		default:
			return null;
	}
}

const isSameValueType = (type: Schema.Type, value: any) => {
	try {
		// @ts-ignore
		return value instanceof type || typeof value === type.name.toLowerCase()
	} catch (e) {
		return false
	}
}

export class SchemaValue {
	constructor(public type: Schema.Type | Schema<any>, public required = false, public defaultValue: Schema.ValueType = null) {
		if (defaultValue !== null && !isSameValueType(type, defaultValue)) {
			throw new Error(`Default value "${defaultValue}" does not match type "${type.name}"`);
		}
		
		this.defaultValue = defaultValue ?? getDefaultValue(this.type);
	}
	
	toJSON(): Schema.JSONValue {
		return {
			type: this.type instanceof Schema ? this.type.toJSON() : this.type.name,
			required: this.required,
			defaultValue: this.defaultValue
		}
	}
	
	toString() {
		return JSON.stringify(this.toJSON(), null, 4)
	}
}

export class Schema<T extends Schema.DefaultValue> {
	#defaultKeys = ["id", "createdDate", "lastUpdatedDate"]
	#obj: Schema.Map = {
		id: new SchemaValue(SchemaId, false),
		createdDate: new SchemaValue(Date, false),
		lastUpdatedDate: new SchemaValue(Date, false),
	};
	#name: string;
	#includeDefaultKeys = true;
	
	constructor(name: string, obj: Schema.Map | null = null, includeDefaultKeys = true) {
		this.#name = name;
		this.#includeDefaultKeys  = includeDefaultKeys;
		
		if (!includeDefaultKeys) {
			this.#obj = {};
		}
		
		if (obj) {
			for (let objKey in obj) {
				if (obj.hasOwnProperty(objKey)) {
					if (obj[objKey] instanceof SchemaValue) {
						if (!this.#defaultKeys.includes(objKey)) {
							this.#obj[objKey] = obj[objKey];
						}
					} else {
						throw new Error(`Field "${objKey}" is not a SchemaValue`)
					}
				}
			}
		}
	}
	
	get name() {
		return this.#name;
	}
	
	get includeDefaultKeys() {
		return this.#includeDefaultKeys;
	}
	
	get defaultKeys() {
		return this.#defaultKeys;
	}
	
	defineField(name: keyof T, type: Schema.Type, {
		defaultValue,
		required
	}: { defaultValue?: any, required?: boolean } = {defaultValue: null, required: false}) {
		this.#obj[`${name}`] = new SchemaValue(type, required, defaultValue);
	}
	
	removeField(name: string | keyof T): void {
		if (name) {
			const [first, ...others] = `${name}`.split(".");
			
			const field = this.#obj[first];
			
			if (field) {
				if (others.length) {
					if (field.type instanceof Schema) {
						field.type.removeField(others.join('.'));
					}
				} else {
					delete this.#obj[first];
				}
			}
		}
	}
	
	hasField(name: string | keyof T): boolean {
		if (name) {
			const [first, ...others] = `${name}`.split(".");
			
			const field = this.#obj[first];
			
			if (field) {
				if (others.length) {
					if (field.type instanceof Schema) {
						return field.type.hasField(others.join('.'))
					}
				} else {
					return  this.#obj.hasOwnProperty(first);
				}
			}
		}
		
		return false;
	}
	
	getField(name: string | keyof T): SchemaValue | null {
		if (name) {
			const [first, ...others] = `${name}`.split(".");
			
			const field = this.#obj[first];
			
			if (field && others.length) {
				if (field.type instanceof Schema) {
					return field.type.getField(others.join('.'))
				}
			}
			
			return field ?? null;
		}
		
		return null
	}
	
	isValidFieldValue(name: keyof T, value: any = null): boolean {
		if (this.#obj.hasOwnProperty(name)) {
			const val = this.#obj[`${name}`];
			
			if (value instanceof Array && value.some(v => !isSupportedTypeValue(v))) {
				return false;
			}
			
			if (val.type instanceof Schema) {
				return `${value}` === '[object Object]' && val.type.getInvalidSchemaDataFields(value).length === 0;
			}
			
			return val.required
				? !isNil(value) && isSameValueType(val.type, value)
				: value === null || value === val.defaultValue || isSameValueType(val.type, value);
		}
		
		return false;
	}
	
	getInvalidSchemaDataFields(value: { [k: string]: any }): string[] {
		const invalidFields: Set<string> = new Set();
		
		const requiredFields = Object.keys(this.#obj).filter(key => this.#obj[key].required);
		
		for (const valueKey of [...Object.keys(value), ...requiredFields]) {
			if (!this.defaultKeys.includes(valueKey)) {
				const schemaVal = this.getField(valueKey as keyof T);
				
				if (schemaVal?.type instanceof Schema) {
					const v = value[valueKey];
					if (`${v}` === '[object Object]') {
						schemaVal.type.getInvalidSchemaDataFields(v).map((k: string) => {
							invalidFields.add(`${valueKey}.${k}`)
						})
					} else {
						invalidFields.add(valueKey);
					}
					continue;
				}
				
				if (!this.isValidFieldValue(valueKey as keyof T, value[valueKey])) {
					invalidFields.add(valueKey);
				}
			}
		}
		
		return Array.from(invalidFields);
	}
	
	toJSON(): Schema.JSON {
		const json: Schema.JSON = {};
		
		for (let mapKey in this.#obj) {
			if (this.#obj.hasOwnProperty(mapKey)) {
				const val = this.#obj[mapKey];
				
				json[mapKey] = val.toJSON();
			}
		}
		
		return json;
	}
	
	toString() {
		return JSON.stringify(this.toJSON(), null, 4)
	}
	
	toValue(): T {
		const nowDate = new Date();
		
		const obj: { [k: string]: any } = this.includeDefaultKeys ? {
			// set default key values
			id: (new SchemaId()).value,
			createdDate: nowDate,
			lastUpdatedDate: nowDate,
		} : {};
		
		for (let mapKey in this.#obj) {
			if (this.#obj.hasOwnProperty(mapKey) && !this.defaultKeys.includes(mapKey)) {
				const val = this.#obj[mapKey];
				
				switch (true) {
					case val.type instanceof Schema:
						obj[mapKey] = (val.type as Schema<any>).toValue();
						break;
					case val.type instanceof Date:
						obj[mapKey] = val.defaultValue ?? new Date();
						break;
					default:
						obj[mapKey] = val.defaultValue;
				}
			}
		}
		
		return obj as T;
	}
}

function isSupportedTypeValue(value: any): boolean {
	return value === null || [
		Schema,
		SchemaId,
		Date,
		Number,
		String,
		Boolean,
		Array,
		ArrayBuffer,
		Blob,
		Float32Array,
		Float64Array,
		Int8Array,
		Int16Array,
		Int32Array,
		Uint8Array,
		Uint8ClampedArray,
		Uint16Array,
		Uint32Array
	].some(type => value instanceof type || typeof value === type.name.toLowerCase())
}

export namespace Schema {
	interface BlobConstructor {
		prototype: Blob;
		
		new(blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
	}
	
	interface SchemaIdConstructor {
		prototype: SchemaId;
		
		new(): SchemaId;
	}
	
	export type Type =
		| Schema<any>
		| SchemaIdConstructor
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
	
	export type ValueType = null
		| Schema<any>
		| SchemaId
		| Date
		| Number
		| String
		| Boolean
		| Array<ValueType>
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
		type: string | JSON;
		required: boolean;
		defaultValue: ValueType;
	}
	
	export interface JSON {
		[k: string]: JSONValue | JSON
	}
	
	export interface Map {
		[k: string]: SchemaValue
	}
	
	export interface DefaultValue {
		id?: number;
		createdDate?: Date;
		lastUpdatedDate?: Date;
	}
}
