# AppState
Object which handles and tracks the state of your application or part of it.

## Arguments

```ts
new AppState(storeName, schema)
```

### storeName
Name of the app state.

#### Type: `string`
#### Required: TRUE

### schema
A [schema instance]() of [schema object]().

#### Type: `Schema<T> | SchemaObjectLiteral`
#### Required: TRUE

## Errors

Inherits all error states from [ClientStore](https://github.com/beforesemicolon/client-web-storage/blob/main/documentation/api-references/ClientStore.md)

## Properties
| Name                | Description                                 | Type                    |
|---------------------|---------------------------------------------|-------------------------|
| value               | Contains the state value of the application | `T` as in `AppState<T>` |

## Methods
| Name       | Description                                                                                               | Arguments                                                  |
|------------|-----------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| update     | Method used to update the state of the application                                                        | `Partial<T>`                                               |
| subscribe  | Method used to subscribe to the state of the application                                                  | `(data: T, error: ActionEventData<T> &#124; null) => void` |
| intercept  | Method used to intercept the state of the application to perform things like validation or transformation | `(data: T) => void`                                        |

## Examples

```ts
interface State {
  theme: "light" | "dark";
  language: "en" | "pt";
}

const appState = new AppState<State>("todo", {
  theme: "light",
  language: "en",
});

appState.update({
  theme: "dark"
})
```
