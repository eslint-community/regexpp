import assert from "assert"
import { RegExpValidator } from "../src/index"

describe("negated character class with string elements", () => {
    const validator = new RegExpValidator()

    const invalidPatterns = [String.raw`[^a-b\q{ab}]`, String.raw`[^\q{ab}a-b]`]

    for (const pattern of invalidPatterns) {
        it(`should reject ${pattern}`, () => {
            assert.throws(() => {
                validator.validatePattern(pattern, 0, pattern.length, {
                    unicodeSets: true,
                })
            }, /Negated character class may contain strings/u)
        })
    }

    it("should allow a non-negated class with strings", () => {
        const pattern = String.raw`[a-b\q{ab}]`

        assert.doesNotThrow(() => {
            validator.validatePattern(pattern, 0, pattern.length, {
                unicodeSets: true,
            })
        })
    })
})
