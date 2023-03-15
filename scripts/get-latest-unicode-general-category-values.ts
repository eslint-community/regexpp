import { getLatestUnicodePropertyValues } from "./get-latest-unicode-property-values"

export async function* getLatestUnicodeGeneralCategoryValues(): AsyncIterable<string> {
    for await (const value of getLatestUnicodePropertyValues()) {
        if (value.propertyAlias !== "gc") {
            continue
        }

        yield* value.aliases
    }
}
