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
export interface NodeBase {
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
export interface RegExpLiteral extends NodeBase {
    type: "RegExpLiteral"
    parent: null
    pattern: Pattern
    flags: Flags
}

/**
 * The pattern.
 */
export interface Pattern extends NodeBase {
    type: "Pattern"
    parent: RegExpLiteral | null
    alternatives: Alternative[]
}

/**
 * The alternative.
 * E.g. `a|b`
 */
export interface Alternative extends NodeBase {
    type: "Alternative"
    parent: CapturingGroup | Group | LookaroundAssertion | Pattern
    elements: Element[]
}

/**
 * The uncapturing group.
 * E.g. `(?:ab)`
 */
export interface Group extends NodeBase {
    type: "Group"
    parent: Alternative | Quantifier
    alternatives: Alternative[]
}

/**
 * The capturing group.
 * E.g. `(ab)`, `(?<name>ab)`
 */
export interface CapturingGroup extends NodeBase {
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
export interface LookaheadAssertion extends NodeBase {
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
export interface LookbehindAssertion extends NodeBase {
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
export interface Quantifier extends NodeBase {
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
interface BaseCharacterClass extends NodeBase {
    type: "CharacterClass"
    parent:
        | Alternative
        | ClassIntersection
        | ClassSubtraction
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
export interface ClassRangesCharacterClass extends BaseCharacterClass {
    parent: Alternative | Quantifier
    unicodeSets: false
    elements: ClassRangesCharacterClassElement[]
}
/**
 * The character class used in Unicode sets mode (`v` flag).
 *
 * This character class may contain strings.
 */
export interface UnicodeSetsCharacterClass extends BaseCharacterClass {
    parent:
        | Alternative
        | ClassIntersection
        | ClassSubtraction
        | Quantifier
        | UnicodeSetsCharacterClass
    unicodeSets: true
    elements: UnicodeSetsCharacterClassElement[]
}

/**
 * The character class.
 * E.g. `[a-b]`
 */
export interface CharacterClassRange extends NodeBase {
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
export interface EdgeAssertion extends NodeBase {
    type: "Assertion"
    parent: Alternative | Quantifier
    kind: "end" | "start"
}

/**
 * The word bondary assertion.
 * E.g. `\b`, `\B`
 */
export interface WordBoundaryAssertion extends NodeBase {
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
export interface AnyCharacterSet extends NodeBase {
    type: "CharacterSet"
    parent: Alternative | Quantifier
    kind: "any"
}

/**
 * The character class escape.
 * E.g. `\d`, `\s`, `\w`, `\D`, `\S`, `\W`
 */
export interface EscapeCharacterSet extends NodeBase {
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
interface BaseUnicodePropertyCharacterSet extends NodeBase {
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
export interface CharacterUnicodePropertyCharacterSet
    extends BaseUnicodePropertyCharacterSet {
    strings: false
    value: string | null
    negate: boolean
}
/** StringsUnicodePropertyCharacterSet is Unicode property escape with property of strings. */
export interface StringsUnicodePropertyCharacterSet
    extends BaseUnicodePropertyCharacterSet {
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
export interface ExpressionCharacterClass extends NodeBase {
    type: "ExpressionCharacterClass"
    parent:
        | Alternative
        | ClassIntersection
        | ClassSubtraction
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
export interface ClassIntersection extends NodeBase {
    type: "ClassIntersection"
    parent: ClassIntersection | ExpressionCharacterClass
    left: ClassIntersection | ClassSetOperand
    right: ClassSetOperand
}

/**
 * The character class subtraction.
 * E.g. `a--b`
 */
export interface ClassSubtraction extends NodeBase {
    type: "ClassSubtraction"
    parent: ClassSubtraction | ExpressionCharacterClass
    left: ClassSetOperand | ClassSubtraction
    right: ClassSetOperand
}

/**
 * The character class string disjunction.
 * E.g. `\q{a|b}`
 */
export interface ClassStringDisjunction extends NodeBase {
    type: "ClassStringDisjunction"
    parent: ClassIntersection | ClassSubtraction | UnicodeSetsCharacterClass
    alternatives: StringAlternative[]
}

/** StringAlternative is only used for `\q{alt}`({@link ClassStringDisjunction}). */
export interface StringAlternative extends NodeBase {
    type: "StringAlternative"
    parent: ClassStringDisjunction
    elements: Character[]
}

/**
 * The character.
 * This includes escape sequences which mean a character.
 * E.g. `a`, `あ`, `✿`, `\x65`, `\u0065`, `\u{65}`, `\/`
 */
export interface Character extends NodeBase {
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
export interface Backreference extends NodeBase {
    type: "Backreference"
    parent: Alternative | Quantifier
    ref: number | string
    resolved: CapturingGroup
}

/**
 * The flags.
 */
export interface Flags extends NodeBase {
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
