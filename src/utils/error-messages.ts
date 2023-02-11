export const errorMessages = {
	blankStoreName: () => 'ClientStore must have a non-blank name',
	invalidSchema: () => 'Invalid "Schema" instance or object',
	invalidSubHandler: (sub: any) => `Received invalid "subscribe" handler => ${sub}`,
	invalidEventName: (type: string, eventName: string) => `Received unknown ${type} "${eventName}" event`,
	invalidEventHandler: (type: string, eventName: string, handler: any) => `Received invalid ${type} "${eventName}" event handler => ${handler}`,
	invalidValueProvided: (action: string, data: any) => `Invalid "value" provided to ${action} item => ${data}`,
	invalidValueInterceptProvided: (action: string, data: any) => `Invalid "value" returned via ${action} intercept handler - item => ${data}`,
	missingOrInvalidFields: (invalidFields: string[], invalidFieldTypes: any[]) => `Missing or invalid field types for "${invalidFields.join(', ')}" keys. Should be ${invalidFieldTypes.map((type, idx) => `[${invalidFields[idx]}, ${type}]`).join(', ')}`,
}
