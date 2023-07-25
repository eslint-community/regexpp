import assert from "assert"
import { RegExpValidator } from "../src/index"
import type { RegExpSyntaxError } from "../src/regexp-syntax-error"

const validator = new RegExpValidator()

function getErrorForPattern(
    source: string,
    start: number,
    end: number,
    flags: {
        unicode?: boolean
        unicodeSets?: boolean
    },
): RegExpSyntaxError {
    try {
        validator.validatePattern(source, start, end, flags)
    } catch (err) {
        const error = err as RegExpSyntaxError
        return error
    }
    return assert.fail("Should fail, but succeeded.")
}

function getErrorForFlags(
    source: string,
    start: number,
    end: number,
): RegExpSyntaxError {
    try {
        validator.validateFlags(source, start, end)
    } catch (err) {
        const error = err as RegExpSyntaxError
        return error
    }
    return assert.fail("Should fail, but succeeded.")
}

function getErrorForLiteral(
    source: string,
    start: number,
    end: number,
): RegExpSyntaxError {
    try {
        validator.validateLiteral(source, start, end)
    } catch (err) {
        const error = err as RegExpSyntaxError
        return error
    }
    return assert.fail("Should fail, but succeeded.")
}

describe("RegExpValidator#validatePattern error:", () => {
    for (const test of [
        {
            source: "abcd",
            start: 0,
            end: 2,
            flags: { unicode: true, unicodeSets: true },
            error: {
                message:
                    "Invalid regular expression: /ab/uv: Invalid regular expression flags",
                index: 3,
            },
        },
        {
            source: "[A]",
            start: 0,
            end: 2,
            flags: { unicode: true, unicodeSets: false },
            error: {
                message:
                    "Invalid regular expression: /[A/u: Unterminated character class",
                index: 2,
            },
        },
        {
            source: "[[A]]",
            start: 0,
            end: 4,
            flags: { unicode: false, unicodeSets: true },
            error: {
                message:
                    "Invalid regular expression: /[[A]/v: Unterminated character class",
                index: 4,
            },
        },
        {
            source: " /[[A]/v ",
            start: 2,
            end: 6,
            flags: { unicode: false, unicodeSets: true },
            error: {
                message:
                    "Invalid regular expression: /[[A]/v: Unterminated character class",
                index: 6,
            },
        },
    ]) {
        it(`${JSON.stringify(test)} should throw syntax error.`, () => {
            const error = getErrorForPattern(
                test.source,
                test.start,
                test.end,
                test.flags,
            )
            assert.deepStrictEqual(
                { message: error.message, index: error.index },
                test.error,
            )
        })
    }
})

describe("RegExpValidator#validateFlags error:", () => {
    for (const test of [
        {
            source: "abcd",
            start: 0,
            end: 2,
            error: {
                message: "Invalid regular expression: Invalid flag 'a'",
                index: 0,
            },
        },
        {
            source: "dd",
            start: 0,
            end: 2,
            error: {
                message: "Invalid regular expression: Duplicated flag 'd'",
                index: 0,
            },
        },
        {
            source: "/a/dd",
            start: 3,
            end: 5,
            error: {
                message: "Invalid regular expression: Duplicated flag 'd'",
                index: 3,
            },
        },
    ]) {
        it(`${JSON.stringify(test)} should throw syntax error.`, () => {
            const error = getErrorForFlags(test.source, test.start, test.end)
            assert.deepStrictEqual(
                { message: error.message, index: error.index },
                test.error,
            )
        })
    }
})

describe("RegExpValidator#validateLiteral error:", () => {
    for (const test of [
        {
            source: " /[/ ",
            start: 1,
            end: 4,
            error: {
                message:
                    "Invalid regular expression: /[/: Unterminated character class",
                index: 4,
            },
        },
    ]) {
        it(`${JSON.stringify(test)} should throw syntax error.`, () => {
            const error = getErrorForLiteral(test.source, test.start, test.end)
            assert.deepStrictEqual(
                { message: error.message, index: error.index },
                test.error,
            )
        })
    }
})
