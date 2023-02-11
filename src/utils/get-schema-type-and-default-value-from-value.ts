import {SchemaJSON, SchemaValueConstructorType, SchemaValueType, SchemaObjectLiteral} from "../types";
import {ArrayOf} from "../CustomTypes/ArrayOf";
import {getDefaultValue} from "./get-default-value";
import {Schema} from "../Schema";
import {isSupportedType} from "./is-supported-type";
import {SchemaId} from "../CustomTypes/SchemaId";

export const getSchemaTypeAndDefaultValueFromValue = (value: SchemaValueType | SchemaValueConstructorType | SchemaObjectLiteral): {
	type: SchemaValueConstructorType | Schema<any> | null,
	defaultValue: SchemaValueType | SchemaJSON | SchemaObjectLiteral | undefined
} => {
	let type: SchemaValueConstructorType | null = null;
	let defaultValue = value as SchemaValueType;
	
	switch (typeof value) {
		case 'string':
			type = String;
			break;
		case 'number':
			type = Number;
			break;
		case 'boolean':
			type = Boolean;
			break;
		case 'object': // handles all non-primitives instances
			if (value instanceof Date) {
				return {type: Date, defaultValue};
			}
			
			if (Array.isArray(value)) {
				if (value.length) {
					const {type: firstItemType} = getSchemaTypeAndDefaultValueFromValue(value[0]);
					
					if (value.every(item => getSchemaTypeAndDefaultValueFromValue(item).type === firstItemType)) {
						return {type: ArrayOf(firstItemType as SchemaValueConstructorType), defaultValue: value};
					}
				}
				
				return {type: Array, defaultValue};
			}
			
			// handle typed array
			if (ArrayBuffer.isView(value)) {
				return {type: (value as any).constructor, defaultValue};
			}
			
			if (value instanceof ArrayBuffer) {
				return {type: ArrayBuffer, defaultValue};
			}
			
			if (value instanceof Blob) {
				return {type: Blob, defaultValue};
			}
			
			if (value instanceof Schema) {
				return {type: Schema, defaultValue: value.toValue()};
			}
			
			if (value instanceof SchemaId) {
				return {type: SchemaId, defaultValue: value.defaultValue};
			}
			
			if (`${value}` === '[object Object]') {
				return {type: Schema, defaultValue: value};
			}
			
			return {type: null, defaultValue};
		default: // handles all constructors
			return isSupportedType(value)
				? {
					type: value,
					defaultValue: getDefaultValue(value)
				}
				: {type: null, defaultValue}
	}
	
	return {type, defaultValue};
}
