import {isOfSupportedType} from "./is-of-supported-type";
import {Schema} from "../Schema";
import {SchemaValue} from "../SchemaValue";
import {Null} from "../CustomTypes/Null";

describe('isOfType', () => {
	it('should always be false for nil and NaN values', () => {
		expect(isOfSupportedType(String, null)).toBeFalsy()
		expect(isOfSupportedType(Boolean, undefined)).toBeFalsy()
		expect(isOfSupportedType(Number, NaN)).toBeFalsy()
	});
	
	it('should match String', () => {
		expect(isOfSupportedType(String, 'sample')).toBeTruthy()
		expect(isOfSupportedType(String, ``)).toBeTruthy()
		expect(isOfSupportedType(String, "")).toBeTruthy()
		expect(isOfSupportedType(String, String("str"))).toBeTruthy()
		expect(isOfSupportedType(String, new String("sample"))).toBeTruthy()
	});
	
	it('should match Number', () => {
		expect(isOfSupportedType(Number, Infinity)).toBeTruthy()
		expect(isOfSupportedType(Number, 0)).toBeTruthy()
		expect(isOfSupportedType(Number, new Number(112))).toBeTruthy()
	});
	
	it('should match Boolean', () => {
		expect(isOfSupportedType(Boolean, false)).toBeTruthy()
		expect(isOfSupportedType(Boolean, new Boolean(true))).toBeTruthy()
	});
	
	it('should match Date', () => {
		expect(isOfSupportedType(Date, new Date())).toBeTruthy()
		expect(isOfSupportedType(Date, Date.now())).toBeFalsy()
	});
	
	it('should match Array', () => {
		expect(isOfSupportedType(Array, new Array())).toBeTruthy()
		expect(isOfSupportedType(Array, [])).toBeTruthy()
		expect(isOfSupportedType(Array, new Int32Array())).toBeFalsy()
		expect(isOfSupportedType(Array, new ArrayBuffer(8))).toBeFalsy()
	});
	
	it('should match Typed Array', () => {
		expect(isOfSupportedType(Int32Array, new Array())).toBeFalsy()
		expect(isOfSupportedType(Int32Array, new Int16Array())).toBeFalsy()
		expect(isOfSupportedType(Int32Array, [])).toBeFalsy()
		expect(isOfSupportedType(Int32Array, new Int32Array())).toBeTruthy()
		expect(isOfSupportedType(Int32Array, new ArrayBuffer(8))).toBeFalsy()
	});
	
	it('should match Array Buffer', () => {
		expect(isOfSupportedType(ArrayBuffer, new Array())).toBeFalsy()
		expect(isOfSupportedType(ArrayBuffer, new Int16Array())).toBeFalsy()
		expect(isOfSupportedType(ArrayBuffer, [])).toBeFalsy()
		expect(isOfSupportedType(ArrayBuffer, new Int32Array())).toBeFalsy()
		expect(isOfSupportedType(ArrayBuffer, new ArrayBuffer(8))).toBeTruthy()
	});
	
	it('should match Blob', () => {
		expect(isOfSupportedType(Blob, new Blob())).toBeTruthy()
	});
	
	it('should match Null', () => {
		expect(isOfSupportedType(Null, null)).toBeTruthy()
	});
	
	it('should match Schema', () => {
		const userSchema = new Schema("user", {
			name: new SchemaValue(String, true),
			avatar: new SchemaValue(String),
		});
		
		expect(isOfSupportedType(userSchema, Schema)).toBeFalsy()
		expect(isOfSupportedType(userSchema, userSchema)).toBeTruthy()
		expect(isOfSupportedType(userSchema, {
			name: "me",
			avatar: ""
		})).toBeTruthy()
		expect(isOfSupportedType(userSchema, {
			name: "me",
			avatar: "",
			extra: "value"
		})).toBeFalsy()
		expect(isOfSupportedType(userSchema, {})).toBeFalsy()
	});
	
	it('should handle error', () => {
		// @ts-ignore
		expect(isOfSupportedType("", "test")).toBeFalsy()
	});
})
