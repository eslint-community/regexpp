import type {
    Alternative,
    Assertion,
    Backreference,
    CapturingGroup,
    Character,
    CharacterClass,
    CharacterClassRange,
    CharacterSet,
    ClassIntersection,
    ClassStringDisjunction,
    ClassSubtraction,
    ExpressionCharacterClass,
    Flags,
    Group,
    Node,
    Pattern,
    Quantifier,
    RegExpLiteral,
    StringAlternative,
} from "./ast"

/**
 * The visitor to walk on AST.
 */
export class RegExpVisitor {
    private readonly _handlers: RegExpVisitor.Handlers

    /**
     * Initialize this visitor.
     * @param handlers Callbacks for each node.
     */
    public constructor(handlers: RegExpVisitor.Handlers) {
        this._handlers = handlers
    }

    /**
     * Visit a given node and descendant nodes.
     * @param node The root node to visit tree.
     */
    // eslint-disable-next-line complexity
    public visit(node: Node): void {
        switch (node.type) {
            case "Alternative":
                this.visitAlternative(node)
                break
            case "Assertion":
                this.visitAssertion(node)
                break
            case "Backreference":
                this.visitBackreference(node)
                break
            case "CapturingGroup":
                this.visitCapturingGroup(node)
                break
            case "Character":
                this.visitCharacter(node)
                break
            case "CharacterClass":
                this.visitCharacterClass(node)
                break
            case "CharacterClassRange":
                this.visitCharacterClassRange(node)
                break
            case "CharacterSet":
                this.visitCharacterSet(node)
                break
            case "ClassIntersection":
                this.visitClassIntersection(node)
                break
            case "ClassStringDisjunction":
                this.visitClassStringDisjunction(node)
                break
            case "ClassSubtraction":
                this.visitClassSubtraction(node)
                break
            case "ExpressionCharacterClass":
                this.visitExpressionCharacterClass(node)
                break
            case "Flags":
                this.visitFlags(node)
                break
            case "Group":
                this.visitGroup(node)
                break
            case "Pattern":
                this.visitPattern(node)
                break
            case "Quantifier":
                this.visitQuantifier(node)
                break
            case "RegExpLiteral":
                this.visitRegExpLiteral(node)
                break
            case "StringAlternative":
                this.visitStringAlternative(node)
                break
            default:
                throw new Error(
                    `Unknown type: ${(node as Pick<Node, "type">).type}`,
                )
        }
    }

    private visitAlternative(node: Alternative): void {
        if (this._handlers.onAlternativeEnter) {
            this._handlers.onAlternativeEnter(node)
        }
        node.elements.forEach(this.visit, this)
        if (this._handlers.onAlternativeLeave) {
            this._handlers.onAlternativeLeave(node)
        }
    }

    private visitAssertion(node: Assertion): void {
        if (this._handlers.onAssertionEnter) {
            this._handlers.onAssertionEnter(node)
        }
        if (node.kind === "lookahead" || node.kind === "lookbehind") {
            node.alternatives.forEach(this.visit, this)
        }
        if (this._handlers.onAssertionLeave) {
            this._handlers.onAssertionLeave(node)
        }
    }

    private visitBackreference(node: Backreference): void {
        if (this._handlers.onBackreferenceEnter) {
            this._handlers.onBackreferenceEnter(node)
        }
        if (this._handlers.onBackreferenceLeave) {
            this._handlers.onBackreferenceLeave(node)
        }
    }

    private visitCapturingGroup(node: CapturingGroup): void {
        if (this._handlers.onCapturingGroupEnter) {
            this._handlers.onCapturingGroupEnter(node)
        }
        node.alternatives.forEach(this.visit, this)
        if (this._handlers.onCapturingGroupLeave) {
            this._handlers.onCapturingGroupLeave(node)
        }
    }

    private visitCharacter(node: Character): void {
        if (this._handlers.onCharacterEnter) {
            this._handlers.onCharacterEnter(node)
        }
        if (this._handlers.onCharacterLeave) {
            this._handlers.onCharacterLeave(node)
        }
    }

    private visitCharacterClass(node: CharacterClass): void {
        if (this._handlers.onCharacterClassEnter) {
            this._handlers.onCharacterClassEnter(node)
        }
        node.elements.forEach(this.visit, this)
        if (this._handlers.onCharacterClassLeave) {
            this._handlers.onCharacterClassLeave(node)
        }
    }

    private visitCharacterClassRange(node: CharacterClassRange): void {
        if (this._handlers.onCharacterClassRangeEnter) {
            this._handlers.onCharacterClassRangeEnter(node)
        }
        this.visitCharacter(node.min)
        this.visitCharacter(node.max)
        if (this._handlers.onCharacterClassRangeLeave) {
            this._handlers.onCharacterClassRangeLeave(node)
        }
    }

    private visitCharacterSet(node: CharacterSet): void {
        if (this._handlers.onCharacterSetEnter) {
            this._handlers.onCharacterSetEnter(node)
        }
        if (this._handlers.onCharacterSetLeave) {
            this._handlers.onCharacterSetLeave(node)
        }
    }

    private visitClassIntersection(node: ClassIntersection): void {
        if (this._handlers.onClassIntersectionEnter) {
            this._handlers.onClassIntersectionEnter(node)
        }
        this.visit(node.left)
        this.visit(node.right)
        if (this._handlers.onClassIntersectionLeave) {
            this._handlers.onClassIntersectionLeave(node)
        }
    }

