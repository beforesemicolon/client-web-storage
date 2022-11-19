import {isSameValueType} from "./utils/is-same-value-type";
import {getDefaultValue} from "./utils/get-default-value";
import {JSONValue, SchemaJSON, SchemaValueConstructorType, SchemaValueType} from "./types";
import {Schema} from "./Schema";

export class SchemaValue {
	#type: string = "";
	
	constructor(
		public type: SchemaValueConstructorType | Schema<any>,
		public required = false,
		public defaultValue?: SchemaValueType | SchemaJSON
	) {
		this.#type = this.type instanceof Schema ? `Schema<${this.type.name}>` : this.type.name
		
		if (defaultValue !== undefined && !isSameValueType(type, defaultValue)) {
			throw new Error(`Default value does not match type "${this.#type}"`);
		}

		this.defaultValue = defaultValue ?? getDefaultValue(this.type);
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
