import {SchemaValue} from "./SchemaValue";
import {SchemaId} from "./CustomTypes/SchemaId";
import {ArrayOf} from "./CustomTypes/ArrayOf";
import {Schema} from "./Schema";
import {OneOf} from "./CustomTypes/OneOf";
import {Null} from "./CustomTypes/Null";

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
				"description": "",
				"name": "",
				"user": {
					"name": ""
				}
			},
			"required": false,
			"type": "Schema<todo>"
		})
		expect((new SchemaValue(todoSchema)).toJSON()).toEqual({
			"defaultValue": {
				"complete": false,
				"description": "",
				"name": "",
				"user": {
					"name": ""
				}
			},
			"required": false,
			"type": "Schema<todo>"
		})
		expect((new SchemaValue(Schema, false, {})).toJSON()).toEqual({
			"defaultValue": {},
			"required": false,
			"type": "Schema"
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
		expect((new SchemaValue(Blob, false)).toJSON()).toEqual({
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
		expect((new SchemaValue(Array, true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [],
			"required": true,
			"type": "Array"
		}))
		expect((new SchemaValue(ArrayOf(String), true, [])).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [],
			"required": true,
			"type": "Array<String>"
		}))
		expect((new SchemaValue(ArrayOf({$name: String}), true, [])).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [],
			"required": true,
			"type": "Array<Schema>"
		}))
		expect((new SchemaValue(OneOf([String, Number], ""), false, 12)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": 12,
			"required": false,
			"type": "String | Number"
		}))
		expect((new SchemaValue(OneOf([String, {name: String}], ""), false, "john doe")).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": "john doe",
			"required": false,
			"type": "String | Schema"
		}))
		
		expect((new SchemaValue(OneOf([Number, Null], 12), false)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": 12,
			"required": false,
			"type": "Number | Null"
		}))
		
		expect((new SchemaValue(ArrayOf(OneOf([String, Number], "")), false, [0, 1, 2])).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": [0, 1, 2],
			"required": false,
			"type": "Array<String | Number>"
		}))
		
		expect((new SchemaValue(Null, true)).toJSON()).toEqual(expect.objectContaining({
			"defaultValue": null,
			"required": true,
			"type": "Null"
		}))
	});

	it('should throw error if invalid default value type', () => {
		const userSchema = new Schema<any>("user");

		userSchema.defineField("name", String, {required: true});

		expect(() => new SchemaValue(Blob, true, null)).toThrowError(`Default value does not match type "Blob"`)
		expect(() => new SchemaValue(SchemaId, true, null)).toThrowError(`Default value does not match type "SchemaId"`)
		expect(() => new SchemaValue(String, false, 12)).toThrowError(`Default value does not match type "String"`)
		expect(() => new SchemaValue(Number, false, true)).toThrowError(`Default value does not match type "Number"`)
		expect(() => new SchemaValue(Boolean, false, "")).toThrowError(`Default value does not match type "Boolean"`)
		expect(() => new SchemaValue(Date, false, null)).toThrowError(`Default value does not match type "Date"`)
		expect(() => new SchemaValue(Date, false, new Date())).not.toThrowError()
		expect(() => new SchemaValue(Date, false)).not.toThrowError()
		expect(() => new SchemaValue(ArrayBuffer, true, [])).toThrowError(`Default value does not match type "ArrayBuffer"`)
		expect(() => new SchemaValue(Int32Array, true, [])).toThrowError(`Default value does not match type "Int32Array"`)
		expect(() => new SchemaValue(Blob, true, {})).toThrowError(`Default value does not match type "Blob"`)
		expect(() => new SchemaValue(userSchema, true, {})).toThrowError(`Default value does not match type "Schema<user>"`)
		expect(() => new SchemaValue(SchemaId, true, "sample")).toThrowError(`Default value does not match type "SchemaId"`)
		expect(() => new SchemaValue(SchemaId, true, {} as any)).toThrowError(`Default value does not match type "SchemaId"`)
		expect(() => new SchemaValue(OneOf([String], ""), false, 12)).toThrowError(`OneOf requires more than single type listed comma separated`)
		expect(() => new SchemaValue(OneOf([String, Boolean], ""), false, 12)).toThrowError('Default value does not match type "String | Boolean"')
		expect(() => new SchemaValue(OneOf([String, Boolean], ""), false, false)).not.toThrowError()
		expect(() => new SchemaValue(OneOf([String, OneOf([Number, Boolean], false)], ""), false, false)).toThrowError('Cannot nest "OneOf" types')
		expect(() => new SchemaValue(ArrayOf(String), true, 12)).toThrowError('Default value does not match type "Array<String>"')
		expect(() => new SchemaValue(ArrayOf(String), true)).not.toThrowError()
		expect(() => new SchemaValue(Null, true)).not.toThrowError()
		expect(() => new SchemaValue(Null, true, undefined)).not.toThrowError()
	});
	
	it('should throw error if invalid value type', () => {
		// @ts-ignore
		expect(() => new SchemaValue(Function)).toThrowError(`Invalid SchemaValue type provided. Received "Function"`)
	});
})
