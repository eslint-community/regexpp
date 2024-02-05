import fs from "fs"
import type { DOMWindow } from "jsdom"
import { JSDOM } from "jsdom"
import { ESLint } from "eslint"
import { getLatestUnicodeGeneralCategoryValues } from "./get-latest-unicode-general-category-values"
import { getLatestUnicodeScriptValues } from "./get-latest-unicode-script-values"

const DATA_SOURCES = [
    {
        url: "https://262.ecma-international.org/9.0",
        version: 2018,
        binProperties: "#table-binary-unicode-properties",
        gcValues: "#table-unicode-general-category-values",
        scValues: "#table-unicode-script-values",
    },
    {
        url: "https://262.ecma-international.org/10.0",
        version: 2019,
        binProperties: "#table-binary-unicode-properties",
        gcValues: "#table-unicode-general-category-values",
        scValues: "#table-unicode-script-values",
    },
    {
        url: "https://262.ecma-international.org/11.0",
        version: 2020,
        binProperties: "#table-binary-unicode-properties",
        gcValues: "#table-unicode-general-category-values",
        scValues: "#table-unicode-script-values",
    },
    {
        url: "https://262.ecma-international.org/12.0",
        version: 2021,
        binProperties: "#table-binary-unicode-properties",
        gcValues: "#table-unicode-general-category-values",
        scValues: "#table-unicode-script-values",
    },
    {
        url: "https://tc39.es/ecma262/2022/multipage/text-processing.html",
        version: 2022,
        binProperties: "#table-binary-unicode-properties",
        gcValues: "#table-unicode-general-category-values",
        scValues: "#table-unicode-script-values",
    },
    {
        url: "https://tc39.es/ecma262/2023/multipage/text-processing.html",
        version: 2023,
        binProperties: "#table-binary-unicode-properties",
        gcValues: getLatestUnicodeGeneralCategoryValues,
        scValues: getLatestUnicodeScriptValues,
    },
    {
        url: "https://tc39.es/ecma262/multipage/text-processing.html",
        version: 2024,
        binProperties: "#table-binary-unicode-properties",
        gcValues: getLatestUnicodeGeneralCategoryValues,
        scValues: getLatestUnicodeScriptValues,
        binPropertiesOfStrings: "#table-binary-unicode-properties-of-strings",
    },
]
const FILE_PATH = "src/unicode/properties.ts"
const logger = console

type Datum = {
    binProperties: string[]
    gcValues: string[]
    scValues: string[]
    binPropertiesOfStrings: string[]
}

// Main
;(async () => {
    const data: Record<number, Datum> = {}
    const existing = {
        binProperties: new Set<string>(),
        gcValues: new Set<string>(),
        scValues: new Set<string>(),
        binPropertiesOfStrings: new Set<string>(),
    }

    for (const {
        binProperties,
        gcValues,
        scValues,
        binPropertiesOfStrings,
        url,
        version,
    } of DATA_SOURCES) {
        logger.log("---- ECMAScript %d ----", version)
        const datum: Datum = {
            binProperties: [],
            gcValues: [],
            scValues: [],
            binPropertiesOfStrings: [],
        }
        data[version] = datum

        let window: DOMWindow | null = null
        do {
            try {
                logger.log("Fetching data from %o", url)
                ;({ window } = await JSDOM.fromURL(url))
            } catch (err) {
                const error = err as Error
                if (!error || error.message !== "Error: socket hang up") {
                    throw error
                }
                logger.log(error.message, "then retry.")
                await new Promise((resolve) => setTimeout(resolve, 2000))
            }
        } while (window == null)

        logger.log("Parsing tables")
        datum.binProperties = await collectValues(
            window,
            binProperties,
            existing.binProperties,
        )
        datum.gcValues = await collectValues(
            window,
            gcValues,
            existing.gcValues,
        )
        datum.scValues = await collectValues(
            window,
            scValues,
            existing.scValues,
        )
        if (binPropertiesOfStrings) {
            datum.binPropertiesOfStrings = await collectValues(
                window,
                binPropertiesOfStrings,
                existing.binPropertiesOfStrings,
            )
        }

        logger.log("Done")
    }

    logger.log("Generating code...")
    let code = `/* This file was generated with ECMAScript specifications. */

${makeClassDeclarationCode(Object.keys(data))}

const gcNameSet = new Set(["General_Category", "gc"])
const scNameSet = new Set(["Script", "Script_Extensions", "sc", "scx"])
const gcValueSets = new DataSet(${Object.values(data)
        .map((d) => makeDataCode(d.gcValues))
        .join(",")})
const scValueSets = new DataSet(${Object.values(data)
        .map((d) => makeDataCode(d.scValues))
        .join(",")})
const binPropertySets = new DataSet(${Object.values(data)
        .map((d) => makeDataCode(d.binProperties))
        .join(",")})
const binPropertyOfStringsSets = new DataSet(${Object.values(data)
        .map((d) => makeDataCode(d.binPropertiesOfStrings))
        .join(",")})

export function isValidUnicodeProperty(version: number, name: string, value: string): boolean {
    if (gcNameSet.has(name)) {
        return ${Object.entries(data)
            .map(([version, { gcValues }]) =>
                makeVerificationCode(version, "gcValueSets", gcValues),
            )
            .filter(Boolean)
            .join(" || ")}
    }
    if (scNameSet.has(name)) {
        return ${Object.entries(data)
            .map(([version, { scValues }]) =>
                makeVerificationCode(version, "scValueSets", scValues),
            )
            .filter(Boolean)
            .join(" || ")}
    }
    return false
}

export function isValidLoneUnicodeProperty(version: number, value: string): boolean {
    return ${Object.entries(data)
        .map(([version, { binProperties }]) =>
            makeVerificationCode(version, "binPropertySets", binProperties),
        )
        .filter(Boolean)
        .join(" || ")}
}

export function isValidLoneUnicodePropertyOfString(version: number, value: string): boolean {
    return ${Object.entries(data)
        .map(([version, { binPropertiesOfStrings }]) =>
            makeVerificationCode(
                version,
                "binPropertyOfStringsSets",
                binPropertiesOfStrings,
            ),
        )
        .filter(Boolean)
        .join(" || ")}
}
`

    logger.log("Formatting code...")
    const engine = new ESLint({ fix: true })
    const [result] = await engine.lintText(code, { filePath: FILE_PATH })
    code = result.output ?? code

    logger.log("Writing '%s'...", FILE_PATH)
    await save(code)

    logger.log("Completed!")
})().catch((err) => {
    const error = err as Error
    logger.error(error.stack)
    process.exitCode = 1
})

