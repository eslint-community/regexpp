import assert from "assert"
import type { AST, RegExpParser } from "../src/index"
import { parseRegExpLiteral, visitRegExpAST } from "../src/index"
import { cloneWithoutCircular } from "../scripts/clone-without-circular"
import { fixturesData } from "./fixtures/visitor"

function generateAST(source: string, options: RegExpParser.Options): AST.Node {
    return cloneWithoutCircular(parseRegExpLiteral(source, options)) as AST.Node
}

describe("visitRegExpAST function:", () => {
    for (const filename of Object.keys(fixturesData)) {
        const fixture = fixturesData[filename]
        const options = fixture.options

        describe(`${filename} (options=${JSON.stringify(options)})`, () => {
            for (const source of Object.keys(fixture.patterns)) {
                it(`${source} should succeed to visit.`, () => {
                    const expected = fixture.patterns[source]
                    const ast = generateAST(source, options)
                    const history = [] as string[]
                    const enter = (node: AST.Node): void => {
                        history.push(`enter:${node.type}:${node.raw}`)
                    }
                    const leave = (node: AST.Node): void => {
                        history.push(`leave:${node.type}:${node.raw}`)
                    }

                    visitRegExpAST(ast, {
                        onAlternativeEnter: enter,
                        onAssertionEnter: enter,
                        onBackreferenceEnter: enter,
                        onCapturingGroupEnter: enter,
                        onCharacterEnter: enter,
                        onCharacterClassEnter: enter,
                        onCharacterClassRangeEnter: enter,
                        onCharacterSetEnter: enter,
                        onClassIntersectionEnter: enter,
                        onClassStringDisjunctionEnter: enter,
                        onClassSubtractionEnter: enter,
                        onExpressionCharacterClassEnter: enter,
                        onFlagsEnter: enter,
                        onGroupEnter: enter,
                        onPatternEnter: enter,
                        onQuantifierEnter: enter,
                        onRegExpLiteralEnter: enter,
                        onStringAlternativeEnter: enter,
                        onAlternativeLeave: leave,
                        onAssertionLeave: leave,
                        onBackreferenceLeave: leave,
                        onCapturingGroupLeave: leave,
                        onCharacterLeave: leave,
                        onCharacterClassLeave: leave,
                        onCharacterClassRangeLeave: leave,
                        onCharacterSetLeave: leave,
                        onClassIntersectionLeave: leave,
                        onClassStringDisjunctionLeave: leave,
                        onClassSubtractionLeave: leave,
                        onExpressionCharacterClassLeave: leave,
                        onFlagsLeave: leave,
                        onGroupLeave: leave,
                        onPatternLeave: leave,
                        onQuantifierLeave: leave,
                        onRegExpLiteralLeave: leave,
                        onStringAlternativeLeave: leave,
                    })

                    assert.deepStrictEqual(history, expected)
                })
            }
        })
    }
})
