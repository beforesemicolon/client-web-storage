import {isNil} from "./utils/is-nil";
import {isEmptyString} from "./utils/is-empty-string";
import {isSupportedTypeValue} from "./utils/is-supported-type-value";
import {SchemaValue} from "./SchemaValue";
import {isSameValueType} from "./utils/is-same-value-type";
import {SchemaId} from "./SchemaId";
import {SchemaDefaultValues, SchemaJSON, SchemaValueMap, SchemaValueConstructorType} from "./types";

export class Schema<T extends SchemaDefaultValues> implements Schema<T> {
	#defaultKeys = ["id", "createdDate", "lastUpdatedDate"]
	#obj: SchemaValueMap = {
		id: new SchemaValue(SchemaId, false),
		createdDate: new SchemaValue(Date, false),
		lastUpdatedDate: new SchemaValue(Date, false),
	};
	#name: string;
	#includeDefaultKeys = true;
	
	constructor(name: string, obj: SchemaValueMap | null = null, includeDefaultKeys = true) {
		this.#name = name;
		this.#includeDefaultKeys = includeDefaultKeys;
		
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
	
	defineField(name: keyof T, type: SchemaValueConstructorType, {
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
					return this.#obj.hasOwnProperty(first);
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
	
	isValidFieldValue(name: string | keyof T, value: any = null): boolean {
		const val = this.getField(`${name}`) as SchemaValue;
		
		if (val) {
			if (value instanceof Array && value.some(v => !isSupportedTypeValue(v))) {
				return false;
			}
			
			if (val.type instanceof Schema) {
				return `${value}` === '[object Object]' && val.type.getInvalidSchemaDataFields(value).length === 0;
			}
			
			return val.required
				? !isNil(value) && (val.type !== String || !isEmptyString(value)) && isSameValueType(val.type, value)
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
						schemaVal.type.getInvalidSchemaDataFields(v).forEach((k: string) => {
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
	
	toJSON(): SchemaJSON {
		const json: SchemaJSON = {};
		
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
					case val.type === SchemaId:
						obj[mapKey] = (new SchemaId()).value;
						break;
					case val.type === Date:
						obj[mapKey] = val.defaultValue instanceof Date ? val.defaultValue : nowDate;
						break;
					default:
						obj[mapKey] = val.defaultValue;
				}
			}
		}
		
		return obj as T;
	}
}