async function collectValues(
    window: DOMWindow,
    idSelectorOrProvider: string | (() => AsyncIterable<string>),
    existingSet: Set<string>,
): Promise<string[]> {
    const getValues =
        typeof idSelectorOrProvider === "function"
            ? idSelectorOrProvider
            : function* (): Iterable<string> {
                  const selector = `${idSelectorOrProvider} td:nth-child(1) code`
                  const nodes = window.document.querySelectorAll(selector)
                  if (nodes.length === 0) {
                      throw new Error(`No nodes found for selector ${selector}`)
                  }
                  logger.log(
                      "%o nodes of %o were found.",
                      nodes.length,
                      selector,
                  )
                  for (const node of Array.from(nodes)) {
                      yield node.textContent ?? ""
                  }
              }

    const missing = new Set(existingSet)
    const values = new Set<string>()
    let allCount = 0

    for await (const value of getValues()) {
        allCount++
        missing.delete(value)
        if (existingSet.has(value)) {
            continue
        }
        existingSet.add(value)
        values.add(value)
    }

    if (missing.size > 0) {
        throw new Error(`Missing values: ${Array.from(missing).join(", ")}`)
    }

    logger.log(
        "%o adopted and %o ignored as duplication.",
        values.size,
        allCount - values.size,
    )

    return [...values].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
}

function makeClassDeclarationCode(versions: string[]): string {
    const fields = versions
        .map(
            (v) =>
                `private _raw${v}: string\n\nprivate _set${v}: Set<string> | undefined`,
        )
        .join("\n\n")
    const parameters = versions.map((v) => `raw${v}: string`).join(", ")
    const init = versions.map((v) => `this._raw${v} = raw${v}`).join("\n")
    const getters = versions
        .map(
            (v) =>
                `public get es${v}(): Set<string> { return this._set${v} ?? (this._set${v} = new Set(this._raw${v}.split(" "))) }`,
        )
        .join("\n\n")

    return `
        class DataSet {
            ${fields}

            public constructor(${parameters}) {
                ${init}
            }

            ${getters}
        }
    `
}

function makeDataCode(values: string[]): string {
    return `"${values
        .map((value) => JSON.stringify(value).slice(1, -1))
        .join(" ")}"`
}

function makeVerificationCode(
    version: string,
    patternVar: string,
    values: string[],
): string {
    if (values.length === 0) {
        return ""
    }

    return `(version >= ${version} && ${patternVar}.es${version}.has(value))`
}

function save(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(FILE_PATH, content, (error) => {
            if (error) {
                reject(error)
            } else {
                resolve()
            }
        })
    })
}
