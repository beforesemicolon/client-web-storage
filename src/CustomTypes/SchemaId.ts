import {generateUUID} from "../utils/generate-uuid";
import {CustomType} from "./CustomType";

export class SchemaId extends CustomType {
	constructor() {
		super('SchemaId', String, (() => {
			try {
				return crypto.randomUUID();
			} catch (e) {
				return generateUUID();
			}
		})());
	}
}