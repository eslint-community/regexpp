/**
 * The type which includes all nodes.
 */
export type Node = BranchNode | LeafNode

/**
 * The type which includes all branch nodes.
 */
export type BranchNode =
    | Alternative
    | CapturingGroup
    | CharacterClass
    | CharacterClassRange
    | ClassIntersection
    | ClassStringDisjunction
    | ClassSubtraction
    | ExpressionCharacterClass
    | Group
    | LookaroundAssertion
    | Pattern
    | Quantifier
    | RegExpLiteral
    | StringAlternative

/**
 * The type which includes all leaf nodes.
 */
export type LeafNode =
    | Backreference
    | BoundaryAssertion
    | Character
    | CharacterSet
    | Flags

/**
 * The type which includes all atom nodes.
 */
export type Element = Assertion | QuantifiableElement | Quantifier

/**
 * The type which includes all atom nodes that Quantifier node can have as children.
 */
export type QuantifiableElement =
    | Backreference
    | CapturingGroup
    | Character
    | CharacterClass
    | CharacterSet
    | ExpressionCharacterClass
    | Group
    | LookaheadAssertion

/**
 * The type which includes all character class atom nodes.
 */
export type CharacterClassElement =
    | ClassRangesCharacterClassElement
    | UnicodeSetsCharacterClassElement
export type ClassRangesCharacterClassElement =
    | Character
    | CharacterClassRange
    | CharacterUnicodePropertyCharacterSet
    | EscapeCharacterSet
export type UnicodeSetsCharacterClassElement =
    | Character
    | CharacterClassRange
    | ClassStringDisjunction
    | EscapeCharacterSet
    | ExpressionCharacterClass
    | UnicodePropertyCharacterSet
    | UnicodeSetsCharacterClass

/**
 * The type which defines common properties for all node types.
 */
export type NodeBase = {
    /** The node type. */
    type: Node["type"]
    /** The parent node. */
    parent: Node["parent"]
    /** The 0-based index that this node starts. */
    start: number
    /** The 0-based index that this node ends. */
    end: number
    /** The raw text of this node. */
    raw: string
}

/**
 * The root node.
 */
export type RegExpLiteral = NodeBase & {
    type: "RegExpLiteral"
    parent: null
    pattern: Pattern
    flags: Flags
}

/**
 * The pattern.
 */
export type Pattern = NodeBase & {
    type: "Pattern"
    parent: RegExpLiteral | null
    alternatives: Alternative[]
}

/**
 * The alternative.
 * E.g. `a|b`
 */
export type Alternative = NodeBase & {
    type: "Alternative"
    parent: CapturingGroup | Group | LookaroundAssertion | Pattern
    elements: Element[]
}

/**
 * The uncapturing group.
 * E.g. `(?:ab)`
 */
export type Group = NodeBase & {
    type: "Group"
    parent: Alternative | Quantifier
    alternatives: Alternative[]
}

/**
 * The capturing group.
 * E.g. `(ab)`, `(?<name>ab)`
 */
export type CapturingGroup = NodeBase & {
    type: "CapturingGroup"
    parent: Alternative | Quantifier
    name: string | null
    alternatives: Alternative[]
    references: Backreference[]
}

/**
 * The lookaround assertion.
 */
export type LookaroundAssertion = LookaheadAssertion | LookbehindAssertion

/**
 * The lookahead assertion.
 * E.g. `(?=ab)`, `(?!ab)`
 */
export type LookaheadAssertion = NodeBase & {
    type: "Assertion"
    parent: Alternative | Quantifier
    kind: "lookahead"
    negate: boolean
    alternatives: Alternative[]
}

/**
 * The lookbehind assertion.
 * E.g. `(?<=ab)`, `(?<!ab)`
 */
export type LookbehindAssertion = NodeBase & {
    type: "Assertion"
    parent: Alternative
    kind: "lookbehind"
    negate: boolean
    alternatives: Alternative[]
}

/**
 * The quantifier.
 * E.g. `a?`, `a*`, `a+`, `a{1,2}`, `a??`, `a*?`, `a+?`, `a{1,2}?`
 */
export type Quantifier = NodeBase & {
    type: "Quantifier"
    parent: Alternative
    min: number
    max: number // can be Number.POSITIVE_INFINITY
    greedy: boolean
    element: QuantifiableElement
}

/**
 * The character class.
 * E.g. `[ab]`, `[^ab]`
 */
export type CharacterClass =
    | ClassRangesCharacterClass
    | UnicodeSetsCharacterClass
type BaseCharacterClass = NodeBase & {
    type: "CharacterClass"
    parent:
        | Alternative
        | ExpressionCharacterClass
        | Quantifier
        | UnicodeSetsCharacterClass
    unicodeSets: boolean
    negate: boolean
    elements: CharacterClassElement[]
}
/**
 * The character class used in legacy (neither `u` nor `v` flag) and Unicode mode (`u` flag).
 *
 * This character class is guaranteed to **not** contain strings.
 *
 * In Unicode sets mode (`v` flag), {@link UnicodeSetsCharacterClass} is used.
 */
export type ClassRangesCharacterClass = BaseCharacterClass & {
    parent: Alternative | Quantifier
    unicodeSets: false
    elements: ClassRangesCharacterClassElement[]
}
/**
 * The character class used in Unicode sets mode (`v` flag).
 *
 * This character class may contain strings.
 */
export type UnicodeSetsCharacterClass = BaseCharacterClass & {
    parent:
        | Alternative
        | ExpressionCharacterClass
        | Quantifier
        | UnicodeSetsCharacterClass
    unicodeSets: true
    elements: UnicodeSetsCharacterClassElement[]
}

