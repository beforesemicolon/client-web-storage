import {isSameValueType} from "./utils/is-same-value-type";
import {getDefaultValue} from "./utils/get-default-value";
import {JSONValue, SchemaJSON, SchemaValueConstructorType, SchemaValueType} from "./types";
import {Schema} from "./Schema";
import {CustomType} from "./CustomTypes/CustomType";
import {SchemaId} from "./CustomTypes/SchemaId";
import {isSupportedType} from "./utils/is-supported-type";

export class SchemaValue {
	#type: string = "";
	
	constructor(
		public type: SchemaValueConstructorType | Schema<any>,
		public required = false,
		public defaultValue?: SchemaValueType | SchemaJSON
	) {
		if (!(type instanceof Schema) && !isSupportedType(type as SchemaValueConstructorType)) {
				// @ts-ignore
		    throw new Error(`Invalid SchemaValue type provided. Received "${type?.name ?? (new type())?.name}"`)
		}
		
		this.#type = this.type instanceof Schema
			? `Schema<${this.type.name}>`
			: /ArrayOf|OneOf|SchemaId|Null/.test(type.name)
				// @ts-ignore
				? (new type()).name
				: this.type.name
		
		// if the default value is not undefined treat it as value set
		// and make sure it is of same type
		if (defaultValue !== undefined && !isSameValueType(type, defaultValue)) {
			throw new Error(`Default value does not match type "${this.#type}"`);
		}
		
		this.defaultValue = defaultValue !== undefined ?
			defaultValue instanceof CustomType || defaultValue instanceof SchemaId
				? defaultValue.defaultValue
				: defaultValue : getDefaultValue(this.type);
	}
	
	toJSON(): JSONValue {
		return {
			type: this.#type,
			required: this.required,
			defaultValue: this.defaultValue as SchemaValueType | SchemaJSON
		}
	}
	
	toString() {
		return JSON.stringify(this.toJSON(), null, 4)
	}
}
