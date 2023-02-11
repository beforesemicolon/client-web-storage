import {Schema} from "../Schema";
import {getSchemaTypeAndDefaultValueFromValue} from "./get-schema-type-and-default-value-from-value";
import {SchemaObjectLiteral} from "../types";
import {isValidObjectLiteral} from "../utils/is-valid-object-literal";
import {errorMessages} from "../utils/error-messages";

export const objectToSchema = (name: string, schemaData: SchemaObjectLiteral): Schema<any> => {
	if (!isValidObjectLiteral(schemaData)) {
		throw new Error(errorMessages.invalidSchema())
	}
	
	const schema = new Schema(name);
	
	Object.entries(schemaData)
		.forEach(([key, val]) => {
			key = `${key}`;
			const required = key.startsWith('$');
			
			if (required) {
				key = `${key}`.slice(1);
			}
			
			let {type, defaultValue} = getSchemaTypeAndDefaultValueFromValue(val)
			
			if (!type) {
				throw new Error(`Unsupported Schema Type => key: "${key}", type: "${val?.constructor?.name ?? typeof val}" (estimated)`)
			}
			
			if (type === Schema && `${defaultValue}` === '[object Object]') {
				type = objectToSchema(key, defaultValue as SchemaObjectLiteral);
				defaultValue = undefined
			}

			// @ts-ignore
			schema.defineField(key, type, {
				required,
				...(defaultValue === null ? {} : {defaultValue})
			})
		});
	
	return schema;
}
