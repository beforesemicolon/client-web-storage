import {SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";
import {isSupportedTypeValue} from "./is-supported-type-value";
import {isOfSupportedType} from "./is-of-supported-type";

export const isSameValueType = (type: SchemaValueConstructorType | Schema<any>, value: any): boolean => {
	try {
		if (/Array<.+>/.test(type.name)) {
			const Type = (new (type as any)());
			
			return value instanceof Array && !value.some(v => !isSameValueType(Type.type, v))
		}
		
		if (value instanceof Array && value.some(v => !isSupportedTypeValue(v))) {
			return false;
		}
		
		if (/OneOf<.+>/.test(type.name)) {
			return new (type as any)().type.some((t: SchemaValueConstructorType | Schema<any>) => isSameValueType(t, value))
		}
		
		return isOfSupportedType(type, value);
	} catch (e) {
		return false
	}
}
