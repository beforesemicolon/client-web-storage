import {Schema} from "../Schema";
import {SchemaId} from "../CustomTypes/SchemaId";
import {SchemaValueConstructorType} from "../types";
import {CustomType} from "../CustomTypes/CustomType";

export const isSupportedType = (value: SchemaValueConstructorType): boolean => {
	const valueTypeName = ((value || {name: ''}) as unknown as CustomType).name;
	
	return /ArrayOf|OneOf/.test(valueTypeName) || [
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
	].some(type => {
		return value === type;
	})
}
