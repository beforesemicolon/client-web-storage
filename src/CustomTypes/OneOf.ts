import {SchemaValueConstructorType} from "../types";
import {CustomType} from "./CustomType";
import {Schema} from "../Schema";

export function OneOf(...types: Array<SchemaValueConstructorType | Schema<any>>) {
	if (types.length < 2) {
	    throw new Error('OneOf requires more than single type listed comma separated')
	}
	
	const name = `OneOf<${types.map(t => t instanceof Schema ? `Schema<${t.name}>` : t.name).join(', ')}>`;
	
	const CustomTypeConstructor = class extends CustomType {
		constructor() {
			super(name, types, []);
		}
	}
	
	Object.defineProperty (CustomTypeConstructor, 'name', {value: name});
	
	return CustomTypeConstructor;
}
