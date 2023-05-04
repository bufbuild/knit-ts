# 🧶 Knit

[![License](https://img.shields.io/github/license/bufbuild/knit-ts?color=blue)][badges_license]
[![NPM Version](https://img.shields.io/npm/v/@bufbuild/knit/latest?color=green&label=%40bufbuild%2Fknit)][npm_knit]
[![NPM Version](https://img.shields.io/npm/v/@bufbuild/protoc-gen-knit-ts/latest?color=green&label=%40bufbuild%2Fprotoc-gen-knit-ts)][npm_protoc-gen-knit-ts]
[![Slack](https://img.shields.io/badge/slack-buf-%23e01563)][badges_slack]

**Knit brings GraphQL-like capabilities to RPCs. Knit has type-safe and
declarative queries that shape the response, batching support to eliminate
the N+1 problem, and first-class support for error handling with partial
responses. It is built on top of Protobuf and Connect.**

**[Knit] is currently in alpha (α), and looking for feedback. Learn more
about it at the [Knit] repo, and learn how to use it with the [Tutorial].**

---

This repo houses TypeScript packages for Knit:

- [@bufbuild/knit](https://npmjs.com/@bufbuild/knit) - The TypeScript client package.
- [@bufbuild/protoc-gen-knit-ts](https://npmjs.com/@bufbuild/protoc-gen-knit-ts) - The schema generator.

## Quick example

To demonstrate the querying capabilities of Knit we've made a Protobuf equivalent of the star wars API at [swapi.dev](https://swapi.dev).
The definitions are available [here](https://buf.build/bufbuild/knit-demo).

Run the following command to install the runtime package and schema for the star wars APIs:

```sh
npm i @bufbuild/knit @buf/bufbuild_knit-demo.bufbuild_knit-es
```

In a TypeScript file write the following query:

```ts
import { createClient } from "@bufbuild/knit";
import type { FilmsService } from "@buf/bufbuild_knit-demo.bufbuild_knit-es/buf/knit/demo/swapi/film/v1/film_knit";
import type {} from "@buf/bufbuild_knit-demo.bufbuild_knit-es/buf/knit/demo/swapi/relations/v1/relations_knit";

const client = createClient<FilmsService>({
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
        // Include the relation you want to use.
        // This field is not part of the original
        // proto definition of a `Film`, it comes
        // from `.../relations_knit`.
        characters: {
          // Relations can accept additional parameters.
          // In this case it accepts a limit parameter
          // to limit the number of characters returned.
          $: { limit: 10 }
          // The fields you want to select from the characters.
          id: {},
          name: {},
        },
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
 *             "characters": [{
 *               { "id": "1", "name": "Luke Skywalker" },
 *               { "id": "2", "name": "C-3PO" },
 *               ...
 *             }]
 *           }
 *        ]
 *     }
 *   }
 * }
 */
```

## Status: Alpha

Knit is undergoing initial development and is not yet stable.

## Legal

Offered under the [Apache 2 license][license].

[badges_license]: https://github.com/bufbuild/knit-ts/blob/main/LICENSE
[badges_slack]: https://buf.build/links/slack
[license]: https://github.com/bufbuild/knit-ts/blob/main/LICENSE
[npm_knit]: https://www.npmjs.com/package/@bufbuild/knit
[npm_protoc-gen-knit-ts]: https://www.npmjs.com/package/@bufbuild/protoc-gen-knit-ts
[knit]: https://github.com/bufbuild/knit
[tutorial]: https://github.com/bufbuild/knit/tree/main/tutorial
