import {isSameValueType} from "./is-same-value-type";
import {ArrayOf} from "../CustomTypes/ArrayOf";
import {OneOf} from "../CustomTypes/OneOf";
import {SchemaId} from "../CustomTypes/SchemaId";
import {Schema} from "../Schema";
import {Null} from "../CustomTypes/Null";

describe("isSameValueType", () => {
	it('should handle Array', () => {
		expect(isSameValueType(Array, [undefined])).toBeFalsy()
	});
	
	it('should handle ArrayOf', () => {
		expect(isSameValueType(ArrayOf(String), [12])).toBeFalsy()
		expect(isSameValueType(ArrayOf(String), ["str"])).toBeTruthy()
	});
	
	it('should handle OneOf', () => {
		expect(isSameValueType(OneOf(String, Number), null)).toBeFalsy()
		expect(isSameValueType(OneOf(String, Number), 12)).toBeTruthy()
		expect(isSameValueType(OneOf(String, Number), "str")).toBeTruthy()
	});
	
	it('should handle SchemaId', () => {
		expect(isSameValueType(SchemaId, null)).toBeFalsy()
		expect(isSameValueType(SchemaId, "ddd")).toBeFalsy()
		expect(isSameValueType(SchemaId, new SchemaId())).toBeTruthy()
		expect(isSameValueType(SchemaId, new SchemaId().defaultValue)).toBeTruthy()
	});
	
	it('should handle Schema', () => {
		expect(isSameValueType(Schema, null)).toBeFalsy()
		expect(isSameValueType(Schema, {})).toBeTruthy()
	});
	
	it('should handle Null', () => {
		expect(isSameValueType(Null, null)).toBeTruthy()
		expect(isSameValueType(Null, {})).toBeFalsy()
		expect(isSameValueType(Null, undefined)).toBeFalsy()
	});
	
	it('should handle error', () => {
		// @ts-ignore
		expect(isSameValueType({name: "OneOf"}, "1")).toBeFalsy()
	});
})