    private visitClassStringDisjunction(node: ClassStringDisjunction): void {
        if (this._handlers.onClassStringDisjunctionEnter) {
            this._handlers.onClassStringDisjunctionEnter(node)
        }
        node.alternatives.forEach(this.visit, this)
        if (this._handlers.onClassStringDisjunctionLeave) {
            this._handlers.onClassStringDisjunctionLeave(node)
        }
    }

    private visitClassSubtraction(node: ClassSubtraction): void {
        if (this._handlers.onClassSubtractionEnter) {
            this._handlers.onClassSubtractionEnter(node)
        }
        this.visit(node.left)
        this.visit(node.right)
        if (this._handlers.onClassSubtractionLeave) {
            this._handlers.onClassSubtractionLeave(node)
        }
    }

    private visitExpressionCharacterClass(
        node: ExpressionCharacterClass,
    ): void {
        if (this._handlers.onExpressionCharacterClassEnter) {
            this._handlers.onExpressionCharacterClassEnter(node)
        }
        this.visit(node.expression)
        if (this._handlers.onExpressionCharacterClassLeave) {
            this._handlers.onExpressionCharacterClassLeave(node)
        }
    }

    private visitFlags(node: Flags): void {
        if (this._handlers.onFlagsEnter) {
            this._handlers.onFlagsEnter(node)
        }
        if (this._handlers.onFlagsLeave) {
            this._handlers.onFlagsLeave(node)
        }
    }

    private visitGroup(node: Group): void {
        if (this._handlers.onGroupEnter) {
            this._handlers.onGroupEnter(node)
        }
        node.alternatives.forEach(this.visit, this)
        if (this._handlers.onGroupLeave) {
            this._handlers.onGroupLeave(node)
        }
    }

    private visitPattern(node: Pattern): void {
        if (this._handlers.onPatternEnter) {
            this._handlers.onPatternEnter(node)
        }
        node.alternatives.forEach(this.visit, this)
        if (this._handlers.onPatternLeave) {
            this._handlers.onPatternLeave(node)
        }
    }

    private visitQuantifier(node: Quantifier): void {
        if (this._handlers.onQuantifierEnter) {
            this._handlers.onQuantifierEnter(node)
        }
        this.visit(node.element)
        if (this._handlers.onQuantifierLeave) {
            this._handlers.onQuantifierLeave(node)
        }
    }

    private visitRegExpLiteral(node: RegExpLiteral): void {
        if (this._handlers.onRegExpLiteralEnter) {
            this._handlers.onRegExpLiteralEnter(node)
        }
        this.visitPattern(node.pattern)
        this.visitFlags(node.flags)
        if (this._handlers.onRegExpLiteralLeave) {
            this._handlers.onRegExpLiteralLeave(node)
        }
    }

    private visitStringAlternative(node: StringAlternative): void {
        if (this._handlers.onStringAlternativeEnter) {
            this._handlers.onStringAlternativeEnter(node)
        }
        node.elements.forEach(this.visit, this)
        if (this._handlers.onStringAlternativeLeave) {
            this._handlers.onStringAlternativeLeave(node)
        }
    }
}

export namespace RegExpVisitor {
    export interface Handlers {
        onAlternativeEnter?: (node: Alternative) => void
        onAlternativeLeave?: (node: Alternative) => void
        onAssertionEnter?: (node: Assertion) => void
        onAssertionLeave?: (node: Assertion) => void
        onBackreferenceEnter?: (node: Backreference) => void
        onBackreferenceLeave?: (node: Backreference) => void
        onCapturingGroupEnter?: (node: CapturingGroup) => void
        onCapturingGroupLeave?: (node: CapturingGroup) => void
        onCharacterEnter?: (node: Character) => void
        onCharacterLeave?: (node: Character) => void
        onCharacterClassEnter?: (node: CharacterClass) => void
        onCharacterClassLeave?: (node: CharacterClass) => void
        onCharacterClassRangeEnter?: (node: CharacterClassRange) => void
        onCharacterClassRangeLeave?: (node: CharacterClassRange) => void
        onCharacterSetEnter?: (node: CharacterSet) => void
        onCharacterSetLeave?: (node: CharacterSet) => void
        onClassIntersectionEnter?: (node: ClassIntersection) => void
        onClassIntersectionLeave?: (node: ClassIntersection) => void
        onClassStringDisjunctionEnter?: (node: ClassStringDisjunction) => void
        onClassStringDisjunctionLeave?: (node: ClassStringDisjunction) => void
        onClassSubtractionEnter?: (node: ClassSubtraction) => void
        onClassSubtractionLeave?: (node: ClassSubtraction) => void
        onExpressionCharacterClassEnter?: (
            node: ExpressionCharacterClass,
        ) => void
        onExpressionCharacterClassLeave?: (
            node: ExpressionCharacterClass,
        ) => void
        onFlagsEnter?: (node: Flags) => void
        onFlagsLeave?: (node: Flags) => void
        onGroupEnter?: (node: Group) => void
        onGroupLeave?: (node: Group) => void
        onPatternEnter?: (node: Pattern) => void
        onPatternLeave?: (node: Pattern) => void
        onQuantifierEnter?: (node: Quantifier) => void
        onQuantifierLeave?: (node: Quantifier) => void
        onRegExpLiteralEnter?: (node: RegExpLiteral) => void
        onRegExpLiteralLeave?: (node: RegExpLiteral) => void
        onStringAlternativeEnter?: (node: StringAlternative) => void
        onStringAlternativeLeave?: (node: StringAlternative) => void
    }
}
