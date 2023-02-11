import {SchemaObjectLiteral, SchemaValueConstructorType, SchemaValueType} from "../types";
import {Schema} from "../Schema";
import {isObjectLiteral} from "../utils/is-object-literal";

export class CustomType {
	constructor(
		public name: string,
		public type: SchemaObjectLiteral | SchemaValueConstructorType | Schema<any> | Array<SchemaObjectLiteral | SchemaValueConstructorType | Schema<any>>,
		public defaultValue: SchemaValueType,
	) {
	}
	static getTypeName(type: SchemaObjectLiteral | SchemaValueConstructorType | Schema<any>) {
		if (isObjectLiteral(type)) {
	    return "";
		}
		
		let typeInstance: any;
		const isSchema = type instanceof Schema;
		
		try {
			if (isSchema) {
				typeInstance = type;
			} else {
				// @ts-ignore
				typeInstance = new type();
				
				if (!(typeInstance instanceof CustomType)) {
					typeInstance = type;
				}
			}
		} catch(e) {}
		
		return typeInstance.name;
	}
}
