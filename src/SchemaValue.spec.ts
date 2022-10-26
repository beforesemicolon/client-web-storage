import {SchemaValue} from "./SchemaValue";
import {SchemaId} from "./SchemaId";

describe('SchemaValue', () => {
	it('should create', () => {
		expect((new SchemaValue(Number)).toJSON()).toEqual({
			"defaultValue": 0,
			"required": false,
			"type": "Number"
		})
		expect((new SchemaValue(Number)).toString()).toEqual("{\n" +
			"    \"type\": \"Number\",\n" +
			"    \"required\": false,\n" +
			"    \"defaultValue\": 0\n" +
			"}")
		expect((new SchemaValue(SchemaId, true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": null,
			"required": true,
			"type": "SchemaId"
		}))
		expect((new SchemaValue(String, false, "sample")).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": "sample",
			"required": false,
			"type": "String"
		}))
	});

	it('should throw error if invalid default value type', () => {
		expect(() => new SchemaValue(String, false, 12)).toThrowError(`Default value "12" does not match type "String"`)
		expect(() => new SchemaValue(SchemaId, true, "sample")).toThrowError(`Default value "sample" does not match type "SchemaId"`)
		expect(() => new SchemaValue(SchemaId, true, {} as any)).toThrowError(`Default value "[object Object]" does not match type "SchemaId"`)
	});
})