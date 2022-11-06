import {SchemaValue} from "./SchemaValue";
import {SchemaId} from "./CustomTypes/SchemaId";
import {ArrayOf} from "./CustomTypes/ArrayOf";
import {Schema} from "./Schema";

describe('SchemaValue', () => {
	it('should create', () => {
		const userSchema = new Schema<any>("user");
		const todoSchema = new Schema<any>("todo");
		
		userSchema.defineField("name", String, {required: true});
		
		todoSchema.defineField("name", String, {required: true});
		todoSchema.defineField("description", String);
		todoSchema.defineField("complete", Boolean);
		todoSchema.defineField("user", userSchema, {required: true});

		expect((new SchemaValue(todoSchema)).toJSON()).toEqual({
			"defaultValue": {
				"complete": false,
				"createdDate": null,
				"description": "",
				"id": expect.any(String),
				"lastUpdatedDate": null,
				"name": "",
				"user": {
					"createdDate": null,
					"id": expect.any(String),
					"lastUpdatedDate": null,
					"name": ""
				}
			},
			"required": false,
			"type": "Schema<todo>"
		})
		expect((new SchemaValue(Number)).toJSON()).toEqual({
			"defaultValue": 0,
			"required": false,
			"type": "Number"
		})
		expect((new SchemaValue(String, false, "sample")).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": "sample",
			"required": false,
			"type": "String"
		}))
		expect((new SchemaValue(Boolean)).toJSON()).toEqual({
			"defaultValue": false,
			"required": false,
			"type": "Boolean"
		})
		expect((new SchemaValue(Date)).toJSON()).toEqual({
			"defaultValue": null,
			"required": false,
			"type": "Date"
		})
		expect((new SchemaValue(Blob)).toJSON()).toEqual({
			"defaultValue": null,
			"required": false,
			"type": "Blob"
		})
		expect((new SchemaValue(ArrayBuffer)).toJSON()).toEqual({
			"defaultValue": null,
			"required": false,
			"type": "ArrayBuffer"
		})
		expect((new SchemaValue(Int32Array)).toJSON()).toEqual({
			"defaultValue": expect.any(Int32Array),
			"required": false,
			"type": "Int32Array"
		})
		expect((new SchemaValue(SchemaId, true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": expect.any(String),
			"required": true,
			"type": "SchemaId"
		}))
		expect((new SchemaValue(ArrayOf(String), true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [],
			"required": true,
			"type": "Array<String>"
		}))
		expect((new SchemaValue(ArrayOf(userSchema), true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [],
			"required": true,
			"type": "Array<Schema<user>>"
		}))
		expect((new SchemaValue(ArrayOf(ArrayOf(Number)), true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [],
			"required": true,
			"type": "Array<Array<Number>>"
		}))
		expect((new SchemaValue(Array, true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [],
			"required": true,
			"type": "Array"
		}))
	});

	it('should throw error if invalid default value type', () => {
		expect(() => new SchemaValue(String, false, 12)).toThrowError(`Default value does not match type "String"`)
		expect(() => new SchemaValue(Number, false, true)).toThrowError(`Default value does not match type "Number"`)
		expect(() => new SchemaValue(Boolean, false, "")).toThrowError(`Default value does not match type "Boolean"`)
		expect(() => new SchemaValue(Date, false, null)).toThrowError(`Default value does not match type "Date"`)
		expect(() => new SchemaValue(Date, false)).not.toThrowError()
		expect(() => new SchemaValue(ArrayBuffer, true, [])).toThrowError(`Default value does not match type "ArrayBuffer"`)
		expect(() => new SchemaValue(Int32Array, true, [])).toThrowError(`Default value does not match type "Int32Array"`)
		expect(() => new SchemaValue(Blob, true, {})).toThrowError(`Default value does not match type "Blob"`)
		expect(() => new SchemaValue(new Schema<any>("user"), true, {})).toThrowError(`Default value does not match type "Schema<user>"`)
		expect(() => new SchemaValue(SchemaId, true, "sample")).toThrowError(`Default value does not match type "SchemaId"`)
		expect(() => new SchemaValue(SchemaId, true, {} as any)).toThrowError(`Default value does not match type "SchemaId"`)
		expect(() => new SchemaValue(ArrayOf(String), true, 12)).toThrowError(`Default value does not match type "Array<String>"`)
		expect(() => new SchemaValue(ArrayOf(String), true)).not.toThrowError()
	});
})
