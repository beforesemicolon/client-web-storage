import {SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";

export const isSameValueType = (type: SchemaValueConstructorType | Schema<any>, value: any) => {
	try {
		// @ts-ignore
		return value instanceof type || typeof value === type.name.toLowerCase()
	} catch (e) {
		return false
	}
}