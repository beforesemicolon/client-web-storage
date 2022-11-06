import {SchemaValueConstructorType} from "../types";
import {CustomType} from "./CustomType";

export function ArrayOf(type: SchemaValueConstructorType) {
	const name = `Array<${type.name}>`;
	
	const C = class extends CustomType {
		constructor() {
			super(name, type, []);
		}
	}
	
	Object.defineProperty (C, 'name', {value: name});
	
	return C;
}
