import type { AST } from "../src/index"
import { parseRegExpLiteral, visitRegExpAST } from "../src/index"
import type { RegExpSyntaxError } from "../src/regexp-syntax-error"
import * as Parser from "../test/fixtures/parser/literal"
import * as Visitor from "../test/fixtures/visitor"
import { cloneWithoutCircular } from "./clone-without-circular"

for (const filename of Object.keys(Parser.fixturesData)) {
    const fixture = Parser.fixturesData[filename]
    const options = fixture.options

    for (const pattern of Object.keys(fixture.patterns)) {
        try {
            const ast = parseRegExpLiteral(pattern, options)
            fixture.patterns[pattern] = { ast: cloneWithoutCircular(ast) }
        } catch (err) {
            const error = err as RegExpSyntaxError
            fixture.patterns[pattern] = {
                error: { message: error.message, index: error.index },
            }
        }
    }

    Parser.save()
}

for (const filename of Object.keys(Visitor.fixturesData)) {
    const fixture = Visitor.fixturesData[filename]
    const options = fixture.options

    for (const pattern of Object.keys(fixture.patterns)) {
        const ast = parseRegExpLiteral(pattern, options)
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

        fixture.patterns[pattern] = history
    }

    Visitor.save()
}
