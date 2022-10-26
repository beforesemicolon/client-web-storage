import {Schema} from "./Schema";
import {isSameValueType} from "./utils/is-same-value-type";
import {getDefaultValue} from "./utils/get-default-value";
import {JSONValue, SchemaValueConstructorType, SchemaValueType} from "./types";

export class SchemaValue {
	constructor(
		public type: SchemaValueConstructorType | Schema<any>,
		public required = false,
		public defaultValue: SchemaValueType = null
	) {
		if (defaultValue !== null && !isSameValueType(type, defaultValue)) {
			throw new Error(`Default value "${defaultValue.toString()}" does not match type "${type.name}"`);
		}

		this.defaultValue = defaultValue ?? getDefaultValue(this.type);
	}

	toJSON(): JSONValue {
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