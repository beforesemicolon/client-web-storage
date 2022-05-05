export const uniqueId = ((numb: number) => (length = 12) => Number(`${numb++}`.padStart(length, '0')))(Date.now());
