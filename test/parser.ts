import assert from "assert"
import { parseRegExpLiteral, RegExpParser, RegExpValidator } from "../src/index"
import type { RegExpSyntaxError } from "../src/regexp-syntax-error"
import { cloneWithoutCircular } from "../scripts/clone-without-circular"
import { fixturesData } from "./fixtures/parser/literal"
import {
    ASTERISK,
    isLineTerminator,
    LEFT_SQUARE_BRACKET,
    REVERSE_SOLIDUS,
    RIGHT_SQUARE_BRACKET,
    SOLIDUS,
} from "../src/unicode"

function generateAST(source: string, options: RegExpParser.Options): object {
    return cloneWithoutCircular(parseRegExpLiteral(source, options))
}

describe("parseRegExpLiteral function:", () => {
    for (const filename of Object.keys(fixturesData)) {
        const fixture = fixturesData[filename]
        const options = fixture.options

        describe(`${filename} (options=${JSON.stringify(options)})`, () => {
            if (filename.includes("-valid")) {
                it("should not contain any invalid test case", () => {
                    for (const source of Object.keys(fixture.patterns)) {
                        const result = fixture.patterns[source]
                        assert("ast" in result, `${source} is invalid`)
                    }
                })
            } else if (filename.includes("-invalid")) {
                it("should not contain any valid test case", () => {
                    for (const source of Object.keys(fixture.patterns)) {
                        const result = fixture.patterns[source]
                        assert("error" in result, `${source} is valid`)
                    }
                })
            }

            for (const source of Object.keys(fixture.patterns)) {
                const result = fixture.patterns[source]
                if ("ast" in result) {
                    it(`${source} should succeed to parse.`, () => {
                        const expected = result.ast
                        const actual = generateAST(source, options)
                        assert.deepStrictEqual(actual, expected)
                    })
                } else {
                    it(`${source} should throw syntax error.`, () => {
                        const expected = result.error
                        try {
                            parseRegExpLiteral(source, options)
                        } catch (err) {
                            const error = err as RegExpSyntaxError
                            assert.strictEqual(error.message, expected.message)
                            assert.strictEqual(error.index, expected.index)

                            assert.strictEqual(
                                expected.message.slice(0, 27),
                                "Invalid regular expression:",
                                `The error message '${expected.message}' was not syntax error.`,
                            )
                            return
                        }
                        assert.fail("Should fail, but succeeded.")
                    })

                    const validator = new RegExpValidator(options)
                    const extracted = extractPatternAndFlags(source, validator)
                    if (extracted) {
                        it(`${source} should throw syntax error with RegExpValidator#validatePattern.`, () => {
                            const expected = result.error
                            try {
                                validator.validatePattern(
                                    extracted.pattern,
                                    undefined,
                                    undefined,
                                    {
                                        unicode: extracted.flags.includes("u"),
                                        unicodeSets:
                                            extracted.flags.includes("v"),
                                    },
                                )
                            } catch (err) {
                                const error = err as RegExpSyntaxError
                                const expectedMessage =
                                    expected.message.replace(
                                        /\/([a-z]+?):/u,
                                        (_, flagsInLiteral: string) =>
                                            `/${flagsInLiteral.replace(
                                                /[^uv]/gu,
                                                "",
                                            )}:`,
                                    )
                                const expectedIndex = expected.index - 1
                                assert.strictEqual(
                                    error.message,
                                    expectedMessage,
                                )
                                assert.strictEqual(error.index, expectedIndex)
                                return
                            }
                            assert.fail("Should fail, but succeeded.")
                        })
                    }
                }
            }
        })
    }

    it("should parse RegExp object", () => {
        const actual = cloneWithoutCircular(parseRegExpLiteral(/[A-Z]+/u))
        const expected = cloneWithoutCircular(parseRegExpLiteral("/[A-Z]+/u"))

        assert.deepStrictEqual(actual, expected)
    })
})

describe("RegExpParser:", () => {
    describe("parsePattern function", () => {
        it("should throw syntax error on '\\'.", () => {
            assert.throws(
                () => new RegExpParser().parsePattern("\\"),
                /\\ at end of pattern/u,
            )
        })
    })
})

function extractPatternAndFlags(
    source: string,
    validator: RegExpValidator,
): { pattern: string; flags: string } | null {
    let inClass = false
    let escaped = false

    const chars = [...source]

    if (chars[0] !== "/") {
        return null
    }
    chars.shift()

    const pattern: string[] = []

    let first = true
    // https://tc39.es/ecma262/2022/multipage/ecmascript-language-lexical-grammar.html#prod-RegularExpressionBody
    for (;;) {
        const char = chars.shift()
        if (!char) {
            return null
        }
        const cp = char.charCodeAt(0)!
        if (isLineTerminator(cp)) {
            return null
        }
        if (escaped) {
            escaped = false
        } else if (cp === REVERSE_SOLIDUS) {
            escaped = true
        } else if (cp === LEFT_SQUARE_BRACKET) {
            inClass = true
        } else if (cp === RIGHT_SQUARE_BRACKET) {
            inClass = false
        } else if (cp === ASTERISK && first) {
            return null
        } else if (cp === SOLIDUS && !inClass) {
            break
        }
        pattern.push(char)
        first = false
    }

    const flags = chars.join("")
    if (pattern.length === 0) {
        return null
    }

    try {
        validator.validateFlags(flags)
    } catch {
        return null
    }

    return { pattern: pattern.join(""), flags }
}
