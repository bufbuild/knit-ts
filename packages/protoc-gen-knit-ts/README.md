# @bufbuild/protoc-gen-knit-ts

The code generator for Knit. Knit brings GraphQL like capabilities to RPCs. It is built on top of [Protobuf](protobuf.com) and [Connect](connectrpc.com). This packages houses a protoc plugin that generates TypeScript types for Knit clients.

Learn more about Knit at [github.com/bufbuild/knit](github.com/bufbuild/knit).

## How to generate

We recommend [`buf`](https://github.com/bufbuild/buf) as a protocol buffer compiler, but
[`protoc`](https://github.com/protocolbuffers/protobuf/releases) works as well.

To install `buf`, the plugin, and the runtime, run:

```shell
npm install --save-dev @bufbuild/buf @bufbuild/protoc-gen-knit-ts
npm install @bufbuild/knit
```

### Generate with `buf`

#### Remote packages

If you push your modules to [BSR](https://buf.build/docs/bsr), you can use remote packages to get the schema.
For example for the star wars demo, you can run the following command to get the schema:

```sh
npm config set @buf:registry  https://buf.build/gen/npm/v1/
npm install @buf/bufbuild_knit-demo.bufbuild_knit-es@latest
```

#### Remote plugins

If you use `buf` you can use remote plugins to generate the schema, for example:

```yaml
# Learn more: https://docs.buf.build/configuration/v1/buf-gen-yaml
version: v1
plugins:
  # This will run the generator on the BSR and write output to src/gen
  - plugin: buf.build/bufbuild/knit-ts
    out: src/gen
```

#### Local generation

To compile with [`buf`](https://github.com/bufbuild/buf), add a file `buf.gen.yaml` with
the following content:

```yaml
# Learn more: https://docs.buf.build/configuration/v1/buf-gen-yaml
version: v1
plugins:
  # This will invoke protoc-gen-knit-ts and write output to src/gen
  - name: knit-ts
    out: src/gen
    opt: target=ts # Optional, defaults to dts
```

Now run `npx buf generate` to generate Knit schema types in TypeScript from `.proto` files.

### Generate with `protoc`

To compile with `protoc`:

```shell
protoc -I . --plugin ./node_modules/.bin/protoc-gen-knit-ts --knit-es_out src/gen --knit-es_opt target=ts example.proto
```

## Plugin Options

### `target`

This option controls whether the plugin generates TypeScript or TypeScript declaration files.

Possible values:

- `target=ts` - generates a `_knit.ts` file for every `.proto` file.
- `target=dts` - generates a `_knit.d.ts` file for every `.proto` file.

By default, the plugin generates `.d.ts` files. Since the plugin only generates types, and no JavaScript, it doesn't need to generate `.js` files.

### `import_extension=.js`

By default, the generated files use a `.js` file extensions in import paths.

This is unintuitive, but necessary for [ECMAScript modules in Node.js](https://www.typescriptlang.org/docs/handbook/esm-node.html).
Unfortunately, not all bundlers and tools have caught up yet, and Deno
requires `.ts`. With this plugin option, you can replace `.js` extensions
in import paths with the given value. For example, set

- `import_extension=none` to remove the `.js` extension
- `import_extension=.ts` to replace the `.js` extension with `.ts`

### `keep_empty_files=true`

By default, empty files are omitted from the plugin output. This option disables pruning of
empty files, to allow for smooth interop with Bazel and similar
tooling that requires all output files to be declared ahead of time.
Unless you use Bazel, it is very unlikely that you need this option.

## What is generated

The plugin only generates TypeScript types that help in constructing query, parameter and result types.
It doesn't generate _any_ JavaScript whatsoever. The generated types serve as a schema for the `Query`,
`Parameter`, and `Mask` generic types used by the Knit client.

As a result we get the best bundle size that is humanly possible: **`0 Kb`**.

### Files

For every protobuf source file, we generate a corresponding `.ts`, or `.d.ts` file,
but add a `_knit` suffix to the name. For example, for the protobuf file `foo/bar.proto`,
we generate `foo/bar_knit.ts`.

### Services

For the following service declaration:

```protobuf
package example.v1;

service ExampleService {
    rpc GetExample(GetExampleRequest) returns (GetExampleResponse) {
        option idempotency_level = NO_SIDE_EFFECTS;
    }
    rpc CreateExample(CreateExampleRequest) returns (CreateExampleResponse);
    rpc SubscribeExample(SubscribeExampleRequest) returns (stream SubscribeExampleResponse);
}
```

we generate a TypeScript type called `ExampleService`:

```ts
export type ExampleService = {
  // Fully qualified service name: `{package}.{service}`
  "example.v1.ExampleService": {
    fetch: {
      getExample: {
        $: GetExampleRequest;
        value: GetExampleResponse;
      };
    };
    do: {
      createExample: {
        $: CreateExampleRequest;
        value: CreateExampleResponse;
      };
    };
    listen: {
      subscribeExample: {
        $: SubscribeExampleRequest;
        value: SubscribeExampleResponse;
      };
    };
  };
};
```

This can be used with a Knit client:

```ts
const client = createClient<ExampleService>(...);

client.fetch({
    "example.v1.ExampleService": {
        getExample: {
            $: {...}
        }
    }
})
```

Or multiple of them can be combined:

```ts
type Schema  = FooService & BarService;

const client = createClient<Schema>(...);
```

All unary methods with `idempotency_level` set to `NO_SIDE_EFFECTS` will be under `fetch`. Remaining unary methods will
be under `do`. Server streaming methods will be under `listen`. They correspond to `fetch`, `do`, and `listen` methods of
the client. Client streaming and bidirectional streaming methods are not supported.

[//]: # "<!-->TODO: Add links to runtime docs for the client methods</-->"

The `$` represents the request and the `value` denotes the response. Note that method names are always `lowerCamelCase`,
even if the corresponding protobuf method uses `UpperCamelCase`. While there is no official style for ECMAScript, most style guides
([AirBnB](https://github.com/airbnb/javascript#naming--camelCase),
[MDN](https://developer.mozilla.org/en-US/docs/MDN/Guidelines/Code_guidelines/JavaScript#variable_naming),
[Google](https://google.github.io/styleguide/jsguide.html#naming-non-constant-field-names)) as well as
[Node.js APIs](https://nodejs.org/dist/latest-v16.x/docs/api/child_process.html#child_processforkmodulepath-args-options) and
[browser APIs](https://fetch.spec.whatwg.org/#request-class) use `lowerCamelCase`, and so do we.

### Messages

For the following message declaration:

```protobuf
message Example {
    string id = 1;
}
```

we generate a TypeScript interface called `Example`:

```ts
export interface Example {
  id: string;
  name: string;
}
```

We use a TypeScript `interface` and not a `type` definition because interfaces support
[declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
which is used to merge [relations](#relations) into the message's interface.

Note that some names cannot be used as interface names and will be escaped by adding the suffix `$`.
For example, a protobuf message `break` will become a class `break$`.

Generated interfaces can be used as a `Query`, `Parameter` and can be used with `Mask` in combination with
a `Query` to get the return type:

[//]: # "TODO: Add links to runtime docs"

```ts
const exampleQuery = { id: {} } satisfies Query<Example>;

type ExampleResult = Mask<typeof exampleQuery, Example>;
//   ^?   { id: string }
```

### Field names

For each field declared in a message, we generate a property on the class. Note that property
names are always `lowerCamelCase`, even if the corresponding protobuf field uses `snake_case`.
While there is no official style for ECMAScript, most style guides
([AirBnB](https://github.com/airbnb/javascript#naming--camelCase),
[MDN](https://developer.mozilla.org/en-US/docs/MDN/Guidelines/Code_guidelines/JavaScript#variable_naming),
[Google](https://google.github.io/styleguide/jsguide.html#naming-non-constant-field-names)) as well as
[Node.js APIs](https://nodejs.org/dist/latest-v16.x/docs/api/child_process.html#child_processforkmodulepath-args-options) and
[browser APIs](https://fetch.spec.whatwg.org/#request-class) use `lowerCamelCase`, and so do we.

Note that some names cannot be used as class properties and will be escaped by adding the suffix `$`.
For example, a protobuf field `constructor` will become a class property `constructor$`.

### Scalar fields

For these field definitions:

```protobuf
string foo = 1;
optional string bar = 2;
```

we will generate the following properties:

```ts
foo: string;
bar?: string;
```

Note that all scalar fields have an intrinsic default value in proto3 syntax, unless they are marked
as `optional`. Protobuf types map to ECMAScript types as follows:

| protobuf type | ECMAScript type | default value       |
| ------------- | --------------- | ------------------- |
| double        | number          | `0`                 |
| float         | number          | `0`                 |
| int64         | bigint          | `0n`                |
| uint64        | bigint          | `0n`                |
| int32         | number          | `0`                 |
| fixed64       | bigint          | `0n`                |
| fixed32       | number          | `0`                 |
| bool          | boolean         | `false`             |
| string        | string          | `""`                |
| bytes         | Uint8Array      | `new Uint8Array(0)` |
| uint32        | number          | `0`                 |
| sfixed32      | number          | `0`                 |
| sfixed64      | bigint          | `0n`                |
| sint32        | number          | `0`                 |
| sint64        | bigint          | `0n`                |

### Message fields

For the following message field declaration:

```protobuf
message Example {
  Example field = 1;
}
```

we generate the following property:

```ts
field?: Example;
```

Note that we special case the well-known wrapper types: If a message uses `google.protobuf.BoolValue` for example, we
automatically "unbox" the field to an optional primitive:

```ts
/**
 * @generated from field: google.protobuf.BoolValue bool_value_field = 1;
 */
boolValueField?: boolean;
```

#### Custom `json_name`

Protobuf supports customizing json representation of a message field via the `json_name` field option. If this is set the wire
representation of the field's name should match the option. To support this feature, the schema is generated with a special type.

For the following customized field:

```protobuf
message Example {
    string field = 1 [json_name = "someOtherName"];
}
```

we generate the following type:

```ts
export interface Example {
  field: {
    "@alias": "someOtherName";
    value: string;
  };
}
```

The `Query` and the result types acquired from `Mask` are unchanged. The `Parameter` types require a special type:

```ts
const param = {
  field: alias("someOtherName", "value"),
} satisfies Parameter<Example>;
```

Note that the type of the field can only be satisfied by the exact `json_name` value and this is like a small boilerplate
that needs to be written for such fields. We suspect only a handful of APIs use this option. We are open to exploring other options
if this approach proves to be too cumbersome or if the option is widely used.

### Relations

For the following Knit relation definition:

```protobuf
package example.relations.v1;

import "buf/knit/options.proto";

service ExampleRelationsService {
    rpc GetExampleRelation(GetExampleRelationRequest) returns (ExampleRelation) {
        option (buf.knit.relation).name = "relation_field";
        option idempotency_level = NO_SIDE_EFFECTS;
    }
}

message GetExampleRelationRequest {
    repeated example.v1.Example bases = 1;
}

message ExampleRelationResponse {
    repeated ExampleResult values = 1;
    message ExampleResult {
        string relation_field = 1;
    }
}
```

we generate the following TypeScript:

```ts
declare module "../../../example/v1/example_knit.js" {
  export interface Example {
    relationField: string;
  }
}
```

This uses a technique called [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) to
merge relation fields into the base interface. Note this only happens if the relation field types are included using a
blank import: `import './gen/example/relations/v1/example_relations_knit.js'`

### Repeated fields

All repeated fields are represented with an ECMAScript Array. For example, the
following field declaration:

```protobuf
repeated string field = 1;
```

is generated as:

```ts
field: string[];
```

Note that all repeated fields will have an empty array as a default value.

### Map fields

For the following map field declaration:

```protobuf
message Example {
    map<string, int32> field = 1;
}
```

we generate the property:

```ts
export interface Example {
  field: { "@map": { [key: string]: number } };
}
```

The `@map` key is used to identify the field as a Protobuf map type, the `Query`, `Parameter` and `Mask` fields
strip the `@map` property and apply the relevant type:

- `Query` uses the query type of the map value type.
- `Parameter` uses the map type as is.
- `Mask` uses map type with the query applied to the map value type.

```ts
const query = {
  field: {}, // Treated as a scalar field since the map value is an int32
} satisfies Query<Example>;

const parameter = {
  field: { key: 1 },
} satisfies Parameter<Example>;

type Result = Mask<typeof query, Example>;
//   ^?  { field: { [k: string]: number } }
```

Note that all map fields will have an empty object as a default value.

While it is not a perfectly clear-cut case, we chose to represent map fields
as plain objects instead of [ECMAScript map objects](https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map-objects).
While `Map` has better behavior around keys, they do not have a literal
representation, do not support the spread operator and type narrowing in
TypeScript.

### Oneof groups

For the following oneof declaration:

```protobuf
message Example {
  oneof result {
    int32 value = 1;
    string error = 2;
  }
}
```

we generate the following property:

```ts
export interface Example {
  result?: {
    "@oneof": {
      value: number;
      error: string;
    };
  };
}
```

The `@oneof` key is used to identify the field as a Protobuf map type, the `Query`, `Parameter` and `Mask` fields
strip the `@oneof` property and apply the relevant type:

- `Query` uses a special type of `OneofQuery<T>` where `T` is the interface with all fields of the oneof.
- `Parameter` also uses a special type `Oneof<T>` where `T` is the interface with all fields of the oneof.
- `Mask` also returns `Oneof<T>`.

```ts
const query = {
  result: oneof({
    value: {},
    error: {},
  }),
} satisfies Query<Example>;

type Result = Mask<typeof query, Example>;
//   ^? { result?: Oneof<{value: number; error: string;}> }
```

[//]: # "TODO: Add links to runtime oneof docs"

> **Note:** This feature requires the TypeScript compiler option `strictNullChecks`
> to be true. See the [documentation](https://www.typescriptlang.org/tsconfig#strictNullChecks) for details.

### Enumerations

For the following enum declaration:

```protobuf
enum Foo {
  DEFAULT_BAR = 0;
  BAR_BELLS = 1;
  BAR_B_CUE = 2;
}
```

we generate the following TypeScript union:

```ts
export type Foo = "DEFAULT_BAR" | "BAR_BELLS" | "BAR_B_CUE" | number;
```

The `number` is for values other than the ones defined in the protobuf source.
This usually happens when two systems are not using same version of protobuf
definition.

Note that some names cannot be used as enum names and will be escaped by
adding the suffix `$`. For example, a protobuf enum `catch` will become a
TypeScript enum `catch$`.

### Extensions

We do not support extensions (a proto2 feature) at this time.

### Nested types

A message or enum can be declared within a message. For example:

```protobuf
message Example {
  message Message {}
  enum Enum {ENUM_UNSPECIFIED = 0;}
}
```

Since TypeScript doesn't have a concept of inner interfaces like Java or C#, we generate the
two interfaces `Example` and `Example_Message`, as well as the literal string union type `Example_Enum`.
