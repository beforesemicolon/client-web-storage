import {SchemaValueConstructorType, SchemaValueType} from "../types";
import {Schema} from "../Schema";

export const getDefaultValue = (type: SchemaValueConstructorType | Schema<any>): SchemaValueType => {
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