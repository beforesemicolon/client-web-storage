# Documentation

##### Table of Contents
- [Creating a Store](#creating-a-store)
  - [Store Instance](#store-instance)
  - [Store App](#store-app)
  - [Storage Types](#storage-types)
  - [Store Versioning and Description](#store-versioning-and-description)
  - [Default Keys](#default-keys)
- [Defining Schema](#defining-schema)
  - [Schema Object](#schema-object)
  - [Data Types](#data-types)
  - [Schema Instance](#schema-instance)
- [CRUD the Store](#crud-the-store)
  - [Create](#create)
  - [Read](#read)
  - [Update](#update)
  - [Load](#load)
  - [Delete](#delete)
  - [Clear](#clear)
- [Searching the Store](#searching-the-store)
- [Event Handling](#event-handling)
  - [Event Types](#event-types)
  - [Subscription](#subscription)
  - [Event Listeners](#event-listeners)
    - [on](#on)
    - [off](#off)
  - [Event Interceptors](#event-interceptors)
    - [beforeChange](#beforechange)
    - [intercept](#intercept)
    - [Abort an Action](#abort-an-action)
    - [Validate Data Before Saving](#validate-data-before-saving)
    - [Update Store With API Returned Data](#update-store-with-api-returned-data)
    - [Transform Data Before Saving](#transform-data-before-saving)
- [Managing App state](#managing-app-state)
  - [Accessing the State](#accessing-the-state)
  - [Update the State](#update-the-state)
  - [Subscribe to App State](#subscribe-to-app-state)
  - [Intercept App State](#intercept-app-state)
- [Helpers](#helpers)
  - [useClientStore](#useclientstore)
  - [useAppState](#useappstate)
  - [withClientStore](#withclientstore)

## Creating a Store
Think about a store as a document or table in a database. CWS provides a single way to create a store with [ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md) class.

```ts
import {ClientStore, Schema} from "client-web-storage";

interface ToDo {
  name: string;
  description: string;
  complete: boolean;
}

// create a store providing the name and schema object
// with default values or javasctipt types
const todoStore = new ClientStore<ToDo>("todo", {
  $name: String,
  description: "No Description",
  complete: false
});
```

The [ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md) class takes 3 arguments:
- Required [name of the store](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md#storename);
- Required [data schema](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md#schema);
- Optional [store configuration](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md#config);

The [ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md) allows you to define the store (table or document) as well as the app (database) it belongs to.

An app can have multiple stores just like a database can have multiple documents or tables. The web application you create
may also have multiple sub-apps. For example, you can have a web application which inside have a chat app, a widgets app and the
rest is your application. 

CWS allows you to split these nicely to avoid having to mix data or deal with data from a different
context. It does this by allowing you to control the [store instance](#store-instance) and [store app](#store-app).

### Store Instance
A store instance is equivalent to a document or table in a database. The [ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md) returns an instance to the store 
if it already exists. For example, if you try to create 2 stores with the same name and [type](#storage-types), they will point to the same 
document/table but may have different schema.

```ts
const todoStore1 = new ClientStore("todo", {
  $name: String
})
const todoStore2 = new ClientStore("todo", {
  $name: String,
  description: "No Description"
})

// only add item to one of them
await todoStore2.createItem({
  name: "sample"
})

todoStore1 === todoStore2 // FALSE

await todoStore1.size() // 1
await todoStore2.size() // 1
```

As you can see above, the store instances are different and both stores have different schema, but they point to the same table
or document in the database. The [storage type](#storage-types) must be the same for this behavior.

This behavior is similar to document NoSQL databases like MongoDB and DynamoDB. Here you always define a schema for validation
and data integrity but still can have items with different schema stored together.

If you want strict schema tables, all you need to do is ensure all stores have unique names.

CWS gives you the flexibility to follow a strict SQL and NoSQL database easily without having to change interface. You 
can take a look at the [store types](#storage-types) for even more granular control.

### Store App
By default, all stores are part of the same app/database called `App`.

You can create stores with same name in different apps (database) by specifying the `appName` in the configuration as
the third argument to the [ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md).

```ts
const todoStore1 = new ClientStore("todo", {
  $name: String
}, {
  appName: "App1"
});
const todoStore2 = new ClientStore("todo", {
  $name: String,
  description: "No Description"
}, {
  appName: "App2"
});

// only add item to one of them
await todoStore2.createItem({
  name: "sample"
})

await todoStore1.size() // 0
await todoStore2.size() // 1
```

As you can see above, although the stores have the same name, they now exist in different apps (database), therefore they
do not point to the same document/table.

### Storage Types
By default, all store's data will be kept in memory. That means that when you create a store, its storage type is `MEMORYSTORAGE`.

There are four storage types:
- `MEMORYSTORAGE` - data stored in-memory
- `LOCALSTORAGE` - data stored in [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- `INDEXEDDB` - data stored in [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- `WEBSQL` - data stored in [WebSQL](https://www.w3.org/TR/webdatabase/)

You change the storage type by setting the `type` in the [ClientStore Configuration](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md#config).

```ts
const todo = new ClientStore("todo", {
  $name: String
}, {
  type: INDEXEDDB
});
```

Not all stores should be of same type. Some data you want to persist between sessions and others should disappear when
the session is over. CWS allows you to control your data to the tiniest details and having the ability to decide
how each piece of data is stored is crucial.

### Store Versioning and Description
Based on the [storage type](#storage-types), versioning is important. For `INDEXEDDB` and `WEBSQL` stores you can set the version
of your store which can be extremely useful to track changes in the schema and other store configurations.

```ts
const todo = new ClientStore("todo", {
  $name: String
}, {
  type: INDEXEDDB,
  version: 1
});
```

If something about the store configuration or schema changes, bump the version. The next time the user loads your app
the old stored data in the browser will not be considered, and you will avoid having to deal with data which no longer
matches your updated app store schema.

```ts
const todo = new ClientStore("todo", {
  $name: String,
  description: "No Description" // new schema key
}, {
  type: INDEXEDDB,
  version: 2 // update
});
```

### Default Keys
The stores you create will always give all items an unique identifier and track the time each item was created and last updated.

The stores do that by setting `default keys` in each item. Be default they are:
- `_id`
- `_createdDate`
- `_lastUpdatedDate`

You can override these in configuration perhaps because you want these keys to match your data schema. You can do that
in the store configuration without compromising the internal behavior around these keys.

Let's say you have the following interface for each item:

```ts
interface ToDo {
  id: string;
  dateCreated: Date;
  dateUpdated: Date;
  name: string;
  description: string;
  complete: boolean;
}
```

If you use it to create your store, you will have to manually remember to set and track them on every action.
That also does not prevent the store to create its own internal item keys.

```ts
const todoStore = new ClientStore<ToDo>("todo", {
  $id: String,
  $dateCreated: Date,
  $dateUpdated: Date,
  $name: String,
  description: "No Description",
  complete: false
});

await todoStore.createItem({
  id: uuid(),
  dateCreated: new Date(),
  dateUpdated: new Date(),
  name: "Go to Gym"
});

/*  Creates item in the store
{
  _id: "123e4567-e89b-12d3-a456-426614174000",
  _createdDate: "January, 4th 2022",
  _lastUpdatedDate: "January, 4th 2022",
  id: "123e4567-e89b-12d3-a456-426614174000",
  dateCreated: "January, 4th 2022",
  dateUpdated: "January, 4th 2022",
  name: "Go to Gym",
  description: "No Description",
  complete: false,
}
*/
```

We can improve this by overriding the store default key names and let the store handling things.

```ts
const todoStore = new ClientStore<ToDo>("todo", {
  $name: String,
  description: "No Description",
  complete: false
}, {
  idKeyName: "id",
  createdDateKeyName: "dateCreated",
  updatedDateKeyName: "dateUpdated",
});

await todoStore.createItem({
    name: "Go to Gym"
});

/*  Creates item in the store
{
  id: "123e4567-e89b-12d3-a456-426614174000",
  dateCreated: "January, 4th 2022",
  dateUpdated: "January, 4th 2022",
  name: "Go to Gym",
  description: "No Description",
  complete: false,
}
*/
```

As you can see, you get the desired result while simplifying the way you interact with the store.

## Defining Schema
A store schema is a way to:
- Guarantee data format. (All fields will always exist with set or default values)
- Validate data. The store will make sure required fields are always set and all fields have expected data types.

One thing developers always be doing is setting default values and doing data checks when updating store data. CWS ensures
that is done at the store level and developers can focus on other data logic.

There are two ways to define the schema:
- Create an [Object literal](#schema-object) (used in examples above);
- Create a [Schema instance](#schema-instance);

### Schema Object
A schema object is simply a Javascript object literal. Simply create a object literal representing your item interface.

Given the following interface:
```ts
interface ToDo {
  id: string;
  dateCreated: Date;
  dateUpdated: Date;
  name: string;
  description: string;
  complete: boolean;
  user: {
    name: string;
    avater: string;
  }
}
```

Create the schema Object:

```ts
const ToDoSchema = {
  id: SchemaId,
  dateCreated: Date,
  dateUpdated: Date,
  $name: String,
  description: "No Description",
  complete: false,
  user: {
    id: SchemaId,
    $name: String,
    avater: String,
  }
}
```
As you can see the difference between the **typescript interface** and the **schema object** is minimal:
- You use Javascript data type constructors instead (`String`, `Date`, `Boolean`, etc);
- You can also use provided custom types from CWS (`SchemaId`, `ArrayOf`, `OneOf`);
- Use the `$` sign to mark fields that user must provide on creation (in this case: `name`, `$user.name`);
- Set a default value the store can use when a value is not provided (in this case `description` and `complete`);

When setting the `description` the `"No Description"` is provided to the schema. The store will know that `descrioption`
is of type `String` and that it is not required, therefore if when creating an item the `description` field is not
specified, the store will use the value `"No Description"`.

Same goes for the `complete` field. We could simply set the type to be `Boolean` and the default value for booleans is `false`
(check [data types table](#data-types)) but we decided to explicitly set it to `false`. In this case the store will know that the
field must be a `Boolean` and use `false` as default value when the field is not specified.

### Data Types
As you can see above, the schema object uses javascript types plus additional CWS types to help you define the type
of data for your store.

Below is all supported types compared to `typescript` to show that the difference is minimal

| Typescript Example            | CWS/Javascript Example           | Type   | Store Default Value             |
|-------------------------------|----------------------------------|--------|---------------------------------|
| `boolean`                     | `Boolean`                        | Native | `false`                         |
| `string`                      | `String`                         | Native | `""`                            |
| `number`                      | `Number`                         | Native | `0`                             |
| `null`                        | `Null`                           | CWS    | `null`                          |
| `Date`                        | `Date`                           | Native | `null`                          |
| `Array`                       | `Array`                          | Native | `[]`                            |
| `Array<String>`               | `ArrayOf(String)`                | CWS    | `[]`                            |
| `String &#124; Number`        | `OneOf(String, Number)`          | CWS    | `null`                          |
| `Array<String &#124; Number>` | `ArrayOf(OneOf(String, Number))` | CWS    | `[]`                            |
| `string`                      | `SchemaId`                       | CWS    | `(new SchemaId()).defaultValue` |
| `Record<K, V>`                | `Schema`                         | CWS    | `{}`                            |
| `Blob`                        | `Blob`                           | Native | `null`                          |
| `ArrayBuffer`                 | `ArrayBuffer`                    | Native | `null`                          |
| `Float32Array`                | `Float32Array`                   | Native | `new Float32Array()`            |
| `Float64Array`                | `Float64Array`                   | Native | `new Float64Array()`            |
| `Int8Array`                   | `Int8Array`                      | Native | `new Int8Array()`               |
| `Int16Array`                  | `Int16Array`                     | Native | `new Int16Array()`              |
| `Int32Array`                  | `Int32Array`                     | Native | `new Int32Array()`              |
| `Uint8Array`                  | `Uint8Array`                     | Native | `new Uint8Array()`              |
| `Uint8ClampedArray`           | `Uint8ClampedArray`              | Native | `new Uint8ClampedArray()`       |
| `Uint16Array`                 | `Uint16Array`                    | Native | `new Uint16Array()`             |
| `Uint32Array`                 | `Uint32Array`                    | Native | `new Uint32Array()`             |

### Schema Instance
The schema object will be converted to a `Schema` instance under the hood, and it is a much easier way to define a store
instance.

To create a schema simply instantiate the `Schema` class which takes a required name and optional schema map value.

```ts
const todoSchema = new Schema("todo");
```

Now given the follow todo interface:
```ts
interface ToDo {
  id: string;
  dateCreated: Date;
  dateUpdated: Date;
  name: string;
  description: string;
  complete: boolean;
  user: {
    name: string;
    avater: string;
  }
}
```

We can define our todo schema like so:

```ts
const userSchema = new Schema("user");

userSchema.defineField("name", String, {required: true});
userSchema.defineField("avatar", String);

const todoSchema = new Schema("todo");

todoSchema.defineField("name", String, {required: true});
todoSchema.defineField("id", SchemaId);
todoSchema.defineField("dateCreated", Date);
todoSchema.defineField("dateUpdated", Date);
todoSchema.defineField("description", String, {defaultValue: "No Description"});
todoSchema.defineField("complete", Boolean);
todoSchema.defineField("user", userSchema, {required: true});
```

You may also define the fields during instantiation;

```ts
const userSchema = new Schema("user", {
  name: new SchemaValue(String, true),
  avatar: new SchemaValue(String),
});

const todoSchema = new Schema("todo", {
  name: new SchemaValue(String, true),
  id: new SchemaValue(SchemaId),
  dateCreated: new SchemaValue(Date),
  dateUpdated: new SchemaValue(Date),
  description: new SchemaValue(String, false, "No Description"),
  complete: new SchemaValue(Boolean),
  user: new SchemaValue(userSchema, true),
});
```

As you can see, dealing with the [Schema](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/Schema.md) and [SchemaValue](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/SchemaValue.md) is a little verbose and the reason the schema object
is a much simpler way to define your store schema. This is to show what is the store is doing under the hood.

You can always access the store schema via the `schema` property and if so, you should learn more about the [Schema](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/Schema.md)
api.

```ts
const todoStore = new ClientStore<ToDo>("todo", {
  $name: String,
  description: "No Description",
  complete: false
});

todoStore.schema // return Schema instance
```

## CRUD the Store
Any store you create is asynchronous and event driven. This means that any operation you perform does not block execution 
and can be reacted to and intercepted. This makes any store unique and powerful to work with.

Let's consider the following simple todo store:
```ts
const todoStore = new ClientStore<ToDo>("todo", {
    $name: String,
    description: "No Description",
    complete: false
});
```

### Create
You can create any item by only providing the required fields and relying on the default values you set in the schema
definition.

```ts
await todoStore.createItem({
    name: "Go to Gym"
});
/*  Creates
{
  _id: "123e4567-e89b-12d3-a456-426614174000",
  _createdDate: "January, 4th 2022",
  _lastUpdatedDate: "January, 4th 2022",
  name: "Go to Gym",
  description: "No Description",
  complete: false,
}
*/

await todoStore.createItem({
  name: "Buy groceries",
  description: "Buy ingredients for the dinner tommorrow"
});

/*  Creates
{
  _id: "123e4567-e89b-12d3-a456-426614174000",
  _createdDate: "January, 4th 2022",
  _lastUpdatedDate: "January, 4th 2022",
  name: "Buy groceries",
  description: "Buy ingredients for the dinner tommorrow",
  complete: false,
}
*/
```

The `createItem` method is asynchronous and returns the item if created or `null` if the action is [aborted](#abort-an-action). It takes
an object partially representing the item you are creating.

As you can see, even though you only specify a couple of properties, the store guarantees that all fields will exist
by using the default values [based on type](#data-types) or that you specifically defined in your schema like we did with `description`
and `complete`.

### Read
You can always read the entire store or a single item with the methods `getItem` and `getItems`.

```ts
await todoStore.getItems(); 
// return an array with all existing items

await todoStore.getItem("123e4567-e89b-12d3-a456-426614174000"); 
// returns the item or null
```

### Update
The `updateItem` takes partial information to update the item in the store. It returns the updated item or `null`
in case the action got aborted or the item does not exist in the store.

```ts
await todoStore.updateItem("123e4567-e89b-12d3-a456-426614174000", {
  complete: true
});
```

### Load
There are times which you simply need to do a bulk update or item creation. The `loadItems` method allows you to do just that.

It will create the item if it does not exist otherwise update it.

```ts
// will create all items
const items = await todoStore.loadItems([
  {
    name: "Go to Gym"
  },
  {
    name: "Buy groceries",
    description: "Buy ingredients for the dinner tommorrow"
  }     
]);

// will update all items
await todoStore.loadItems(items.map(item => ({...item, complete: true})))
```

This method always returns an array of items unless the action got aborted. In that case it returns `null`.

### Delete
Whenever you want to remove a sinle item in the store, you call the `removeItem` with the id of the item

```ts
await todoStore.removeItem("123e4567-e89b-12d3-a456-426614174000");
```

This method will return the id of the item if succeeded, otherwise `null` if action got aborted or the item does not exist.

### Clear
To clear the entire store, it is a simple as calling the `clear` method.

```ts
await todoStore.clear();
```

The `clear` method will return all the id of the item which got deleted or `null` in case the action got aborted.

## Searching the Store
The CWS provides two methods to allow you to find any item in the store: `findItem` and `findItems`.

They are both asynchronous and take a comparator function which must return a boolean whether it is a match or not.

```ts
// find by name
const item = await todoStore.findItem(item => item.name === "Go to Gym");

// find all completed items
const items = await todoStore.findItems(item => item.complete);
```

## Event Handling
Any action you perform in a store can be:
- aborted - cancel the action
- intercepted - perform additional actions before they get to the store
- subscribed to - perform action after they get in the store

As you can see, you can perform actions before and after an item gets to the store. 

### Event Types
There are various store events you can tap into as you need to.
- `READY` - the store got successfully initialized
- `PROCESSING` - the store is performing single or multiple actions
- `CREATED` - item was created
- `REMOVED` - item was removed
- `UPDATED` - item was updated
- `LOADED` - items got loaded
- `CLEARED` - store got cleared
- `ERROR` - some error happened performing an action
- `ABORTED` - an action got aborted

Only CRUD operations can be intercepted, all of them can be subscribed to though.

### Subscription
You may simply subscribe and unsubscribe to a store.

```ts
const unsubscribe = todoStore.subscribe((eventType, dataAssociatedWithEvent) => {
  switch (eventType) {
    case ClientStore.EventType.READY:
      // handle event type here
      break;
    case ClientStore.EventType.CREATED:
      // handle event type here
      break;
    case ClientStore.EventType.UPDATED:
      // handle event type here
      break;
    case ClientStore.EventType.LOADED:
      // handle event type here
      break;
    case ClientStore.EventType.CLEARED:
      // handle event type here
      break;
    case ClientStore.EventType.REMOVED:
      // handle event type here
      break;
    case ClientStore.EventType.PROCESSING:
      // handle event type here
      break;
    case ClientStore.EventType.ABORTED:
      // handle event type here
      break;
    case ClientStore.EventType.ERROR:
      // handle event type here
      break;
    default:
  }
});

unsubscribe();
```
The data you receive in the un the subscription handler varies based on the event, so it is always great to check before
performing any additional action. Because it is a subscription, the data is the result of an action after it happened.

### Event Listeners
The `subscribe` method is nice because it provides you a single place to handle everything, but sometimes you only care
about a specific action and rather subscribe to that action directly.

For that there are the `on` and `off` methods that allows you to start and stop listening to specific events.

#### on

```ts
const stopListenToProcessingEvent = todoStore.on(EventType.PROCESSING, (processing: boolean) => {
  // side effect logic here
});

stopListenToProcessingEvent();
```
Above example uses the returned `off` function to clean the listener, but you may also call the `off` method yourself
passing the same function instance as you can see bellow:

#### off

```ts
const handleProcessingEvent = (processing: boolean) => {
  // side effect logic here
}

todoStore.on(EventType.PROCESSING, handleProcessingEvent);

todoStore.off(EventType.PROCESSING, handleProcessingEvent);
```

### Event Interceptors
Your stores come with the `intercept` and `beforeChange` methods which you can use to perform various things before the
item is handled and saved in the store. These are called with the data the CRUD methods got called with to perform an action.

This is useful to:
- perform data validation;
- call API and make sure the data is changed/created remotely before store is changed locally
- perform data transformations;

Both `intercept` and `beforeChange` handler functions can:
- return `null` to abort an action;
- return updated data to resume the action;
- throw error to be caught by the store and trigger a `ERROR` event;

#### beforeChange
The `beforeChange` takes a handler function which will be called with the event and the data which any action got called with.

```ts
const unsub = todoStore.beforeChange(async (eventType, data) => {
  switch (eventType) {
    case EventType.CREATED:
      // handle event type here
      break;
    case EventType.UPDATED:
      // handle event type here
      break;
    case EventType.LOADED:
      // handle event type here
      break;
    case EventType.REMOVED:
      // handle event type here
      break;
    case EventType.CLEARED:
      // handle event type here
      break;
    default:
  };
});

unsub()
```

As you can see, the handler function can be asynchronous which allows you to do whatever you want.

#### intercept
The `intercept` is similar to `beforeChange` method. The difference is that it allows you to intercept a specific event.

```ts
const stopInterceptingCreateEvent = todoStore.intercept(EventType.CREATED, (data) => {
  // side effect logic here
});

stopInterceptingCreateEvent();
```

It is safe to throw an error inside the `intercept` and `beforeChange` handlers. The error is caught by the store and a
`Error` event is created.

This allows you to subscribe or listen to all errors in a single place and not worry about `try...catch` blocks inside
handlers unless you really need to.

#### Abort an Action
To abort an action all you need to do is return `null` in the interceptors event handlers.

Below example will make sure the store size will never be over 10 items.

```ts
const stopInterceptingCreateEvent = todoStore.intercept(EventType.CREATED, async (data) => {
  if (await todoStore.size() === 10) {
     return null; 
  }
});

await todoStore.createItem({
  name: "Go to Gym"
})

stopInterceptingCreateEvent();
```

#### Validate Data Before Saving
The beauty of intercepting is that you can do whatever you need to do before ensuring the data is okay. Bellow is a simple
example that will throw an error if the todo name is invalid.

```ts
const removeErrorListerner = todoStore.on(EventType.ERROR, (error) => {
  displayAppErrorBanner(error.message);
})

const stopInterceptingCreateEvent = todoStore.intercept(EventType.CREATED, async (data) => {
  if (isValidTodoName(data.name)) {
    await todoService.createTodo(data);
  } else {
    throw new Error('Invalid todo name')
  }
});

try {
  await todoStore.createItem({
    name: "$%$%$%$%$%$"
  })
} catch(e) {
  handleError(e);
}

// when no longer needed
stopInterceptingCreateEvent();
removeErrorListerner();
```

##### Update Store With API Returned Data
Sometimes you need to sync the current store data with the backend one. Perhaps you need the actual `id` generated in the backend
and not the client one.

```ts
const stopInterceptingCreateEvent = todoStore.intercept(EventType.CREATED, async (data) => {
  const res = await todoService.createTodo(data);
	
  // return new data to override the data
  // the action was called with
  return { 
    ...res,
    _id: res.identifier,
    _lastUpdatedDate: res.updatedDate,
  }
});

await todoStore.createItem({
  name: "Go Shopping"
})

// when no longer needed
stopInterceptingCreateEvent();
```

#### Transform Data Before Saving
A common use case to intercepting data is to transform it before saving it. Perhaps the store actions are called with 
data which does not match the interface format which needs to be mapped or data which needs to be changed in some way
before saving.

```ts
const stopInterceptingCreateEvent = todoStore.intercept(EventType.CREATED, async (data) => {
  data.name = encode(data.name);
  data.description = encode(data.description);
	
  await todoService.createTodo(data);
	
  return data; // return the new data to override
});

await todoStore.createItem({
  name: "go to gym",
  description: "some unsafe data collected from user input"
})

// when no longer needed
stopInterceptingCreateEvent();
```

## Managing App state
The [ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md) is perfect
to handle data of your application in a list or database style. However, sometime you just need specific application data
which are not necessarily the data of the users or that come from the server or that needs to be manipulated by your application.

Such data are what we call metadata. They are things which helps you decide how to display the UI or how to behave. They 
are your application configuration and settings which can be global or specific to a part of your application.

For such data you can't represent them as items in a store. For those you should not use `ClientStore`. That's why
we have the `AppState` class to handle such things.

```ts
interface State {
  theme: "light" | "dark";
  language: "en" | "pt";
}

const appState = new AppState<State>("todo", {
  theme: "light",
  language: "en",
});
```

Above is a simple example on where to store metadata like the `theme` and `language` of the application.

`AppState` inherits all the benefits of the `ClientStore`. It allows you to subscribe and intercept data. It also validates
the state on every action allowing you to have full control of the state.

### Accessing the state

To access the data you use the `value` property which returns the state at its current value. But the best
way to be up-to-date with the state is by [subscribing to the store](#subscribe-to-app-state)

```ts
appState.value; // returns the state
```

### Update the state
The `AppState` exposes the `update` method which is the only way to change the state. State fields cannot be removed or added
after the initialization. You may only update their value. The store will set the defaults as necessary.

```ts
appState.update({
  theme: "dark"
})

appState.update({
  language: "pt"
})
```

### Subscribe to App state
You may always subscribe to the application state to react to every change.

```ts
appState.subscribe((state) => {
  // handle state
})
```

### Intercept App state
Sometimes you need to perform validation or transformation on the state data before they make it in. For that you can
use the `intercept` method.

The `intercept` method of `AppState` is different from `ClientStore` in a sense that it does not take the event you
want to subscribe to. You only need to provide the handler and like in the store, you:
- return new data to override;
- throw error to cancel action;
- return null to abort the action in general;

```ts
appState.intercet((dataUsedToUpdateTheState) => {
  // handle data
})
```

## Helpers
The `Client-Web-Storage` package exposes various helpers which are intended to help you incorporate the stores into
you application much easier.

### useClientStore
React helper that given a store instance or name, provides a store state which is much easier to interact or consume store
data.

It exposes a hook and a provider.
```ts
import {useClientStore, ClientStoreProvider} from "client-web-storage/helpers/use-client-store";
```

You can choose to inject all your stores at the top level of your app or section or your app

```ts
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <ClientStoreProvider stores={[todoStore]}>
    <App />
  </ClientStoreProvider>
);
```

Then simply consume the store like so:

```ts
// app.tsx

import {useClientStore} from "client-web-storage/helpers/use-client-store";

const App = () => {
    const todoStore = useClientStore<Todo>("todo");
		
    const handleCreateItem = async () => {
      await todoStore.createItem({
        name: "todo-" + crypto.randomUUID()
      })
    }
		
    return (
      <>
        <h2>Todos</h2>
        <ActionBar>
            <Button onClick={handleCreateItem} >Create Todo</Button>
        </ActionBar>
        {todoStore.loadingItems 
            ? <Spinner/>
            : todoStore.error 
                ? <Status type="error" message={todoStore.error.message} />
                : todoStore.items.map(todo => <TodoItem data={todo} />)}
      </>
    )
}
```

### useAppState
React helper that given a app state instance or name, provides a store state which is much easier to interact or consume
data.

It exposes a hook and a provider.

```ts
import {useAppState, AppStateProvider} from "client-web-storage/helpers/use-app-state";
```

You can choose to inject all your stores at the top level of your app or section or your app

```ts
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <AppStateProvider states={[appAppState]}>
    <App />
  </AppStateProvider>
);
```

```ts
// app.tsx

import {useAppState} from "client-web-storage/helpers/use-app-state";

const App = () => {
    const {state, setState, error} = useAppState<AppStateType>(appState);
		
    ...
}
```

### withClientStore
A Higher Order Function which can be used with any UI framework to easily consume the store data.

Bellow is an example on how to use it with Angular.

```ts
// app.component.ts

import {StoreState} from "client-web-storage";
import {withClientStore, DefaultStoreState} from "client-web-storage/helpers/with-client-store";
import {todoStore, Todo} from "./stores/todo.store";

@Component({
  selector: 'app-root',
})
export class AppComponent implements OnInit, OnDestroy {
  $todo: StoreState<Todo> = DefaultStoreState;
  $unsubscribeFromTodoStore: UnSubscriber;

  ngOnInit() {
    this.$unsubscribeFromTodoStore = withClientStore<Todo>(todoStore, (data) => {
      // handle data;
    });
  }

  ngOnDestroy() {
    this.$unsubscribeFromTodoStore();
  }

}
```
