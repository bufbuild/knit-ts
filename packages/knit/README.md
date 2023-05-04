# Knit

The Knit client. Knit brings GraphQL like capabilities to RPCs. It is built on top of [Protobuf](https://protobuf.com) and [Connect](https://connect.build).
This package exports a TypeScript client for Knit among other utilities for constructing and executing typed Knit queries.

Learn more about Knit at [github.com/bufbuild/knit](https://github.com/bufbuild/knit).

## Quick example

To use the client, you need a Knit schema and a Knit Gateway. Please refer to the [plugin docs](https://npmjs.com/@bufbuild/protoc-gen-knit-ts)
to see how to generate the Knit schema for your Protobuf API. The gateway docs are available [here](https://github.com/bufbuild/knit-go).

We highly recommend reading through the [Knit tutorial](https://github.com/bufbuild/knit) to get an overview.

### Client

The Knit client exposes a simple API for constructing and executing Knit queries. It has three methods:

- `fetch` - Used for unary RPCs without any side-effects. Must be annotated with `idempotency` option.
- `do` - Used for unary RPCs that may have side-effects (Update, Create, Delete).
- `listen` - Used for server streaming RPCs.

All three methods take a single argument, a Knit query. The query is a plain old TypeScript object.

### Query

```ts
import type { FilmService } from "./gen/buf/knit/demo/swapi/film/v1/film_knit";
import type { PersonService } from "./gen/buf/knit/demo/swapi/person/v1/person_knit";
import { createClient } from "@bufbuild/knit";

// Include the services you want to use in the schema by using the `&` operator.
type Schema = FilmService & PersonService;

// Create a Knit client.
const client = createClient<Schema>({
  baseUrl: "https://knit-demo.connect.build", // The gateway-url
});

// Construct a query.
//
// The type system will ensure a query is valid.
const filmsResult = await client.fetch({
  // The fully qualified service name of the RPC you want to invoke.
  "buf.knit.demo.swapi.film.v1.FilmService": {
    // The camelCase name of the RPC you want to invoke.
    getFilms: {
      // $ is the request message for the RPC.
      $: { ids: ["1"] },
      // The fields you want to select from the result.
      films: {
        id: {},
        title: {},
        director: {},
        releaseDate: {},
        characterIds: {},
      },
    },
  },
});

// The result is a strongly typed object that matches the query.
console.log(JSON.strigify(filmsResult, null, 2));
/**
 * This will print:
 * {
 *   "buf.knit.demo.swapi.film.v1.FilmService": {
 *     "getFilms": {
 *        "films": [
 *           {
 *             "id": "1",
 *             "title": "A New Hope",
 *             "director": "George Lucas",
 *             "releaseDate": "1977-05-25",
 *             "characterIds": ["1", "2", ...]
 *           }
 *        ]
 *     }
 *   }
 * }
 */
```

### Relations

Next you may want to get all the characters of the film. One way to do this is to call `getPeople`:

```ts
const characterIds =
  filmsResult["buf.knit.demo.swapi.film.v1.FilmService"].getFilms.films[0]
    .characterIds;
const peopleResult = await client.fetch({
  "buf.knit.demo.swapi.person.v1.PersonService": {
    // The camelCase name of the RPC you want to invoke.
    getPeople: {
      // The request message for the RPC.
      $: { ids: characterIds },
      // The fields you want to select from the result.
      people: {
        id: {},
        name: {},
      },
    },
  },
});
```

But this requires us to make an extra RPC call. Instead, we can use Knit relations to extend the response of `getFilms` with the characters of the film.

```ts
// Type only import. Uses declaration merging to add the relations to the FilmService. Erased at runtime.
import type {} from "./gen/buf/knit/demo/swapi/relations/v1/relations_knit";

const filmsResult = await client.fetch({
  "buf.knit.demo.swapi.film.v1.FilmService": {
    getFilms: {
      $: { ids: ["1"] },
      films: {
        id: {},
        title: {},
        director: {},
        releaseDate: {},
        // Include the relation you want to use.
        characters: {
          // Relations can accept additional parameters. In this case it accepts a limit
          // parameter to limit the number of characters returned.
          $: { limit: 10 }
          // The fields you want to select from the characters.
          id: {},
          name: {},
        },
      },
    },
  },
});

console.log(JSON.stringify(filmsResult["buf.knit.demo.swapi.film.v1.FilmService"].getFilms.films[0].characters, null, 2));
/**
 * This will print:
 * [
 *   { "id": "1", "name": "Luke Skywalker" },
 *   { "id": "2", "name": "C-3PO" },
 *   ...
 * ]
 */
```

### Error handling

Errors can occur either at the entry point RPCs or at relation fields. At each point errors can either be caught or thrown to bubble up until the operation itself throws the error. Let's understand this with an example:

```ts
const filmsResult = await client.fetch({
  "buf.knit.demo.swapi.film.v1.FilmService": {
    getFilms: {
      $: { ids: ["1"] },
      films: {
        id: {},
        characters: {
          $: { limit: 10 }
          name: {},
        },
      },
    },
  },
});
/**
 *  The type of filmsResult:
 *  {
 *    "buf.knit.demo.swapi.film.v1.FilmService": {
 *      getFilms: {
 *        films?: {
 *          id: string;
 *          characters?: {
 *            name: string
 *          }[]
 *        }[]
 *      }
 *    }
 *  }
 */
```

In the above example, errors can occur at `getFilms` (entry point) and at `characters` (relation). The default for `fetch` is to throw the error, hence in the example either error results in
`fetch` throwing the error.

This may not be often desirable there maybe parts of the query that are less important or may even be expected to error. To support such use cases, one can annotate the query:

```ts
const filmsResult = await client.fetch({
  "buf.knit.demo.swapi.film.v1.FilmService": {
    getFilms: {
      '@catch': {}, // This will catch an error that has occurred while resolving `getFilms` and all the relations within `getFilms`
      $: { ids: ["1"] },
      films: {
        id: {},
        characters: {
        // '@catch': {},
        // Uncomment the above line to catch character errors and all relations within it.
          $: { limit: 10 }
          name: {},
        },
      },
    },
  },
});
/**
 *  The type of filmsResult:
 *  {
 *    "buf.knit.demo.swapi.film.v1.FilmService": {
 *      getFilms: {
 *        films?: {
 *          id: string;
 *          characters?: {
 *            name: string
 *          }[];
 *        }[];
 *      } | KnitError;    // <- Notice the union with `KnitError`
 *    };
 *  }
 */

const getFilmsResult = filmsResult["buf.knit.demo.swapi.film.v1.FilmService"].getFilms;
if (getFilmsResult instanceof KnitError) {
    // Handle error.
} else {
    // Handle result
}
```

The `@catch` annotation catches any errors that occur at and within the field. In the above example, the `@catch` at `getFilms` will also catch the error at `characters`.

`fetch` and `do` use different defaults for error handling. The default for `fetch` is `@throw` which throws all errors and returns full response or error. On the other hand the default for `do` is `@catch` which catches all errors and returns a partial response. This is because
`do` queries can result in state changes, unlike `fetch` they may not be idempotent. `@throw` can be used similar to `@catch` in `fetch` to throw the error. `listen` works like `fetch`.

### Scoping the client

If you have a large API with many services, you may want to scope the client to a subset of the services to avoid typing long package names. You can do this by using `makeScopedClient` function.

In the star wars example all the services begin with `buf.knit.demo.swapi`. We can scope the client to only include services that begin with this prefix:

```ts
import { makeScopedClient } from "@bufbuild/knit";

// We scope the client to only include services that begin with "buf.knit.demo.swapi".
//
// This can be scoped to any prefix of a service in the schema. Accepted prefixes for star wars client with `FilmService` and `PeopleService` are:
// buf | buf.knit | buf.knit.demo | buf.knit.demo.swapi | buf.knit.demo.swapi.film | buf.knit.demo.swapi.film.v1 | buf.knit.demo.swapi.people | buf.knit.demo.swapi.people.v1
const swapiClient = makeScopedClient(client, "buf.knit.demo.swapi");

const filmsResult = await swapiClient.do({
  // The prefix is omitted.
  "film.v1.FilmService": {
    getFilms {
      $: { ids: ["1"] },
      films: {
        id: {},
        title: {},
        director: {},
        releaseDate: {},
        characterIds: {},
      },
    },
  },
});

// The result reflects the query.
console.log(JSON.stringify(filmsResult["film.v1.FilmService"].getFilms.films[0].director, null, 2));
```

### Reusing queries and co-location

You may want to fetch the same fields for a type in multiple queries. Since Knit queries are plain old JS/TS object literals you can use the spread operator to reuse queries:

```ts
import { Query } from "@bufbuild/knit";
import { Film } from "./gen/buf/knit/demo/swapi/film/v1/film_knit";

// Reusable film query.
const filmQuery = {
  id: {},
  title: {},
  director: {},
  characterIds: {},
} satisfies Query<Film>; // We use the satisfies keyword to ensure that the query is valid.

const filmsResult = await swapiClient.do({
  "film.v1.FilmService": {
    getFilms {
      $: { ids: ["1"] },
      films: {
        // Expand the query.
        ...filmQuery,
        releaseDate: {},
      },
    },
  },
});
```

Using the `Mask` utility type you can get the type of the result of a query:

```ts
const filmQuery = {
  id: {},
  title: {},
  director: {},
  characterIds: {},
} satisfies Query<Film>;

type FilmResult = Mask<typeof filmQuery, Film>; // FilmResult is { id: string; title: string; director: string; characterIds: string[]; }

interface Props {
  films: FilmResult[];
}

const FilmsList: React.FC<Props> = ({ films }) => {
  return (
    <>
      {films.map((film) => (
        <FilmComponent film={film} />
      ))}
    </>
  );
};
```

_NOTE_: Casting the query to `Query<Film>` will result in the wrong return type (includes all possible fields), instead we use the `satisfies` keyword to ensure that the query is valid and retain the literal type of the query.

## Status: Alpha

Knit is undergoing initial development and is not yet stable.

## Legal

Offered under the [Apache 2 license][license].

[license]: https://github.com/bufbuild/knit-web/blob/main/LICENSE
