import {isObjectLiteral} from "./is-object-literal";

export const isValidObjectLiteral = (value: any) => isObjectLiteral(value) && Object.keys(value).length
