import {isNil} from "./utils/is-nil";
import {isEmptyString} from "./utils/is-empty-string";
import {SchemaValue} from "./SchemaValue";
import {isSameValueType} from "./utils/is-same-value-type";
import {SchemaId} from "./CustomTypes/SchemaId";
import {SchemaJSON, SchemaValueConstructorType, SchemaValueMap} from "./types";

export class Schema<T> {
	#obj: SchemaValueMap = {};
	#name: string;
	
	constructor(name: string, map: SchemaValueMap | null = null) {
		this.#name = name;
		
		if (map) {
			for (let objKey in map) {
				if (map.hasOwnProperty(objKey)) {
					if (map[objKey] instanceof SchemaValue) {
						this.#obj[objKey] = map[objKey];
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
	
	defineField(name: string | keyof T, type: SchemaValueConstructorType | Schema<T>, {
		defaultValue,
		required
	}: { defaultValue?: any, required?: boolean } = {}) {
		this.#obj[String(name)] = new SchemaValue(type, required, defaultValue);
	}
	
	removeField(name: string | keyof T): void {
		if (name) {
			const [first, ...others] = String(name).split(".");
			
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
			const [first, ...others] = String(name).split(".");
			
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
			const [first, ...others] = String(name).split(".");
			
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
		const val = this.getField(String(name));
		
		if (val) {
			return val.required
				? !isNil(value) && (val.type !== String || !isEmptyString(value)) && isSameValueType(val.type, value)
				: isSameValueType(val.type, value);
		}
		
		return false;
	}
	
	getInvalidSchemaDataFields(value: Record<string, any>, defaultKeys: Set<string> = new Set()): string[] {
		const invalidFields: Set<string> = new Set();
		
		const requiredFields = Object.keys(this.#obj).filter(key => this.#obj[key].required);
		const keys = [...Object.keys(value as {}), ...requiredFields];
		
		for (const valueKey of keys) {
			if (!defaultKeys.has(valueKey as string)) {
				const schemaVal = this.getField(valueKey as keyof T);
				const val = value[valueKey];
				
				if (/ArrayOf/.test(schemaVal?.type.name ?? '')) {
					if (!(val instanceof Array)) {
						invalidFields.add(valueKey);
						continue;
					} else {
						// @ts-ignore
						const Type = (new (schemaVal.type as any)());
						
						if(Type.type instanceof Schema) {
							val.forEach((v, k) => {
								if (`${v}` === '[object Object]') {
									Type.type.getInvalidSchemaDataFields(v).forEach((z: string) => {
										invalidFields.add(`${valueKey}[${k}].${z}`)
									})
								} else {
									invalidFields.add(`${valueKey}[${k}]`);
								}
							})
							continue;
						}
					}
				}
				
				if (/OneOf/.test(schemaVal?.type.name ?? '')) {
					// @ts-ignore
					const Type = (new (schemaVal.type as any)());
					const schema = Type.type.find((t: any) => t instanceof Schema);
					
					if (schema && `${val}` === '[object Object]') {
						schema.getInvalidSchemaDataFields(val).forEach((k: string) => {
							invalidFields.add(`${valueKey}.${k}`)
						})
					} else {
						if (!this.isValidFieldValue(valueKey as keyof T, val)) {
							invalidFields.add(valueKey);
						}
					}
					
					continue;
				}
				
				if (schemaVal?.type instanceof Schema) {
					if (`${val}` === '[object Object]') {
						schemaVal.type.getInvalidSchemaDataFields(val).forEach((k: string) => {
							invalidFields.add(`${valueKey}.${k}`)
						})
					} else {
						invalidFields.add(valueKey);
					}
					continue;
				}
				
				if (!this.isValidFieldValue(valueKey as keyof T, val)) {
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
		
		const obj: { [k: string]: any } = {};
		
		for (let mapKey in this.#obj) {
			if (this.#obj.hasOwnProperty(mapKey)) {
				const val = this.#obj[mapKey];
				
				switch (true) {
					case val.type instanceof Schema:
						obj[mapKey] = (val.type as Schema<any>).toValue();
						break;
					case val.type === SchemaId:
						obj[mapKey] = (new SchemaId()).defaultValue;
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
