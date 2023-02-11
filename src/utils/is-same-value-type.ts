import {SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";
import {isSupportedTypeValue} from "./is-supported-type-value";
import {isOfSupportedType} from "./is-of-supported-type";
import {SchemaId} from "../CustomTypes/SchemaId";

export const isSameValueType = (type: SchemaValueConstructorType | Schema<any>, value: any): boolean => {
	try {
		if (value instanceof Array && value.some(v => !isSupportedTypeValue(v))) {
			return false;
		}
		
		if (/ArrayOf/.test(type?.name)) {
			const Type = (new (type as any)());
			
			return value instanceof Array && !value.some(v => !isSameValueType(Type.type, v))
		}
		
		if (/OneOf/.test(type?.name)) {
			return new (type as any)().type.some((t: SchemaValueConstructorType | Schema<any>) => isSameValueType(t, value))
		}
		
		if (/SchemaId/.test(type?.name)) {
			return value instanceof SchemaId || (typeof value === 'string' && /[0-9a-z]{8}-[0-9a-z]{4}-4[0-9a-z]{3}-[0-9a-z]{4}-[0-9a-z]{12}/.test(value))
		}
		
		if (/Schema/.test(type?.name)) {
			return `${value}` === '[object Object]';
		}
		
		return isOfSupportedType(type, value);
	} catch (e) {
		return false
	}
}
