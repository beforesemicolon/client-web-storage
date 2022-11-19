import {SchemaValueConstructorType} from "../types";
import {CustomType} from "./CustomType";
import {Schema} from "../Schema";

export function ArrayOf(type: SchemaValueConstructorType | Schema<any>) {
	const name = `Array<${type instanceof Schema ? `Schema<${type.name}>` : type.name}>`;
	
	const CustomTypeConstructor = class extends CustomType {
		constructor() {
			super(name, type, []);
		}
	}
	
	Object.defineProperty (CustomTypeConstructor, 'name', {value: name});
	
	return CustomTypeConstructor;
}
