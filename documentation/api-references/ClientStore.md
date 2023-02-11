# ClientStore
A client store is a single document defined by its schema. It can be of different types which means, you can choose to
store different data in a different way and use the same API to interact with the data regardless of the type.

## Arguments

```ts
new ClientStore(storeName, schema, config)
```

### storeName
Name of the store.

#### Type: `string`
#### Required: TRUE

### schema
A [schema instance]() of [schema object]().

#### Type: `Schema<T> | SchemaObjectLiteral`
#### Required: TRUE

### config
Store configuration object

#### Type: `Config`
#### Required: FALSE
#### Default Value: `defaultConfig`
#### Fields
- `appName`: name of the app. Think about it like database and the stores like tables or documents in the database;
- `version`: version of the store. Used for `INDEXEDDB` and `WEBSQL` store types
- `type`: Determines how the data is saved in the browser. Valid values:
  - `LOCALSTORAGE`;
  - `WEBSQL`;
  - `INDEXEDDB`;
  - `MEMORYSTORAGE`
- `description`: Used to describe the store and can be useful for developers;
- `idKeyName`: A key name to override the default store identifier key name. [Learn more](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/docs.md#data-types)
- `createdDateKeyName`: A key name to override the default store create date key name. [Learn more](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/docs.md#data-types)
- `createdDateKeyName`: A key name to override the default store update date key name. [Learn more](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/docs.md#data-types)

```ts
interface Config {
  appName?: string;
  version?: number;
  type?: string;
  description?: string;
  idKeyName?: string;
  createdDateKeyName?: string;
  createdDateKeyName?: string;
}
```

## Errors

### ClientStore must have a non-blank name
Error thrown when the store name is not provider

```ts
new ClientStore()
```

### Invalid "Schema" instance or object
Error thrown when the schema is invalid

```ts
new ClientStore("todo", null)
```

### Received invalid "subscribe" handler
Error thrown when you provide something other than a function to the `subscribe` method

### Received unknown {type} "{eventName}" event
Error thrown when you provide invalid event name to `on`, `off`, or `interecept` methods

### Received unknown {type} "{eventName}" event handler
Error thrown when you provide something other than a function to the `on`, `off`, `beforeChange` or `interecept` methods

### Invalid "value" provided to {action} item
Error thrown when you provide non-object literal or empty object literal to perform `createItem`, `updateItem` and `loadItems`

### `Missing or invalid field "{key}" type
Error thrown when a field value of the data is required but not provided or it is of a wrong type

## Examples

```ts
const todoStore = new ClientStore("todo", {
  $name: String,
  description: "No Description"
})
```

```ts
const todoStore = new ClientStore<ToDo>("todo", {
    $name: String,
    description: "No Description",
    complete: false
}, {
    type: INDEXEDDB,
    version: 2,
    appName: "Test",
    idKeyName: "id",
    createdDateKeyName: "dateCreated",
    updatedDateKeyName: "dateUpdated",
});
```



