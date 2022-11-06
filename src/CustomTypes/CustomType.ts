import {SchemaValueConstructorType, SchemaValueType} from "../types";
import {Schema} from "../Schema";

export class CustomType {
	constructor(
		public name: string,
		public type: SchemaValueConstructorType | Schema<any>,
		public defaultValue: SchemaValueType,
	) {
	}
}
