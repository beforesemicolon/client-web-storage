import {SchemaJSON, SchemaValueConstructorType, SchemaValueType} from "../types";
import {Schema} from "../Schema";

export const getDefaultValue = (Type: SchemaValueConstructorType | Schema<any>): SchemaValueType | SchemaJSON => {
	switch (Type) {
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
			return new Type();
		default:
			// Custom types
			if (/SchemaId|ArrayOf|OneOf/.test(Type.name)) {
				// @ts-ignore
				return ((new (Type)()).defaultValue);
			}
			
			if (Type instanceof Schema) {
				return Object.entries(Type.toJSON()).reduce((acc, [k, val]) => ({...acc, [k]: val.defaultValue}), {});
			}
			
			return null;
	}
}
