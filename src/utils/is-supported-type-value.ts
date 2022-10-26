import {Schema} from "../Schema";
import {SchemaId} from "../SchemaId";

export const isSupportedTypeValue = (value: any): boolean => {
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
		Uint32Array,
	].some(type => value instanceof type || typeof value === type.name.toLowerCase())
}