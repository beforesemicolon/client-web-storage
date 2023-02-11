import {SchemaObjectLiteral, SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";
import {CustomType} from "./CustomType";
import {isObjectLiteral} from "../utils/is-object-literal";
import {objectToSchema} from "../utils/object-to-schema";

export function OneOf(...types: Array<SchemaObjectLiteral | SchemaValueConstructorType | Schema<any>>): typeof CustomType {
	if (types.length < 2) {
		throw new Error('OneOf requires more than single type listed comma separated')
	}
	
	types = types.map(t => {
		if (isObjectLiteral(t)) {
		  return objectToSchema("", t as SchemaObjectLiteral)
		}
		
		return t;
	})
	
	const name = types
		.map(t => {
			if (t.name === 'OneOf') {
		    throw new Error('Cannot nest "OneOf" types');
			}
			
			const tName = CustomType.getTypeName(t);
			
			if (t instanceof Schema) {
				return tName ? `Schema<${tName}>` : 'Schema'
			}
			
			return tName;
		})
		.join(' | ');
	
	const CustomTypeConstructor = class extends CustomType {
		constructor() {
			super(name, types, null);
		}
	}
	
	Object.defineProperty(CustomTypeConstructor, 'name', {value: 'OneOf'});
	
	return CustomTypeConstructor;
}
