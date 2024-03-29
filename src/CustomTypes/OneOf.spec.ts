import {OneOf} from "./OneOf";
import {SchemaObjectLiteral, SchemaValueConstructorType} from "../types";
import {Schema} from "../Schema";
import {ArrayOf} from "./ArrayOf";
import {SchemaValue} from "../SchemaValue";
import {Null} from "./Null";

describe('OneOf', () => {
	const getOneOfInstance = (types: Array<SchemaObjectLiteral | SchemaValueConstructorType | Schema<any>>, def: any) => {
		// @ts-ignore
		return new (OneOf(types, def))()
	}
	
	it('should have to correct name', () => {
		expect(getOneOfInstance([Number, Null], null).name).toBe('Number | Null');
		expect(getOneOfInstance([String, Number], "").name).toBe('String | Number');
		expect(getOneOfInstance([String, Boolean], false).name).toBe('String | Boolean');
		expect(getOneOfInstance([Date, Boolean], false).name).toBe('Date | Boolean');
		expect(getOneOfInstance([Array, String], "").name).toBe('Array | String');
		expect(getOneOfInstance([ArrayOf(String), ArrayOf(Number)], []).name).toBe('Array<String> | Array<Number>');
		expect(getOneOfInstance([ArrayOf(OneOf([String, Number], "")), ArrayOf(OneOf([String, Boolean], ""))], []).name).toBe('Array<String | Number> | Array<String | Boolean>');
		expect(getOneOfInstance([ArrayOf(OneOf([String, Number], "")), ArrayOf(OneOf([String, Boolean], ""))], []).name).toBe('Array<String | Number> | Array<String | Boolean>');
		expect(getOneOfInstance([ArrayOf(OneOf([Date, Boolean], false)), Number], []).name).toBe('Array<Date | Boolean> | Number');
		expect(getOneOfInstance([Float32Array, Float64Array], new Float32Array()).name).toBe('Float32Array | Float64Array');
		expect(getOneOfInstance([Int8Array, Int16Array, Int32Array], new Int8Array()).name).toBe('Int8Array | Int16Array | Int32Array');
		expect(getOneOfInstance([Uint8Array, Uint16Array, Uint32Array], new Uint8Array()).name).toBe('Uint8Array | Uint16Array | Uint32Array');
		expect(getOneOfInstance([new Schema("test", {name: new SchemaValue(String)}), Array], {}).name).toBe('Schema<test> | Array');
		expect(getOneOfInstance([{
			$name: String
		}, Array], []).name).toBe('Schema | Array');
	});
	
	it('should throw error if only one type is provided', () => {
		expect(() => getOneOfInstance([String], "")).toThrowError('OneOf requires more than single type listed comma separated');
	});
	
	it('should throw error if provided a OneOf', () => {
		expect(() => getOneOfInstance([OneOf([Date, Boolean], false), Number], 12)).toThrowError('Cannot nest "OneOf" types');
	});
})
