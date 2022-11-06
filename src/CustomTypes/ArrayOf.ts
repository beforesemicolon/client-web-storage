import {SchemaValueConstructorType} from "../types";
import {CustomType} from "./CustomType";
import {Schema} from "../Schema";

export function ArrayOf(type: SchemaValueConstructorType | Schema<any>) {
	const name = `Array<${type instanceof Schema ? `Schema<${type.name}>` : type.name}>`;
	
	const C = class extends CustomType {
		constructor() {
			super(name, type, []);
		}
	}
	
	Object.defineProperty (C, 'name', {value: name});
	
	return C;
}
