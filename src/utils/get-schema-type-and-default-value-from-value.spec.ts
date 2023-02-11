import {getSchemaTypeAndDefaultValueFromValue} from "./get-schema-type-and-default-value-from-value";
import {ArrayOf} from "../CustomTypes/ArrayOf";
import {OneOf} from "../CustomTypes/OneOf";
import {SchemaId} from "../CustomTypes/SchemaId";
import {Schema} from "../Schema";

describe('getSchemaTypeAndDefaultValueFromValue', () => {
	it('should ', () => {
		expect(1).toBe(1)
	});
	
	it('should handle primitives', () => {
		expect(getSchemaTypeAndDefaultValueFromValue(12)).toEqual({
			defaultValue: 12,
			type: Number
		})
		expect(getSchemaTypeAndDefaultValueFromValue(Number)).toEqual({
			defaultValue: 0,
			type: Number
		})
		expect(getSchemaTypeAndDefaultValueFromValue('str')).toEqual({
			defaultValue: 'str',
			type: String
		})
		expect(getSchemaTypeAndDefaultValueFromValue(String)).toEqual({
			defaultValue: '',
			type: String
		})
		expect(getSchemaTypeAndDefaultValueFromValue(false)).toEqual({
			defaultValue: false,
			type: Boolean
		})
		expect(getSchemaTypeAndDefaultValueFromValue(Boolean)).toEqual({
			defaultValue: false,
			type: Boolean
		})
	});

	it('should handle date', () => {
		const date = new Date();

		expect(getSchemaTypeAndDefaultValueFromValue(date)).toEqual({
			defaultValue: date,
			type: Date
		})
		expect(getSchemaTypeAndDefaultValueFromValue(Date)).toEqual({
			defaultValue: null,
			type: Date
		})
		expect(getSchemaTypeAndDefaultValueFromValue(Date.now())).toEqual({
			defaultValue: expect.any(Number),
			type: Number
		})
	});

	it('should handle Array', () => {
		expect(getSchemaTypeAndDefaultValueFromValue([])).toEqual({
			defaultValue: [],
			type: Array
		})
		expect(getSchemaTypeAndDefaultValueFromValue([12, 'str'])).toEqual({
			defaultValue: [12, 'str'],
			type: Array
		})
		expect(getSchemaTypeAndDefaultValueFromValue(Array)).toEqual({
			defaultValue: [],
			type: Array
		})
		expect(getSchemaTypeAndDefaultValueFromValue(new Array())).toEqual({
			defaultValue: [],
			type: Array
		})
		expect(getSchemaTypeAndDefaultValueFromValue(Array())).toEqual({
			defaultValue: [],
			type: Array
		})
	});

	it('should handle ArrayBuffer', () => {
		const buffer = new ArrayBuffer(12);

		expect(getSchemaTypeAndDefaultValueFromValue(buffer)).toEqual({
			defaultValue: buffer,
			type: ArrayBuffer
		})
		expect(getSchemaTypeAndDefaultValueFromValue(ArrayBuffer)).toEqual({
			defaultValue: null,
			type: ArrayBuffer
		})
	});

	it('should handle ArrayOf', () => {
		let res = getSchemaTypeAndDefaultValueFromValue([12, 34, 7]);

		expect(res.defaultValue).toEqual([12, 34, 7]);
		expect(res.type?.name).toEqual('ArrayOf');

		res = getSchemaTypeAndDefaultValueFromValue(ArrayOf(String));

		expect(res.defaultValue).toEqual([]);
		expect(res.type?.name).toEqual('ArrayOf');
	});

	it('should handle Typed Array', () => {
		[
			new Float32Array(),
			new Float64Array(),
			new Int8Array(),
			new Int16Array(),
			new Int32Array(),
			new Uint8Array(),
			new Uint8ClampedArray(),
			new Uint16Array(),
			new Uint32Array(),
		].forEach(val => {
			expect(getSchemaTypeAndDefaultValueFromValue(val)).toEqual({
				defaultValue: val,
				type: val.constructor
			})

			// @ts-ignore
			expect(getSchemaTypeAndDefaultValueFromValue(val.constructor)).toEqual({
				// @ts-ignore
				defaultValue: new val.constructor(),
				type: val.constructor
			})
		})
	});

	it('should handle Blob', () => {
		const blob = new Blob([]);
		expect(getSchemaTypeAndDefaultValueFromValue(blob)).toEqual({
			defaultValue: blob,
			type: Blob
		})
		expect(getSchemaTypeAndDefaultValueFromValue(Blob)).toEqual({
			defaultValue: null,
			type: Blob
		})
	});

	it('should handle OneOf', () => {
		let res = getSchemaTypeAndDefaultValueFromValue(OneOf(String, Number));

		expect(res.defaultValue).toEqual(null);
		expect(res.type?.name).toEqual('OneOf');
	});

	it('should handle SchemaId', () => {
		let res = getSchemaTypeAndDefaultValueFromValue(SchemaId);

		expect(res.defaultValue).toEqual(expect.any(String));
		expect(res.type).toEqual(SchemaId);
		expect(res.type?.name).toEqual('SchemaId');

		res = getSchemaTypeAndDefaultValueFromValue(new  SchemaId());

		expect(res.defaultValue).toEqual(expect.any(String));
		expect(res.type).toEqual(SchemaId);
		expect(res.type?.name).toEqual('SchemaId');
	});

	it('should handle Schema', () => {
		const schema = new Schema('test');
		let res = getSchemaTypeAndDefaultValueFromValue(schema);

		expect(res.defaultValue).toEqual({});
		expect(res.type).toEqual(Schema);

		res = getSchemaTypeAndDefaultValueFromValue(Schema);

		expect(res.defaultValue).toEqual(null);
		expect(res.type).toEqual(Schema);
	});

	it('should handle Object literal', () => {
		let res = getSchemaTypeAndDefaultValueFromValue({});

		expect(res).toEqual({type: Schema, defaultValue: {}});
	});

	it('should handle any other', () => {
		let res = getSchemaTypeAndDefaultValueFromValue(null);

		expect(res).toEqual({type: null, defaultValue: null});
	});
});
