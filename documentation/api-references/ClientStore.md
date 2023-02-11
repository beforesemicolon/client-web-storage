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

## Properties
| Name                 | Description                                                                                                 | Type                                                                |
|----------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| `schema`             | The `Schema` instance used to define the store data                                                         | `Schema`                                                            |
| `ready`              | Whether the store has initialized and its ready                                                             | `boolean`                                                           |
| `type`               | How and where the data will be stored `Default: MEMORYSTORAGE`                                              | `LOCALSTORAGE &#124; WEBSQL &#124; INDEXEDDB &#124; MEMORYSTORAGE`  |
| `name`               | The name you gave to the store when initializing it                                                         | `string`                                                            |
| `appName`            | The name of the app you provided in configuration. `Default: App`                                           | `string`                                                            |
| `processing`         | A flag whether the store is currently processing some action                                                | `boolean`                                                           |
| `processingEvents`   | A list of all events the store is currently processing                                                      | `EventType[]`                                                       |
| `idKeyName`          | The name of the key in the items used as identifier. `Default: _id`                                         | `string`                                                            |
| `createdDateKeyName` | The name of the key used to contain the date when the item was created. `Default: _createdDate`             | `string`                                                            |
| `updatedDateKeyName` | The name of the key used to contain the date when the item was last updated. `Default: __lastUpdatedDate`   | `string`                                                            |

## Methods
| Name           | Description                                 | Async   | Arguments                                                                     | Return          |
|----------------|---------------------------------------------|---------|-------------------------------------------------------------------------------|-----------------|
| `size`         | Get how many items are in the store         | yes     | `None`                                                                        | `number`        |
| `subscribe`    | Listen to all events of the store           | no      | `subscriber: StoreSubscriber<T>`                                              | `UnSubscriber`  |
| `on`           | Listen to a specific event                  | no      | `event: EventType.PROCESSING_EVENTS, handler: (event: EventType[]) => void`   | `UnSubscriber`  |
| `off`          | Stop listen to a specific event             | no      | `event: EventType.PROCESSING_EVENTS, handler: (event: EventType[]) => void`   | `void`          |
| `beforeChange` | Intercept all actions to the store          | no      | `handler: BeforeChangeHandler<T>`                                             | `UnSubscriber`  |
| `intercept`    | Intercept a specific action of the store    | no      | `event: EventType, handler: InterceptEventHandler<T>`                         | `UnSubscriber`  |
| `loadItems`    | Bulk create or update items into the store  | yes     | `dataList: Array<Partial<T>>`                                                 | `Array<T>`      |
| `createItem`   | Create an item in the store                 | yes     | `data: Partial<T>`                                                            | `T`             |
| `updateItem`   | Update an existing item in the store        | yes     | `id: string, data: Partial<T>`                                                | `T`             |
| `getItems`     | Get all items in the store                  | yes     | `None`                                                                        | `T[]`           |
| `getItem`      | Get a specific item from the store          | yes     | `id: string`                                                                  | `T`             |
| `removeItem`   | Remove a specific item in the store         | yes     | `id: string`                                                                  | `string`        |
| `clear`        | Clear all items in the store                | yes     | `None`                                                                        | `string[]`      |
| `findItem`     | Find a specific item in the store           | yes     | `cb?: (value: T, key: string) => boolean`                                     | `T`             |
| `findItems`    | Find a group of items in the store          | yes     | `cb?: (value: T, key: string) => boolean`                                     | `T[]`           |

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