/**
 * The character class.
 * E.g. `[a-b]`
 */
export type CharacterClassRange = NodeBase & {
    type: "CharacterClassRange"
    parent: CharacterClass
    min: Character
    max: Character
}

/**
 * The assertion.
 */
export type Assertion = BoundaryAssertion | LookaroundAssertion

/**
 * The boundary assertion.
 */
export type BoundaryAssertion = EdgeAssertion | WordBoundaryAssertion

/**
 * The edge boundary assertion.
 * E.g. `^`, `$`
 */
export type EdgeAssertion = NodeBase & {
    type: "Assertion"
    parent: Alternative | Quantifier
    kind: "end" | "start"
}

/**
 * The word bondary assertion.
 * E.g. `\b`, `\B`
 */
export type WordBoundaryAssertion = NodeBase & {
    type: "Assertion"
    parent: Alternative | Quantifier
    kind: "word"
    negate: boolean
}

/**
 * The character set.
 */
export type CharacterSet =
    | AnyCharacterSet
    | EscapeCharacterSet
    | UnicodePropertyCharacterSet

/**
 * The dot.
 * E.g. `.`
 */
export type AnyCharacterSet = NodeBase & {
    type: "CharacterSet"
    parent: Alternative | Quantifier
    kind: "any"
}

/**
 * The character class escape.
 * E.g. `\d`, `\s`, `\w`, `\D`, `\S`, `\W`
 */
export type EscapeCharacterSet = NodeBase & {
    type: "CharacterSet"
    parent:
        | Alternative
        | CharacterClass
        | ClassIntersection
        | ClassSubtraction
        | Quantifier
    kind: "digit" | "space" | "word"
    negate: boolean
}

/**
 * The unicode property escape.
 * E.g. `\p{ASCII}`, `\P{ASCII}`, `\p{Script=Hiragana}`
 */
export type UnicodePropertyCharacterSet =
    | CharacterUnicodePropertyCharacterSet
    | StringsUnicodePropertyCharacterSet
type BaseUnicodePropertyCharacterSet = NodeBase & {
    type: "CharacterSet"
    parent:
        | Alternative
        | CharacterClass
        | ClassIntersection
        | ClassSubtraction
        | Quantifier
    kind: "property"
    strings: boolean
    key: string
    value: string | null
    negate: boolean
}
export type CharacterUnicodePropertyCharacterSet =
    BaseUnicodePropertyCharacterSet & {
        strings: false
        value: string | null
        negate: boolean
    }
/** StringsUnicodePropertyCharacterSet is Unicode property escape with property of strings. */
export type StringsUnicodePropertyCharacterSet =
    BaseUnicodePropertyCharacterSet & {
        parent:
            | Alternative
            | ClassIntersection
            | ClassSubtraction
            | Quantifier
            | UnicodeSetsCharacterClass
        strings: true
        value: null
        negate: false
    }

/**
 * The expression character class.
 * E.g. `[a--b]`, `[a&&b]`,`[^a--b]`, `[^a&&b]`
 */
export type ExpressionCharacterClass = NodeBase & {
    type: "ExpressionCharacterClass"
    parent:
        | Alternative
        | ExpressionCharacterClass
        | Quantifier
        | UnicodeSetsCharacterClass
    negate: boolean
    expression: ClassIntersection | ClassSubtraction
}

export type ClassSetOperand =
    | Character
    | ClassStringDisjunction
    | EscapeCharacterSet
    | ExpressionCharacterClass
    | UnicodePropertyCharacterSet
    | UnicodeSetsCharacterClass

/**
 * The character class intersection.
 * E.g. `a&&b`
 */
export type ClassIntersection = NodeBase & {
    type: "ClassIntersection"
    parent: ClassIntersection | ExpressionCharacterClass
    left: ClassIntersection | ClassSetOperand
    right: ClassSetOperand
}

/**
 * The character class subtraction.
 * E.g. `a--b`
 */
export type ClassSubtraction = NodeBase & {
    type: "ClassSubtraction"
    parent: ClassSubtraction | ExpressionCharacterClass
    left: ClassSetOperand | ClassSubtraction
    right: ClassSetOperand
}

/**
 * The character class string disjunction.
 * E.g. `\q{a|b}`
 */
export type ClassStringDisjunction = NodeBase & {
    type: "ClassStringDisjunction"
    parent: ClassIntersection | ClassSubtraction | UnicodeSetsCharacterClass
    alternatives: StringAlternative[]
}

/** StringAlternative is only used for `\q{alt}`({@link ClassStringDisjunction}). */
export type StringAlternative = NodeBase & {
    type: "StringAlternative"
    parent: ClassStringDisjunction
    elements: Character[]
}

/**
 * The character.
 * This includes escape sequences which mean a character.
 * E.g. `a`, `あ`, `✿`, `\x65`, `\u0065`, `\u{65}`, `\/`
 */
export type Character = NodeBase & {
    type: "Character"
    parent:
        | Alternative
        | CharacterClass
        | CharacterClassRange
        | ClassIntersection
        | ClassSubtraction
        | Quantifier
        | StringAlternative
    value: number // a code point.
}

/**
 * The backreference.
 * E.g. `\1`, `\k<name>`
 */
export type Backreference = NodeBase & {
    type: "Backreference"
    parent: Alternative | Quantifier
    ref: number | string
    resolved: CapturingGroup
}

/**
 * The flags.
 */
export type Flags = NodeBase & {
    type: "Flags"
    parent: RegExpLiteral | null
    dotAll: boolean
    global: boolean
    hasIndices: boolean
    ignoreCase: boolean
    multiline: boolean
    sticky: boolean
    unicode: boolean
    unicodeSets: boolean
}
