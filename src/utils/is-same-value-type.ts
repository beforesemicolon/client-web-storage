import {SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";

export const isSameValueType = (type: SchemaValueConstructorType | Schema<any>, value: any) => {
	try {
		if (/OneOf<.+>/.test(type.name)) {
			const c = new (type as any)();
			// @ts-ignore
			return c.type.some(t => value instanceof t || typeof value === t.name.toLowerCase())
		}
		
		// @ts-ignore
		return value instanceof type || typeof value === type.name.toLowerCase()
	} catch (e) {
		return false
	}
}
