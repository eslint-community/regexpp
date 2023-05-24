// @ts-ignore -- ignore
import TestStream from "test262-stream"
import path from "path"
import { promises as fs } from "fs"
import { parseRegExpLiteral } from "../src/index"
import jsTokens from "js-tokens"
import { cloneWithoutCircular } from "./clone-without-circular"
import type { RegExpSyntaxError } from "../src/regexp-syntax-error"
import { fixturesData } from "../test/fixtures/parser/literal"
import type { Readable } from "stream"

const fixturesRoot = path.join(
    __dirname,
    "../test/fixtures/parser/literal/test262",
)

const test262Root = path.dirname(require.resolve("test262/package.json"))

const stream: Readable = new TestStream(test262Root, { omitRuntime: true })

type Test = {
    file: string
    contents: string
    attrs: {
        features?: string[]
    }
}

const testObjects: Test[] = []

stream.on("data", (test: Test) => {
    if (!test.file.toLocaleLowerCase().includes("regexp")) {
        return
    }
    testObjects.push(test)
})
stream.on("end", () => {
    // eslint-disable-next-line no-void
    void extractMain()
})

async function extractMain() {
    const usedPatterns = new Set<string>()
    for (const fixture of Object.values(fixturesData)) {
        for (const pattern of Object.keys(fixture.patterns)) {
            usedPatterns.add(pattern)
        }
    }
    const extractedFixtures = new Map<
        string,
        {
            _test262FileNames: string[]
            options: {
                strict?: boolean
            }
            patterns: Record<string, any>
        }
    >()
    for (const test of testObjects.sort((a, b) => {
        const lengthA = a.attrs.features?.length ?? 999
        const lengthB = b.attrs.features?.length ?? 999
        return lengthA - lengthB || compareStr(a.file, b.file)
    })) {
        let filePath: string | undefined = undefined
        if (test.attrs.features && test.attrs.features.length > 0) {
            filePath = path.join(
                fixturesRoot,
                `${[...test.attrs.features]
                    .sort(compareStr)
                    .join("-and-")}.json`,
            )
        } else {
            filePath = path.join(fixturesRoot, "not-categorized.json")
        }
        let fixture = extractedFixtures.get(filePath)

        if (!fixture) {
            if (await fileExists(filePath)) {
                fixture = JSON.parse(await fs.readFile(filePath, "utf8"))
            }
            if (!fixture) {
                fixture = {
                    _test262FileNames: [],
                    options: {},
                    patterns: {},
                }
                extractedFixtures.set(filePath, fixture)
            }
        }
        let has = false
        for (const pattern of extractRegExp(test.contents)) {
            if (usedPatterns.has(pattern)) {
                continue
            }
            has = true
            usedPatterns.add(pattern)
            try {
                const ast = parseRegExpLiteral(pattern, fixture.options)
                fixture.patterns[pattern] = { ast: cloneWithoutCircular(ast) }
            } catch (err) {
                const error = err as RegExpSyntaxError
                fixture.patterns[pattern] = {
                    error: { message: error.message, index: error.index },
                }
            }
        }
        if (has) {
            fixture._test262FileNames = [
                ...fixture._test262FileNames,
                test.file,
            ]
        }
    }
    await fs.copyFile(
        path.join(test262Root, "LICENSE"),
        path.join(fixturesRoot, "LICENSE"),
    )
    for (const [filePath, fixture] of extractedFixtures) {
        if (Object.keys(fixture.patterns).length === 0) {
            continue
        }
        fixture._test262FileNames = [
            ...new Set(fixture._test262FileNames),
        ].sort(compareStr)
        // @ts-ignore -- ignore
        fixture.patterns = Object.fromEntries(
            Object.entries(fixture.patterns).sort((a, b) =>
                compareStr(a[0], b[0]),
            ),
        )
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(
            filePath,
            JSON.stringify(
                fixture,
                (_, v: unknown) => (v === Infinity ? "$$Infinity" : v),
                2,
            ),
        )
    }
}

function* extractRegExp(content: string) {
    for (const token of jsTokens(content)) {
        if (token.type === "RegularExpressionLiteral") {
            yield token.value
        }
    }
}

async function fileExists(filepath: string) {
    try {
        return (await fs.lstat(filepath)).isFile()
    } catch (e) {
        return false
    }
}

function compareStr(a: string, b: string) {
    return a > b ? 1 : a < b ? -1 : 0
}
