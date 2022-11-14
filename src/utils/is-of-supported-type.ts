import {SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";
import {isNil} from "./is-nil";

export const isOfSupportedType = (type:  SchemaValueConstructorType | Schema<any>, value: any) => {
	if ((typeof value === "number" && isNaN(value)) || (!value && isNil(value))) {
		return false;
	}
	
	try {
		if (type instanceof Schema) {
			return value === type || `${value}` === '[object Object]' && type.getInvalidSchemaDataFields(value).length === 0;
		}
		
		const typeOf = typeof value === type.name.toLowerCase();
		
		// @ts-ignore
		return (type[Symbol.hasInstance] ? value instanceof type : typeOf) || typeOf;
	} catch (e) {
		return false
	}
}
