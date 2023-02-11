import {SchemaObjectLiteral, SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";
import {CustomType} from "./CustomType";
import {isObjectLiteral} from "../utils/is-object-literal";
import {objectToSchema} from "../utils/object-to-schema";

export function ArrayOf(type: SchemaObjectLiteral | SchemaValueConstructorType | Schema<any>) {
	const typeName = CustomType.getTypeName(type);
	
	if (isObjectLiteral(type)) {
		type = objectToSchema(typeName, type as SchemaObjectLiteral);
	}
	
	const name = `Array<${type instanceof Schema
		? (typeName ? `Schema<${typeName}>` : "Schema")
		: typeName}>`;
	
	const CustomTypeConstructor = class extends CustomType {
		constructor() {
			super(name, type, []);
		}
	}
	
	Object.defineProperty (CustomTypeConstructor, 'name', {value: 'ArrayOf'});
	
	return CustomTypeConstructor;
}
