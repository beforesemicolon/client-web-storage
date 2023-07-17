import {SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";
import {Null} from "../CustomTypes/Null";

export const isOfSupportedType = (type:  SchemaValueConstructorType | Schema<any>, value: any) => {
	if(type === Null) {
		return value === null;
	}
	
	if ((typeof value === "number" && isNaN(value)) || (!value && value === undefined)) {
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
		// likely errors: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/invalid_right_hand_side_instanceof_operand#examples
		return false
	}
}
