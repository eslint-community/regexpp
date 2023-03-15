import { getLatestUnicodePropertyValues } from "./get-latest-unicode-property-values"

export async function* getLatestUnicodeScriptValues(): AsyncIterable<string> {
    for await (const value of getLatestUnicodePropertyValues()) {
        if (value.propertyAlias !== "sc") {
            continue
        }

        yield* value.aliases
    }
}
