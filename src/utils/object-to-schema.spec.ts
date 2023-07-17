import {objectToSchema} from "./object-to-schema";
import {ArrayOf} from "../CustomTypes/ArrayOf";
import {SchemaId} from "../CustomTypes/SchemaId";
import {Schema} from "../Schema";
import {SchemaValue} from "../SchemaValue";
import {OneOf} from "../CustomTypes/OneOf";

describe('objectToSchema', () => {
	it('should handle primitives and date', () => {
		const schema = objectToSchema('test', {
			$name: 'John Doe',
			description: String,
			visible: true,
			deleted: Boolean,
			yearBorn: 1991,
			age: Number,
			createdDate: new Date(),
			updatedDate: Date,
		});
		
		expect(schema.toValue()).toEqual({
			"age": 0,
			"createdDate": expect.any(Date),
			"deleted": false,
			"description": "",
			"name": "John Doe",
			"updatedDate": expect.any(Date),
			"visible": true,
			"yearBorn": 1991
		})
		expect(schema.getField('age')).toEqual({"defaultValue": 0, "required": false, "type": Number})
		expect(schema.getField('createdDate')).toEqual({"defaultValue": expect.any(Date), "required": false, "type": Date})
		expect(schema.getField('deleted')).toEqual({"defaultValue": false, "required": false, "type": Boolean})
		expect(schema.getField('description')).toEqual({"defaultValue": '', "required": false, "type": String})
		expect(schema.getField('name')).toEqual({"defaultValue": 'John Doe', "required": true, "type": String})
		expect(schema.getField('updatedDate')).toEqual({"defaultValue": null, "required": false, "type": Date})
		expect(schema.getField('visible')).toEqual({"defaultValue": true, "required": false, "type": Boolean})
		expect(schema.getField('yearBorn')).toEqual({"defaultValue": 1991, "required": false, "type": Number})
	});
	
	it('should handle arrays and Blob', () => {
		const schema = objectToSchema('test', {
			$items: [],
			list: Array,
			numbers: [12, 34, 56],
			pair: ['key', 3000],
			names: ArrayOf(String),
			int: new Int16Array(),
			buffer: new ArrayBuffer(16),
			image: new Blob(),
			thumbnail: Blob
		});
		
		expect(schema.toValue()).toEqual({
			"buffer": expect.any(ArrayBuffer),
			"image": expect.any(Blob),
			"int": expect.any(Int16Array),
			"items": [],
			"list": [],
			"names": [],
			"numbers": [
				12,
				34,
				56
			],
			"pair": [
				"key",
				3000
			],
			"thumbnail": null
		})
		expect(schema.getField('buffer')).toEqual({
			"defaultValue": expect.any(ArrayBuffer),
			"required": false,
			"type": ArrayBuffer
		})
		expect(schema.getField('int')).toEqual({
			"defaultValue": expect.any(Int16Array),
			"required": false,
			"type": Int16Array
		})
		expect(schema.getField('items')).toEqual({"defaultValue": [], "required": true, "type": Array})
		expect(schema.getField('list')).toEqual({"defaultValue": [], "required": false, "type": Array})
		expect(schema.getField('pair')).toEqual({"defaultValue": ['key', 3000], "required": false, "type": Array})
		expect(schema.getField('image')).toEqual({"defaultValue": expect.any(Blob), "required": false, "type": Blob})
		expect(schema.getField('thumbnail')).toEqual({"defaultValue": null, "required": false, "type": Blob})
		
		const nameField = schema.getField('names');
		const numbersField = schema.getField('numbers');
		
		expect(nameField?.defaultValue).toEqual([])
		expect(nameField?.required).toEqual(false)
		expect(nameField?.type.name).toEqual('ArrayOf');
		expect(schema.isValidFieldValue('names', [12])).toBeFalsy()
		expect(schema.isValidFieldValue('names', ['str'])).toBeTruthy()
		
		expect(numbersField?.defaultValue).toEqual([12, 34, 56])
		expect(numbersField?.required).toEqual(false)
		expect(numbersField?.type.name).toEqual('ArrayOf');
		expect(schema.isValidFieldValue('numbers', [12])).toBeTruthy()
		expect(schema.isValidFieldValue('numbers', ['str'])).toBeFalsy()
	});
	
	it('should handle custom types', () => {
		const schema = objectToSchema('test', {
			$id: SchemaId,
			user: {
				$id: SchemaId,
				name: String
			},
			items: new Schema('items', {
				id: new SchemaValue(SchemaId, true),
				name: new SchemaValue(String)
			}),
			status: OneOf([String, Number], ""),
			names: ArrayOf(String)
		});
		
		expect(schema.toValue()).toEqual({
			id: expect.any(String),
			items: {
				id: expect.any(String),
				name: ''
			},
			names: [],
			status: "",
			user: {
				id: expect.any(String),
				name: ''
			}
		})
	});
	
	it('should throw if invalid object is provided', () => {
		expect(() => objectToSchema("sample", {})).toThrowError('Invalid "Schema" instance or object')
		// @ts-ignore
		expect(() => objectToSchema("sample", null)).toThrowError('Invalid "Schema" instance or object')
	});
})
