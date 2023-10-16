import type { EcmaVersion } from "./ecma-versions"
import { latestEcmaVersion } from "./ecma-versions"
import { Reader } from "./reader"
import { newRegExpSyntaxError } from "./regexp-syntax-error"
import {
    ASTERISK,
    BACKSPACE,
    CARRIAGE_RETURN,
    CHARACTER_TABULATION,
    CIRCUMFLEX_ACCENT,
    COLON,
    COMMA,
    DIGIT_NINE,
    DIGIT_ONE,
    digitToInt,
    DIGIT_ZERO,
    DOLLAR_SIGN,
    EQUALS_SIGN,
    EXCLAMATION_MARK,
    FORM_FEED,
    FULL_STOP,
    GREATER_THAN_SIGN,
    HYPHEN_MINUS,
    LATIN_CAPITAL_LETTER_B,
    LATIN_CAPITAL_LETTER_D,
    LATIN_CAPITAL_LETTER_P,
    LATIN_CAPITAL_LETTER_S,
    LATIN_CAPITAL_LETTER_W,
    LATIN_SMALL_LETTER_B,
    LATIN_SMALL_LETTER_C,
    LATIN_SMALL_LETTER_D,
    LATIN_SMALL_LETTER_F,
    LATIN_SMALL_LETTER_G,
    LATIN_SMALL_LETTER_I,
    LATIN_SMALL_LETTER_K,
    LATIN_SMALL_LETTER_M,
    LATIN_SMALL_LETTER_N,
    LATIN_SMALL_LETTER_P,
    LATIN_SMALL_LETTER_R,
    LATIN_SMALL_LETTER_S,
    LATIN_SMALL_LETTER_T,
    LATIN_SMALL_LETTER_U,
    LATIN_SMALL_LETTER_V,
    LATIN_SMALL_LETTER_W,
    LATIN_SMALL_LETTER_X,
    LATIN_SMALL_LETTER_Y,
    LEFT_CURLY_BRACKET,
    LEFT_PARENTHESIS,
    LEFT_SQUARE_BRACKET,
    LESS_THAN_SIGN,
    LINE_FEED,
    LINE_TABULATION,
    LOW_LINE,
    PLUS_SIGN,
    QUESTION_MARK,
    REVERSE_SOLIDUS,
    RIGHT_CURLY_BRACKET,
    RIGHT_PARENTHESIS,
    RIGHT_SQUARE_BRACKET,
    SOLIDUS,
    VERTICAL_LINE,
    ZERO_WIDTH_JOINER,
    ZERO_WIDTH_NON_JOINER,
    combineSurrogatePair,
    isDecimalDigit,
    isHexDigit,
    isIdContinue,
    isIdStart,
    isLatinLetter,
    isLeadSurrogate,
    isLineTerminator,
    isOctalDigit,
    isTrailSurrogate,
    isValidLoneUnicodeProperty,
    isValidUnicodeProperty,
    isValidLoneUnicodePropertyOfString,
    isValidUnicode,
    AMPERSAND,
    NUMBER_SIGN,
    PERCENT_SIGN,
    SEMICOLON,
    COMMERCIAL_AT,
    GRAVE_ACCENT,
    TILDE,
    LATIN_SMALL_LETTER_Q,
} from "./unicode"

// ^ $ \ . * + ? ( ) [ ] { } |
const SYNTAX_CHARACTER = new Set([
    CIRCUMFLEX_ACCENT,
    DOLLAR_SIGN,
    REVERSE_SOLIDUS,
    FULL_STOP,
    ASTERISK,
    PLUS_SIGN,
    QUESTION_MARK,
    LEFT_PARENTHESIS,
    RIGHT_PARENTHESIS,
    LEFT_SQUARE_BRACKET,
    RIGHT_SQUARE_BRACKET,
    LEFT_CURLY_BRACKET,
    RIGHT_CURLY_BRACKET,
    VERTICAL_LINE,
])
// && !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ `` ~~
const CLASS_SET_RESERVED_DOUBLE_PUNCTUATOR_CHARACTER = new Set([
    AMPERSAND,
    EXCLAMATION_MARK,
    NUMBER_SIGN,
    DOLLAR_SIGN,
    PERCENT_SIGN,
    ASTERISK,
    PLUS_SIGN,
    COMMA,
    FULL_STOP,
    COLON,
    SEMICOLON,
    LESS_THAN_SIGN,
    EQUALS_SIGN,
    GREATER_THAN_SIGN,
    QUESTION_MARK,
    COMMERCIAL_AT,
    CIRCUMFLEX_ACCENT,
    GRAVE_ACCENT,
    TILDE,
])
// ( ) [ ] { } / - \ |
const CLASS_SET_SYNTAX_CHARACTER = new Set([
    LEFT_PARENTHESIS,
    RIGHT_PARENTHESIS,
    LEFT_SQUARE_BRACKET,
    RIGHT_SQUARE_BRACKET,
    LEFT_CURLY_BRACKET,
    RIGHT_CURLY_BRACKET,
    SOLIDUS,
    HYPHEN_MINUS,
    REVERSE_SOLIDUS,
    VERTICAL_LINE,
])
// & - ! # % , : ; < = > @ ` ~
const CLASS_SET_RESERVED_PUNCTUATOR = new Set([
    AMPERSAND,
    HYPHEN_MINUS,
    EXCLAMATION_MARK,
    NUMBER_SIGN,
    PERCENT_SIGN,
    COMMA,
    COLON,
    SEMICOLON,
    LESS_THAN_SIGN,
    EQUALS_SIGN,
    GREATER_THAN_SIGN,
    COMMERCIAL_AT,
    GRAVE_ACCENT,
    TILDE,
])

function isSyntaxCharacter(cp: number): boolean {
    // ^ $ \ . * + ? ( ) [ ] { } |
    return SYNTAX_CHARACTER.has(cp)
}

function isClassSetReservedDoublePunctuatorCharacter(cp: number): boolean {
    // && !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ `` ~~
    return CLASS_SET_RESERVED_DOUBLE_PUNCTUATOR_CHARACTER.has(cp)
}

function isClassSetSyntaxCharacter(cp: number): boolean {
    // ( ) [ ] { } / - \ |
    return CLASS_SET_SYNTAX_CHARACTER.has(cp)
}

function isClassSetReservedPunctuator(cp: number): boolean {
    // & - ! # % , : ; < = > @ ` ~
    return CLASS_SET_RESERVED_PUNCTUATOR.has(cp)
}

/**
 * ```
 * IdentifierStartChar ::
 *     UnicodeIDStart
 *     $
 *     _
 * ```
 */
function isIdentifierStartChar(cp: number): boolean {
    return isIdStart(cp) || cp === DOLLAR_SIGN || cp === LOW_LINE
}

/**
 * ```
 * IdentifierPartChar ::
 *     UnicodeIDContinue
 *     $
 *     <ZWNJ>
 *     <ZWJ>
 * ```
 */
function isIdentifierPartChar(cp: number): boolean {
    return (
        isIdContinue(cp) ||
        cp === DOLLAR_SIGN ||
        cp === ZERO_WIDTH_NON_JOINER ||
        cp === ZERO_WIDTH_JOINER
    )
}

function isUnicodePropertyNameCharacter(cp: number): boolean {
    return isLatinLetter(cp) || cp === LOW_LINE
}

function isUnicodePropertyValueCharacter(cp: number): boolean {
    return isUnicodePropertyNameCharacter(cp) || isDecimalDigit(cp)
}

export type RegExpValidatorSourceContext = {
    readonly source: string
    readonly start: number
    readonly end: number
    readonly kind: "flags" | "literal" | "pattern"
}

export namespace RegExpValidator {
    /**
     * The options for RegExpValidator construction.
     */
    export interface Options {
        /**
         * The flag to disable Annex B syntax. Default is `false`.
         */
        strict?: boolean

        /**
         * ECMAScript version. Default is `2024`.
         * - `2015` added `u` and `y` flags.
         * - `2018` added `s` flag, Named Capturing Group, Lookbehind Assertion,
         *   and Unicode Property Escape.
         * - `2019`, `2020`, and `2021` added more valid Unicode Property Escapes.
         * - `2022` added `d` flag.
         * - `2023` added more valid Unicode Property Escapes.
         * - `2024` added `v` flag.
         */
        ecmaVersion?: EcmaVersion

        /**
         * A function that is called when the validator entered a RegExp literal.
         * @param start The 0-based index of the first character.
         */
        onLiteralEnter?: (start: number) => void

        /**
         * A function that is called when the validator left a RegExp literal.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         */
        onLiteralLeave?: (start: number, end: number) => void

        /**
         * A function that is called when the validator found flags.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param flags.global `g` flag.
         * @param flags.ignoreCase `i` flag.
         * @param flags.multiline `m` flag.
         * @param flags.unicode `u` flag.
         * @param flags.sticky `y` flag.
         * @param flags.dotAll `s` flag.
         * @param flags.hasIndices `d` flag.
         * @param flags.unicodeSets `v` flag.
         */
        onRegExpFlags?: (
            start: number,
            end: number,
            flags: {
                global: boolean
                ignoreCase: boolean
                multiline: boolean
                unicode: boolean
                sticky: boolean
                dotAll: boolean
                hasIndices: boolean
                unicodeSets: boolean
            },
        ) => void
        /**
         * A function that is called when the validator found flags.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param global `g` flag.
         * @param ignoreCase `i` flag.
         * @param multiline `m` flag.
         * @param unicode `u` flag.
         * @param sticky `y` flag.
         * @param dotAll `s` flag.
         * @param hasIndices `d` flag.
         *
         * @deprecated Use `onRegExpFlags` instead.
         */
        onFlags?: (
            start: number,
            end: number,
            global: boolean,
            ignoreCase: boolean,
            multiline: boolean,
            unicode: boolean,
            sticky: boolean,
            dotAll: boolean,
            hasIndices: boolean,
        ) => void

        /**
         * A function that is called when the validator entered a pattern.
         * @param start The 0-based index of the first character.
         */
        onPatternEnter?: (start: number) => void

        /**
         * A function that is called when the validator left a pattern.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         */
        onPatternLeave?: (start: number, end: number) => void

        /**
         * A function that is called when the validator entered a disjunction.
         * @param start The 0-based index of the first character.
         */
        onDisjunctionEnter?: (start: number) => void

        /**
         * A function that is called when the validator left a disjunction.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         */
        onDisjunctionLeave?: (start: number, end: number) => void

        /**
         * A function that is called when the validator entered an alternative.
         * @param start The 0-based index of the first character.
         * @param index The 0-based index of alternatives in a disjunction.
         */
        onAlternativeEnter?: (start: number, index: number) => void

        /**
         * A function that is called when the validator left an alternative.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param index The 0-based index of alternatives in a disjunction.
         */
        onAlternativeLeave?: (start: number, end: number, index: number) => void

        /**
         * A function that is called when the validator entered an uncapturing group.
         * @param start The 0-based index of the first character.
         */
        onGroupEnter?: (start: number) => void

        /**
         * A function that is called when the validator left an uncapturing group.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         */
        onGroupLeave?: (start: number, end: number) => void

        /**
         * A function that is called when the validator entered a capturing group.
         * @param start The 0-based index of the first character.
         * @param name The group name.
         */
        onCapturingGroupEnter?: (start: number, name: string | null) => void

        /**
         * A function that is called when the validator left a capturing group.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param name The group name.
         */
        onCapturingGroupLeave?: (
            start: number,
            end: number,
            name: string | null,
        ) => void

        /**
         * A function that is called when the validator found a quantifier.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param min The minimum number of repeating.
         * @param max The maximum number of repeating.
         * @param greedy The flag to choose the longest matching.
         */
        onQuantifier?: (
            start: number,
            end: number,
            min: number,
            max: number,
            greedy: boolean,
        ) => void

        /**
         * A function that is called when the validator entered a lookahead/lookbehind assertion.
         * @param start The 0-based index of the first character.
         * @param kind The kind of the assertion.
         * @param negate The flag which represents that the assertion is negative.
         */
        onLookaroundAssertionEnter?: (
            start: number,
            kind: "lookahead" | "lookbehind",
            negate: boolean,
        ) => void

        /**
         * A function that is called when the validator left a lookahead/lookbehind assertion.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param kind The kind of the assertion.
         * @param negate The flag which represents that the assertion is negative.
         */
        onLookaroundAssertionLeave?: (
            start: number,
            end: number,
            kind: "lookahead" | "lookbehind",
            negate: boolean,
        ) => void

        /**
         * A function that is called when the validator found an edge boundary assertion.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param kind The kind of the assertion.
         */
        onEdgeAssertion?: (
            start: number,
            end: number,
            kind: "end" | "start",
        ) => void

        /**
         * A function that is called when the validator found a word boundary assertion.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param kind The kind of the assertion.
         * @param negate The flag which represents that the assertion is negative.
         */
        onWordBoundaryAssertion?: (
            start: number,
            end: number,
            kind: "word",
            negate: boolean,
        ) => void

        /**
         * A function that is called when the validator found a dot.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param kind The kind of the character set.
         */
        onAnyCharacterSet?: (start: number, end: number, kind: "any") => void

        /**
         * A function that is called when the validator found a character set escape.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param kind The kind of the character set.
         * @param negate The flag which represents that the character set is negative.
         */
        onEscapeCharacterSet?: (
            start: number,
            end: number,
            kind: "digit" | "space" | "word",
            negate: boolean,
        ) => void

        /**
         * A function that is called when the validator found a Unicode proerty escape.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param kind The kind of the character set.
         * @param key The property name.
         * @param value The property value.
         * @param negate The flag which represents that the character set is negative.
         * @param strings If true, the given property is property of strings.
         */
        onUnicodePropertyCharacterSet?: (
            start: number,
            end: number,
            kind: "property",
            key: string,
            value: string | null,
            negate: boolean,
            strings: boolean,
        ) => void

        /**
         * A function that is called when the validator found a character.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param value The code point of the character.
         */
        onCharacter?: (start: number, end: number, value: number) => void

        /**
         * A function that is called when the validator found a backreference.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param ref The key of the referred capturing group.
         */
        onBackreference?: (
            start: number,
            end: number,
            ref: number | string,
        ) => void

        /**
         * A function that is called when the validator entered a character class.
         * @param start The 0-based index of the first character.
         * @param negate The flag which represents that the character class is negative.
         * @param unicodeSets `true` if unicodeSets mode.
         */
        onCharacterClassEnter?: (
            start: number,
            negate: boolean,
            unicodeSets: boolean,
        ) => void

        /**
         * A function that is called when the validator left a character class.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param negate The flag which represents that the character class is negative.
         */
        onCharacterClassLeave?: (
            start: number,
            end: number,
            negate: boolean,
        ) => void

        /**
         * A function that is called when the validator found a character class range.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param min The minimum code point of the range.
         * @param max The maximum code point of the range.
         */
        onCharacterClassRange?: (
            start: number,
            end: number,
            min: number,
            max: number,
        ) => void

        /**
         * A function that is called when the validator found a class intersection.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         */
        onClassIntersection?: (start: number, end: number) => void

        /**
         * A function that is called when the validator found a class subtraction.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         */
        onClassSubtraction?: (start: number, end: number) => void

        /**
         * A function that is called when the validator entered a class string disjunction.
         * @param start The 0-based index of the first character.
         */
        onClassStringDisjunctionEnter?: (start: number) => void

        /**
         * A function that is called when the validator left a class string disjunction.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         */
        onClassStringDisjunctionLeave?: (start: number, end: number) => void

        /**
         * A function that is called when the validator entered a string alternative.
         * @param start The 0-based index of the first character.
         * @param index The 0-based index of alternatives in a disjunction.
         */
        onStringAlternativeEnter?: (start: number, index: number) => void

        /**
         * A function that is called when the validator left a string alternative.
         * @param start The 0-based index of the first character.
         * @param end The next 0-based index of the last character.
         * @param index The 0-based index of alternatives in a disjunction.
         */
        onStringAlternativeLeave?: (
            start: number,
            end: number,
            index: number,
        ) => void
    }
}

type UnicodeSetsConsumeResult = { mayContainStrings?: boolean }
type UnicodePropertyValueExpressionConsumeResult = {
    key: string
    value: string | null
    strings?: boolean
}

/**
 * The regular expression validator.
 */
export class RegExpValidator {
    private readonly _options: RegExpValidator.Options

    private readonly _reader = new Reader()

    private _unicodeMode = false

    private _unicodeSetsMode = false

    private _nFlag = false

    private _lastIntValue = 0

    private _lastRange = {
        min: 0,
        max: Number.POSITIVE_INFINITY,
    }

    private _lastStrValue = ""

    private _lastAssertionIsQuantifiable = false

    private _numCapturingParens = 0

    private _groupNames = new Set<string>()

    private _backreferenceNames = new Set<string>()

    private _srcCtx: RegExpValidatorSourceContext | null = null

    /**
     * Initialize this validator.
     * @param options The options of validator.
     */
    public constructor(options?: RegExpValidator.Options) {
        this._options = options ?? {}
    }

    /**
     * Validate a regular expression literal. E.g. "/abc/g"
     * @param source The source code to validate.
     * @param start The start index in the source code.
     * @param end The end index in the source code.
     */
    public validateLiteral(
        source: string,
        start = 0,
        end: number = source.length,
    ): void {
        this._srcCtx = { source, start, end, kind: "literal" }
        this._unicodeSetsMode = this._unicodeMode = this._nFlag = false
        this.reset(source, start, end)

        this.onLiteralEnter(start)
        if (this.eat(SOLIDUS) && this.eatRegExpBody() && this.eat(SOLIDUS)) {
            const flagStart = this.index
            const unicode = source.includes("u", flagStart)
            const unicodeSets = source.includes("v", flagStart)
            this.validateFlagsInternal(source, flagStart, end)
            this.validatePatternInternal(source, start + 1, flagStart - 1, {
                unicode,
                unicodeSets,
            })
        } else if (start >= end) {
            this.raise("Empty")
        } else {
            const c = String.fromCodePoint(this.currentCodePoint)
            this.raise(`Unexpected character '${c}'`)
        }
        this.onLiteralLeave(start, end)
    }

    /**
     * Validate a regular expression flags. E.g. "gim"
     * @param source The source code to validate.
     * @param start The start index in the source code.
     * @param end The end index in the source code.
     */
    public validateFlags(
        source: string,
        start = 0,
        end: number = source.length,
    ): void {
        this._srcCtx = { source, start, end, kind: "flags" }
        this.validateFlagsInternal(source, start, end)
    }

    /**
     * Validate a regular expression pattern. E.g. "abc"
     * @param source The source code to validate.
     * @param start The start index in the source code.
     * @param end The end index in the source code.
     * @param flags The flags.
     */
    public validatePattern(
        source: string,
        start?: number,
        end?: number,
        flags?: {
            unicode?: boolean
            unicodeSets?: boolean
        },
    ): void
    /**
     * @deprecated Backward compatibility
     * Use object `flags` instead of boolean `uFlag`.
     * @param source The source code to validate.
     * @param start The start index in the source code.
     * @param end The end index in the source code.
     * @param uFlag The flag to set unicode mode.
     */
    public validatePattern(
        source: string,
        start?: number,
        end?: number,
        uFlag?: boolean, // The unicode flag (backward compatibility).
    ): void
    public validatePattern(
        source: string,
        start = 0,
        end: number = source.length,
        uFlagOrFlags:
            | boolean // The unicode flag (backward compatibility).
            | {
                  unicode?: boolean
                  unicodeSets?: boolean
              }
            | undefined = undefined,
    ): void {
        this._srcCtx = { source, start, end, kind: "pattern" }
        this.validatePatternInternal(source, start, end, uFlagOrFlags)
    }

    private validatePatternInternal(
        source: string,
        start = 0,
        end: number = source.length,
        uFlagOrFlags:
            | boolean // The unicode flag (backward compatibility).
            | {
                  unicode?: boolean
                  unicodeSets?: boolean
              }
            | undefined = undefined,
    ): void {
        const mode = this._parseFlagsOptionToMode(uFlagOrFlags, end)

        this._unicodeMode = mode.unicodeMode
        this._nFlag = mode.nFlag
        this._unicodeSetsMode = mode.unicodeSetsMode
        this.reset(source, start, end)
        this.consumePattern()

        if (
            !this._nFlag &&
            this.ecmaVersion >= 2018 &&
            this._groupNames.size > 0
        ) {
            this._nFlag = true
            this.rewind(start)
            this.consumePattern()
        }
    }

    private validateFlagsInternal(
        source: string,
        start: number,
        end: number,
    ): void {
        const existingFlags = new Set<number>()
        let global = false
        let ignoreCase = false
        let multiline = false
        let sticky = false
        let unicode = false
        let dotAll = false
        let hasIndices = false
        let unicodeSets = false
        for (let i = start; i < end; ++i) {
            const flag = source.charCodeAt(i)

            if (existingFlags.has(flag)) {
                this.raise(`Duplicated flag '${source[i]}'`, { index: start })
            }
            existingFlags.add(flag)

            if (flag === LATIN_SMALL_LETTER_G) {
                global = true
            } else if (flag === LATIN_SMALL_LETTER_I) {
                ignoreCase = true
            } else if (flag === LATIN_SMALL_LETTER_M) {
                multiline = true
            } else if (
                flag === LATIN_SMALL_LETTER_U &&
                this.ecmaVersion >= 2015
            ) {
                unicode = true
            } else if (
                flag === LATIN_SMALL_LETTER_Y &&
                this.ecmaVersion >= 2015
            ) {
                sticky = true
            } else if (
                flag === LATIN_SMALL_LETTER_S &&
                this.ecmaVersion >= 2018
            ) {
                dotAll = true
            } else if (
                flag === LATIN_SMALL_LETTER_D &&
                this.ecmaVersion >= 2022
            ) {
                hasIndices = true
            } else if (
                flag === LATIN_SMALL_LETTER_V &&
                this.ecmaVersion >= 2024
            ) {
                unicodeSets = true
            } else {
                this.raise(`Invalid flag '${source[i]}'`, { index: start })
            }
        }
        this.onRegExpFlags(start, end, {
            global,
            ignoreCase,
            multiline,
            unicode,
            sticky,
            dotAll,
            hasIndices,
            unicodeSets,
        })
    }

    private _parseFlagsOptionToMode(
        uFlagOrFlags:
            | boolean // The unicode flag (backward compatibility).
            | {
                  unicode?: boolean
                  unicodeSets?: boolean
              }
            | undefined,
        sourceEnd: number,
    ): {
        unicodeMode: boolean
        nFlag: boolean
        unicodeSetsMode: boolean
    } {
        let unicode = false
        let unicodeSets = false
        if (uFlagOrFlags && this.ecmaVersion >= 2015) {
            if (typeof uFlagOrFlags === "object") {
                unicode = Boolean(uFlagOrFlags.unicode)
                if (this.ecmaVersion >= 2024) {
                    unicodeSets = Boolean(uFlagOrFlags.unicodeSets)
                }
            } else {
                // uFlagOrFlags is unicode flag (backward compatibility).
                unicode = uFlagOrFlags
            }
        }

        if (unicode && unicodeSets) {
            // 1. If v is true and u is true, then
            //   a. Let parseResult be a List containing one SyntaxError object.
            this.raise("Invalid regular expression flags", {
                index: sourceEnd + 1 /* `/` */,
                unicode,
                unicodeSets,
            })
        }

        const unicodeMode = unicode || unicodeSets
        const nFlag =
            (unicode && this.ecmaVersion >= 2018) ||
            unicodeSets ||
            // Introduced as Normative Change in ES2023
            // See https://github.com/tc39/ecma262/pull/2436
            Boolean(this._options.strict && this.ecmaVersion >= 2023)
        const unicodeSetsMode = unicodeSets

        return { unicodeMode, nFlag, unicodeSetsMode }
    }
    // #region Delegate for Options

    private get strict() {
        return Boolean(this._options.strict) || this._unicodeMode
    }

    private get ecmaVersion() {
        return this._options.ecmaVersion ?? latestEcmaVersion
    }

    private onLiteralEnter(start: number): void {
        if (this._options.onLiteralEnter) {
            this._options.onLiteralEnter(start)
        }
    }

    private onLiteralLeave(start: number, end: number): void {
        if (this._options.onLiteralLeave) {
            this._options.onLiteralLeave(start, end)
        }
    }

    private onRegExpFlags(
        start: number,
        end: number,
        flags: {
            global: boolean
            ignoreCase: boolean
            multiline: boolean
            unicode: boolean
            sticky: boolean
            dotAll: boolean
            hasIndices: boolean
            unicodeSets: boolean
        },
    ): void {
        if (this._options.onRegExpFlags) {
            this._options.onRegExpFlags(start, end, flags)
        }
        // Backward compatibility
        if (this._options.onFlags) {
            this._options.onFlags(
                start,
                end,
                flags.global,
                flags.ignoreCase,
                flags.multiline,
                flags.unicode,
                flags.sticky,
                flags.dotAll,
                flags.hasIndices,
            )
        }
    }

    private onPatternEnter(start: number): void {
        if (this._options.onPatternEnter) {
            this._options.onPatternEnter(start)
        }
    }

    private onPatternLeave(start: number, end: number): void {
        if (this._options.onPatternLeave) {
            this._options.onPatternLeave(start, end)
        }
    }

    private onDisjunctionEnter(start: number): void {
        if (this._options.onDisjunctionEnter) {
            this._options.onDisjunctionEnter(start)
        }
    }

    private onDisjunctionLeave(start: number, end: number): void {
        if (this._options.onDisjunctionLeave) {
            this._options.onDisjunctionLeave(start, end)
        }
    }

    private onAlternativeEnter(start: number, index: number): void {
        if (this._options.onAlternativeEnter) {
            this._options.onAlternativeEnter(start, index)
        }
    }

    private onAlternativeLeave(
        start: number,
        end: number,
        index: number,
    ): void {
        if (this._options.onAlternativeLeave) {
            this._options.onAlternativeLeave(start, end, index)
        }
    }

    private onGroupEnter(start: number): void {
        if (this._options.onGroupEnter) {
            this._options.onGroupEnter(start)
        }
    }

    private onGroupLeave(start: number, end: number): void {
        if (this._options.onGroupLeave) {
            this._options.onGroupLeave(start, end)
        }
    }

    private onCapturingGroupEnter(start: number, name: string | null): void {
        if (this._options.onCapturingGroupEnter) {
            this._options.onCapturingGroupEnter(start, name)
        }
    }

    private onCapturingGroupLeave(
        start: number,
        end: number,
        name: string | null,
    ): void {
        if (this._options.onCapturingGroupLeave) {
            this._options.onCapturingGroupLeave(start, end, name)
        }
    }

    private onQuantifier(
        start: number,
        end: number,
        min: number,
        max: number,
        greedy: boolean,
    ): void {
        if (this._options.onQuantifier) {
            this._options.onQuantifier(start, end, min, max, greedy)
        }
    }

    private onLookaroundAssertionEnter(
        start: number,
        kind: "lookahead" | "lookbehind",
        negate: boolean,
    ): void {
        if (this._options.onLookaroundAssertionEnter) {
            this._options.onLookaroundAssertionEnter(start, kind, negate)
        }
    }

    private onLookaroundAssertionLeave(
        start: number,
        end: number,
        kind: "lookahead" | "lookbehind",
        negate: boolean,
    ): void {
        if (this._options.onLookaroundAssertionLeave) {
            this._options.onLookaroundAssertionLeave(start, end, kind, negate)
        }
    }

    private onEdgeAssertion(
        start: number,
        end: number,
        kind: "end" | "start",
    ): void {
        if (this._options.onEdgeAssertion) {
            this._options.onEdgeAssertion(start, end, kind)
        }
    }

    private onWordBoundaryAssertion(
        start: number,
        end: number,
        kind: "word",
        negate: boolean,
    ): void {
        if (this._options.onWordBoundaryAssertion) {
            this._options.onWordBoundaryAssertion(start, end, kind, negate)
        }
    }

    private onAnyCharacterSet(start: number, end: number, kind: "any"): void {
        if (this._options.onAnyCharacterSet) {
            this._options.onAnyCharacterSet(start, end, kind)
        }
    }

    private onEscapeCharacterSet(
        start: number,
        end: number,
        kind: "digit" | "space" | "word",
        negate: boolean,
    ): void {
        if (this._options.onEscapeCharacterSet) {
            this._options.onEscapeCharacterSet(start, end, kind, negate)
        }
    }

    private onUnicodePropertyCharacterSet(
        start: number,
        end: number,
        kind: "property",
        key: string,
        value: string | null,
        negate: boolean,
        strings: boolean,
    ): void {
        if (this._options.onUnicodePropertyCharacterSet) {
            this._options.onUnicodePropertyCharacterSet(
                start,
                end,
                kind,
                key,
                value,
                negate,
                strings,
            )
        }
    }

    private onCharacter(start: number, end: number, value: number): void {
        if (this._options.onCharacter) {
            this._options.onCharacter(start, end, value)
        }
    }

    private onBackreference(
        start: number,
        end: number,
        ref: number | string,
    ): void {
        if (this._options.onBackreference) {
            this._options.onBackreference(start, end, ref)
        }
    }

    private onCharacterClassEnter(
        start: number,
        negate: boolean,
        unicodeSets: boolean,
    ): void {
        if (this._options.onCharacterClassEnter) {
            this._options.onCharacterClassEnter(start, negate, unicodeSets)
        }
    }

    private onCharacterClassLeave(
        start: number,
        end: number,
        negate: boolean,
    ): void {
        if (this._options.onCharacterClassLeave) {
            this._options.onCharacterClassLeave(start, end, negate)
        }
    }

    private onCharacterClassRange(
        start: number,
        end: number,
        min: number,
        max: number,
    ): void {
        if (this._options.onCharacterClassRange) {
            this._options.onCharacterClassRange(start, end, min, max)
        }
    }

    private onClassIntersection(start: number, end: number): void {
        if (this._options.onClassIntersection) {
            this._options.onClassIntersection(start, end)
        }
    }

    private onClassSubtraction(start: number, end: number): void {
        if (this._options.onClassSubtraction) {
            this._options.onClassSubtraction(start, end)
        }
    }

    private onClassStringDisjunctionEnter(start: number): void {
        if (this._options.onClassStringDisjunctionEnter) {
            this._options.onClassStringDisjunctionEnter(start)
        }
    }

    private onClassStringDisjunctionLeave(start: number, end: number): void {
        if (this._options.onClassStringDisjunctionLeave) {
            this._options.onClassStringDisjunctionLeave(start, end)
        }
    }

    private onStringAlternativeEnter(start: number, index: number): void {
        if (this._options.onStringAlternativeEnter) {
            this._options.onStringAlternativeEnter(start, index)
        }
    }

    private onStringAlternativeLeave(
        start: number,
        end: number,
        index: number,
    ): void {
        if (this._options.onStringAlternativeLeave) {
            this._options.onStringAlternativeLeave(start, end, index)
        }
    }

    // #endregion

    // #region Delegate for Reader

    private get index(): number {
        return this._reader.index
    }

    private get currentCodePoint(): number {
        return this._reader.currentCodePoint
    }

    private get nextCodePoint(): number {
        return this._reader.nextCodePoint
    }

    private get nextCodePoint2(): number {
        return this._reader.nextCodePoint2
    }

    private get nextCodePoint3(): number {
        return this._reader.nextCodePoint3
    }

    private reset(source: string, start: number, end: number): void {
        this._reader.reset(source, start, end, this._unicodeMode)
    }

    private rewind(index: number): void {
        this._reader.rewind(index)
    }

    private advance(): void {
        this._reader.advance()
    }

    private eat(cp: number): boolean {
        return this._reader.eat(cp)
    }

    private eat2(cp1: number, cp2: number): boolean {
        return this._reader.eat2(cp1, cp2)
    }

    private eat3(cp1: number, cp2: number, cp3: number): boolean {
        return this._reader.eat3(cp1, cp2, cp3)
    }

    // #endregion

    private raise(
        message: string,
        context?: { index?: number; unicode?: boolean; unicodeSets?: boolean },
    ): never {
        throw newRegExpSyntaxError(
            this._srcCtx!,
            {
                unicode:
                    context?.unicode ??
                    (this._unicodeMode && !this._unicodeSetsMode),
                unicodeSets: context?.unicodeSets ?? this._unicodeSetsMode,
            },
            context?.index ?? this.index,
            message,
        )
    }

    // https://tc39.es/ecma262/2022/multipage/ecmascript-language-lexical-grammar.html#prod-RegularExpressionBody
    private eatRegExpBody(): boolean {
        const start = this.index
        let inClass = false
        let escaped = false

        for (;;) {
            const cp = this.currentCodePoint
            if (cp === -1 || isLineTerminator(cp)) {
                const kind = inClass ? "character class" : "regular expression"
                this.raise(`Unterminated ${kind}`)
            }
            if (escaped) {
                escaped = false
            } else if (cp === REVERSE_SOLIDUS) {
                escaped = true
            } else if (cp === LEFT_SQUARE_BRACKET) {
                inClass = true
            } else if (cp === RIGHT_SQUARE_BRACKET) {
                inClass = false
            } else if (
                (cp === SOLIDUS && !inClass) ||
                (cp === ASTERISK && this.index === start)
            ) {
                break
            }
            this.advance()
        }

        return this.index !== start
    }

    /**
     * Validate the next characters as a RegExp `Pattern` production.
     * ```
     * Pattern[UnicodeMode, UnicodeSetsMode, N]::
     *      Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N]
     * ```
     */
    private consumePattern(): void {
        const start = this.index
        this._numCapturingParens = this.countCapturingParens()
        this._groupNames.clear()
        this._backreferenceNames.clear()

        this.onPatternEnter(start)
        this.consumeDisjunction()

        const cp = this.currentCodePoint
        if (this.currentCodePoint !== -1) {
            if (cp === RIGHT_PARENTHESIS) {
                this.raise("Unmatched ')'")
            }
            if (cp === REVERSE_SOLIDUS) {
                this.raise("\\ at end of pattern")
            }
            if (cp === RIGHT_SQUARE_BRACKET || cp === RIGHT_CURLY_BRACKET) {
                this.raise("Lone quantifier brackets")
            }
            const c = String.fromCodePoint(cp)
            this.raise(`Unexpected character '${c}'`)
        }
        for (const name of this._backreferenceNames) {
            if (!this._groupNames.has(name)) {
                this.raise("Invalid named capture referenced")
            }
        }
        this.onPatternLeave(start, this.index)
    }

    /**
     * Count capturing groups in the current source code.
     * @returns The number of capturing groups.
     */
    private countCapturingParens(): number {
        const start = this.index
        let inClass = false
        let escaped = false
        let count = 0
        let cp = 0

        while ((cp = this.currentCodePoint) !== -1) {
            if (escaped) {
                escaped = false
            } else if (cp === REVERSE_SOLIDUS) {
                escaped = true
            } else if (cp === LEFT_SQUARE_BRACKET) {
                inClass = true
            } else if (cp === RIGHT_SQUARE_BRACKET) {
                inClass = false
            } else if (
                cp === LEFT_PARENTHESIS &&
                !inClass &&
                (this.nextCodePoint !== QUESTION_MARK ||
                    (this.nextCodePoint2 === LESS_THAN_SIGN &&
                        this.nextCodePoint3 !== EQUALS_SIGN &&
                        this.nextCodePoint3 !== EXCLAMATION_MARK))
            ) {
                count += 1
            }
            this.advance()
        }

        this.rewind(start)
        return count
    }

    /**
     * Validate the next characters as a RegExp `Disjunction` production.
     * ```
     * Disjunction[UnicodeMode, UnicodeSetsMode, N]::
     *      Alternative[?UnicodeMode, ?UnicodeSetsMode, ?N]
     *      Alternative[?UnicodeMode, ?UnicodeSetsMode, ?N] `|` Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N]
     * ```
     */
    private consumeDisjunction(): void {
        const start = this.index
        let i = 0

        this.onDisjunctionEnter(start)
        do {
            this.consumeAlternative(i++)
        } while (this.eat(VERTICAL_LINE))

        if (this.consumeQuantifier(true)) {
            this.raise("Nothing to repeat")
        }
        if (this.eat(LEFT_CURLY_BRACKET)) {
            this.raise("Lone quantifier brackets")
        }
        this.onDisjunctionLeave(start, this.index)
    }

    /**
     * Validate the next characters as a RegExp `Alternative` production.
     * ```
     * Alternative[UnicodeMode, UnicodeSetsMode, N]::
     *      [empty]
     *      Alternative[?UnicodeMode, ?UnicodeSetsMode, ?N] Term[?UnicodeMode, ?UnicodeSetsMode, ?N]
     * ```
     */
    private consumeAlternative(i: number): void {
        const start = this.index

        this.onAlternativeEnter(start, i)
        while (this.currentCodePoint !== -1 && this.consumeTerm()) {
            // do nothing.
        }
        this.onAlternativeLeave(start, this.index, i)
    }

    /**
     * Validate the next characters as a RegExp `Term` production if possible.
     * ```
     * Term[UnicodeMode, UnicodeSetsMode, N]::
     *      [strict] Assertion[?UnicodeMode, ?UnicodeSetsMode, ?N]
     *      [strict] Atom[?UnicodeMode, ?UnicodeSetsMode, ?N]
     *      [strict] Atom[?UnicodeMode, UnicodeSetsMode, ?N] Quantifier
     *      [annexB][+UnicodeMode] Assertion[+UnicodeMode, ?N]
     *      [annexB][+UnicodeMode] Atom[+UnicodeMode, ?N] Quantifier
     *      [annexB][+UnicodeMode] Atom[+UnicodeMode, ?N]
     *      [annexB][~UnicodeMode] QuantifiableAssertion[?N] Quantifier
     *      [annexB][~UnicodeMode] Assertion[~UnicodeMode, ?N]
     *      [annexB][~UnicodeMode] ExtendedAtom[?N] Quantifier
     *      [annexB][~UnicodeMode] ExtendedAtom[?N]
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeTerm(): boolean {
        if (this._unicodeMode || this.strict) {
            return (
                this.consumeAssertion() ||
                (this.consumeAtom() && this.consumeOptionalQuantifier())
            )
        }
        return (
            (this.consumeAssertion() &&
                (!this._lastAssertionIsQuantifiable ||
                    this.consumeOptionalQuantifier())) ||
            (this.consumeExtendedAtom() && this.consumeOptionalQuantifier())
        )
    }

    private consumeOptionalQuantifier(): boolean {
        this.consumeQuantifier()
        return true
    }

    /**
     * Validate the next characters as a RegExp `Term` production if possible.
     * Set `this._lastAssertionIsQuantifiable` if the consumed assertion was a
     * `QuantifiableAssertion` production.
     * ```
     * Assertion[UnicodeMode, UnicodeSetsMode, N]::
     *      `^`
     *      `$`
     *      `\b`
     *      `\B`
     *      [strict] `(?=` Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] `)`
     *      [strict] `(?!` Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] `)`
     *      [annexB][+UnicodeMode] `(?=` Disjunction[+UnicodeMode, ?N] `)`
     *      [annexB][+UnicodeMode] `(?!` Disjunction[+UnicodeMode, ?N] `)`
     *      [annexB][~UnicodeMode] QuantifiableAssertion[?N]
     *      `(?<=` Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] `)`
     *      `(?<!` Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] `)`
     * QuantifiableAssertion[N]::
     *      `(?=` Disjunction[~UnicodeMode, ?N] `)`
     *      `(?!` Disjunction[~UnicodeMode, ?N] `)`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeAssertion(): boolean {
        const start = this.index
        this._lastAssertionIsQuantifiable = false

        // ^, $, \B \b
        if (this.eat(CIRCUMFLEX_ACCENT)) {
            this.onEdgeAssertion(start, this.index, "start")
            return true
        }
        if (this.eat(DOLLAR_SIGN)) {
            this.onEdgeAssertion(start, this.index, "end")
            return true
        }
        if (this.eat2(REVERSE_SOLIDUS, LATIN_CAPITAL_LETTER_B)) {
            this.onWordBoundaryAssertion(start, this.index, "word", true)
            return true
        }
        if (this.eat2(REVERSE_SOLIDUS, LATIN_SMALL_LETTER_B)) {
            this.onWordBoundaryAssertion(start, this.index, "word", false)
            return true
        }

        // Lookahead / Lookbehind
        if (this.eat2(LEFT_PARENTHESIS, QUESTION_MARK)) {
            const lookbehind =
                this.ecmaVersion >= 2018 && this.eat(LESS_THAN_SIGN)
            let negate = false
            if (
                this.eat(EQUALS_SIGN) ||
                (negate = this.eat(EXCLAMATION_MARK))
            ) {
                const kind = lookbehind ? "lookbehind" : "lookahead"
                this.onLookaroundAssertionEnter(start, kind, negate)
                this.consumeDisjunction()
                if (!this.eat(RIGHT_PARENTHESIS)) {
                    this.raise("Unterminated group")
                }
                this._lastAssertionIsQuantifiable = !lookbehind && !this.strict
                this.onLookaroundAssertionLeave(start, this.index, kind, negate)
                return true
            }
            this.rewind(start)
        }

        return false
    }

    /**
     * Validate the next characters as a RegExp `Quantifier` production if
     * possible.
     * ```
     * Quantifier::
     *      QuantifierPrefix
     *      QuantifierPrefix `?`
     * QuantifierPrefix::
     *      `*`
     *      `+`
     *      `?`
     *      `{` DecimalDigits `}`
     *      `{` DecimalDigits `,}`
     *      `{` DecimalDigits `,` DecimalDigits `}`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeQuantifier(noConsume = false): boolean {
        const start = this.index
        let min = 0
        let max = 0
        let greedy = false

        // QuantifierPrefix
        if (this.eat(ASTERISK)) {
            min = 0
            max = Number.POSITIVE_INFINITY
        } else if (this.eat(PLUS_SIGN)) {
            min = 1
            max = Number.POSITIVE_INFINITY
        } else if (this.eat(QUESTION_MARK)) {
            min = 0
            max = 1
        } else if (this.eatBracedQuantifier(noConsume)) {
            ;({ min, max } = this._lastRange)
        } else {
            return false
        }

        // `?`
        greedy = !this.eat(QUESTION_MARK)

        if (!noConsume) {
            this.onQuantifier(start, this.index, min, max, greedy)
        }
        return true
    }

    /**
     * Eat the next characters as the following alternatives if possible.
     * Set `this._lastRange` if it consumed the next
     * characters successfully.
     * ```
     *      `{` DecimalDigits `}`
     *      `{` DecimalDigits `,}`
     *      `{` DecimalDigits `,` DecimalDigits `}`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private eatBracedQuantifier(noError: boolean): boolean {
        const start = this.index
        if (this.eat(LEFT_CURLY_BRACKET)) {
            if (this.eatDecimalDigits()) {
                const min = this._lastIntValue
                let max = min
                if (this.eat(COMMA)) {
                    max = this.eatDecimalDigits()
                        ? this._lastIntValue
                        : Number.POSITIVE_INFINITY
                }
                if (this.eat(RIGHT_CURLY_BRACKET)) {
                    if (!noError && max < min) {
                        this.raise("numbers out of order in {} quantifier")
                    }
                    this._lastRange = { min, max }
                    return true
                }
            }
            if (!noError && (this._unicodeMode || this.strict)) {
                this.raise("Incomplete quantifier")
            }
            this.rewind(start)
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `Atom` production if possible.
     * ```
     * Atom[UnicodeMode, UnicodeSetsMode, N]::
     *      PatternCharacter
     *      `.`
     *      `\\` AtomEscape[?UnicodeMode, ?UnicodeSetsMode, ?N]
     *      CharacterClass[?UnicodeMode, ?UnicodeSetsMode]
     *      `(` GroupSpecifier[?UnicodeMode] Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] `)`
     *      `(?:` Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] `)`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeAtom(): boolean {
        return (
            this.consumePatternCharacter() ||
            this.consumeDot() ||
            this.consumeReverseSolidusAtomEscape() ||
            Boolean(this.consumeCharacterClass()) ||
            this.consumeUncapturingGroup() ||
            this.consumeCapturingGroup()
        )
    }

    /**
     * Validate the next characters as the following alternatives if possible.
     * ```
     *      `.`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeDot(): boolean {
        if (this.eat(FULL_STOP)) {
            this.onAnyCharacterSet(this.index - 1, this.index, "any")
            return true
        }
        return false
    }

    /**
     * Validate the next characters as the following alternatives if possible.
     * ```
     *      `\\` AtomEscape[?UnicodeMode, ?UnicodeSetsMode, ?N]
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeReverseSolidusAtomEscape(): boolean {
        const start = this.index
        if (this.eat(REVERSE_SOLIDUS)) {
            if (this.consumeAtomEscape()) {
                return true
            }
            this.rewind(start)
        }
        return false
    }

    /**
     * Validate the next characters as the following alternatives if possible.
     * ```
     *      `(?:` Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] )
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeUncapturingGroup(): boolean {
        const start = this.index
        if (this.eat3(LEFT_PARENTHESIS, QUESTION_MARK, COLON)) {
            this.onGroupEnter(start)
            this.consumeDisjunction()
            if (!this.eat(RIGHT_PARENTHESIS)) {
                this.raise("Unterminated group")
            }
            this.onGroupLeave(start, this.index)
            return true
        }
        return false
    }

    /**
     * Validate the next characters as the following alternatives if possible.
     * ```
     *      `(` GroupSpecifier[?UnicodeMode] Disjunction[?UnicodeMode, ?UnicodeSetsMode, ?N] `)`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeCapturingGroup(): boolean {
        const start = this.index
        if (this.eat(LEFT_PARENTHESIS)) {
            let name: string | null = null
            if (this.ecmaVersion >= 2018) {
                if (this.consumeGroupSpecifier()) {
                    name = this._lastStrValue
                }
            } else if (this.currentCodePoint === QUESTION_MARK) {
                this.raise("Invalid group")
            }

            this.onCapturingGroupEnter(start, name)
            this.consumeDisjunction()
            if (!this.eat(RIGHT_PARENTHESIS)) {
                this.raise("Unterminated group")
            }
            this.onCapturingGroupLeave(start, this.index, name)

            return true
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `ExtendedAtom` production if
     * possible.
     * ```
     * ExtendedAtom[N]::
     *      `.`
     *      `\` AtomEscape[~U, ?N]
     *      `\` [lookahead = c]
     *      CharacterClass[~U]
     *      `(?:` Disjunction[~U, ?N] `)`
     *      `(` Disjunction[~U, ?N] `)`
     *      InvalidBracedQuantifier
     *      ExtendedPatternCharacter
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeExtendedAtom(): boolean {
        return (
            this.consumeDot() ||
            this.consumeReverseSolidusAtomEscape() ||
            this.consumeReverseSolidusFollowedByC() ||
            Boolean(this.consumeCharacterClass()) ||
            this.consumeUncapturingGroup() ||
            this.consumeCapturingGroup() ||
            this.consumeInvalidBracedQuantifier() ||
            this.consumeExtendedPatternCharacter()
        )
    }

    /**
     * Validate the next characters as the following alternatives if possible.
     * ```
     *      `\` [lookahead = c]
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeReverseSolidusFollowedByC(): boolean {
        const start = this.index
        if (
            this.currentCodePoint === REVERSE_SOLIDUS &&
            this.nextCodePoint === LATIN_SMALL_LETTER_C
        ) {
            this._lastIntValue = this.currentCodePoint
            this.advance()
            this.onCharacter(start, this.index, REVERSE_SOLIDUS)
            return true
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `InvalidBracedQuantifier`
     * production if possible.
     * ```
     * InvalidBracedQuantifier::
     *      `{` DecimalDigits `}`
     *      `{` DecimalDigits `,}`
     *      `{` DecimalDigits `,` DecimalDigits `}`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeInvalidBracedQuantifier(): boolean {
        if (this.eatBracedQuantifier(/* noError= */ true)) {
            this.raise("Nothing to repeat")
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `PatternCharacter` production if
     * possible.
     * ```
     * PatternCharacter::
     *      SourceCharacter but not SyntaxCharacter
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumePatternCharacter(): boolean {
        const start = this.index
        const cp = this.currentCodePoint
        if (cp !== -1 && !isSyntaxCharacter(cp)) {
            this.advance()
            this.onCharacter(start, this.index, cp)
            return true
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `ExtendedPatternCharacter`
     * production if possible.
     * ```
     * ExtendedPatternCharacter::
     *      SourceCharacter but not one of ^ $ \ . * + ? ( ) [ |
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeExtendedPatternCharacter(): boolean {
        const start = this.index
        const cp = this.currentCodePoint
        if (
            cp !== -1 &&
            cp !== CIRCUMFLEX_ACCENT &&
            cp !== DOLLAR_SIGN &&
            cp !== REVERSE_SOLIDUS &&
            cp !== FULL_STOP &&
            cp !== ASTERISK &&
            cp !== PLUS_SIGN &&
            cp !== QUESTION_MARK &&
            cp !== LEFT_PARENTHESIS &&
            cp !== RIGHT_PARENTHESIS &&
            cp !== LEFT_SQUARE_BRACKET &&
            cp !== VERTICAL_LINE
        ) {
            this.advance()
            this.onCharacter(start, this.index, cp)
            return true
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `GroupSpecifier` production.
     * Set `this._lastStrValue` if the group name existed.
     * ```
     * GroupSpecifier[UnicodeMode]::
     *      [empty]
     *      `?` GroupName[?UnicodeMode]
     * ```
     * @returns `true` if the group name existed.
     */
    private consumeGroupSpecifier(): boolean {
        if (this.eat(QUESTION_MARK)) {
            if (this.eatGroupName()) {
                if (!this._groupNames.has(this._lastStrValue)) {
                    this._groupNames.add(this._lastStrValue)
                    return true
                }
                this.raise("Duplicate capture group name")
            }
            this.raise("Invalid group")
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `AtomEscape` production if
     * possible.
     * ```
     * AtomEscape[UnicodeMode, N]::
     *      [strict] DecimalEscape
     *      [annexB][+UnicodeMode] DecimalEscape
     *      [annexB][~UnicodeMode] DecimalEscape but only if the CapturingGroupNumber of DecimalEscape is <= NcapturingParens
     *      CharacterClassEscape[?UnicodeMode]
     *      [strict] CharacterEscape[?UnicodeMode]
     *      [annexB] CharacterEscape[?UnicodeMode, ?N]
     *      [+N] `k` GroupName[?UnicodeMode]
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeAtomEscape(): boolean {
        if (
            this.consumeBackreference() ||
            this.consumeCharacterClassEscape() ||
            this.consumeCharacterEscape() ||
            (this._nFlag && this.consumeKGroupName())
        ) {
            return true
        }
        if (this.strict || this._unicodeMode) {
            this.raise("Invalid escape")
        }
        return false
    }

    /**
     * Validate the next characters as the following alternatives if possible.
     * ```
     *      [strict] DecimalEscape
     *      [annexB][+UnicodeMode] DecimalEscape
     *      [annexB][~UnicodeMode] DecimalEscape but only if the CapturingGroupNumber of DecimalEscape is <= NcapturingParens
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeBackreference(): boolean {
        const start = this.index
        if (this.eatDecimalEscape()) {
            const n = this._lastIntValue
            if (n <= this._numCapturingParens) {
                this.onBackreference(start - 1, this.index, n)
                return true
            }
            if (this.strict || this._unicodeMode) {
                this.raise("Invalid escape")
            }
            this.rewind(start)
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `DecimalEscape` production if
     * possible.
     * Set `-1` to `this._lastIntValue` as meaning of a character set if it ate
     * the next characters successfully.
     * ```
     * CharacterClassEscape[UnicodeMode]::
     *      `d`
     *      `D`
     *      `s`
     *      `S`
     *      `w`
     *      `W`
     *      [+UnicodeMode] `p{` UnicodePropertyValueExpression `}`
     *      [+UnicodeMode] `P{` UnicodePropertyValueExpression `}`
     * ```
     * @returns the object if it consumed the next characters successfully.
     */
    // eslint-disable-next-line complexity
    private consumeCharacterClassEscape(): UnicodeSetsConsumeResult | null {
        const start = this.index

        if (this.eat(LATIN_SMALL_LETTER_D)) {
            this._lastIntValue = -1
            this.onEscapeCharacterSet(start - 1, this.index, "digit", false)

            // * Static Semantics: MayContainStrings
            // CharacterClassEscape[UnicodeMode] ::
            //         d
            //     1. Return false.
            return {}
        }
        if (this.eat(LATIN_CAPITAL_LETTER_D)) {
            this._lastIntValue = -1
            this.onEscapeCharacterSet(start - 1, this.index, "digit", true)

            // * Static Semantics: MayContainStrings
            // CharacterClassEscape[UnicodeMode] ::
            //         D
            //     1. Return false.
            return {}
        }
        if (this.eat(LATIN_SMALL_LETTER_S)) {
            this._lastIntValue = -1
            this.onEscapeCharacterSet(start - 1, this.index, "space", false)

            // * Static Semantics: MayContainStrings
            // CharacterClassEscape[UnicodeMode] ::
            //         s
            //     1. Return false.
            return {}
        }
        if (this.eat(LATIN_CAPITAL_LETTER_S)) {
            this._lastIntValue = -1
            this.onEscapeCharacterSet(start - 1, this.index, "space", true)

            // * Static Semantics: MayContainStrings
            // CharacterClassEscape[UnicodeMode] ::
            //         S
            //     1. Return false.
            return {}
        }
        if (this.eat(LATIN_SMALL_LETTER_W)) {
            this._lastIntValue = -1
            this.onEscapeCharacterSet(start - 1, this.index, "word", false)

            // * Static Semantics: MayContainStrings
            // CharacterClassEscape[UnicodeMode] ::
            //         w
            //     1. Return false.
            return {}
        }
        if (this.eat(LATIN_CAPITAL_LETTER_W)) {
            this._lastIntValue = -1
            this.onEscapeCharacterSet(start - 1, this.index, "word", true)

            // * Static Semantics: MayContainStrings
            // CharacterClassEscape[UnicodeMode] ::
            //         W
            //     1. Return false.
            return {}
        }

        let negate = false
        if (
            this._unicodeMode &&
            this.ecmaVersion >= 2018 &&
            (this.eat(LATIN_SMALL_LETTER_P) ||
                (negate = this.eat(LATIN_CAPITAL_LETTER_P)))
        ) {
            this._lastIntValue = -1
            let result: UnicodePropertyValueExpressionConsumeResult | null =
                null
            if (
                this.eat(LEFT_CURLY_BRACKET) &&
                (result = this.eatUnicodePropertyValueExpression()) &&
                this.eat(RIGHT_CURLY_BRACKET)
            ) {
                if (negate && result.strings) {
                    this.raise("Invalid property name")
                }

                this.onUnicodePropertyCharacterSet(
                    start - 1,
                    this.index,
                    "property",
                    result.key,
                    result.value,
                    negate,
                    result.strings ?? false,
                )

                // * Static Semantics: MayContainStrings
                // CharacterClassEscape[UnicodeMode] ::
                //         P{ UnicodePropertyValueExpression }
                // UnicodePropertyValueExpression ::
                //         UnicodePropertyName = UnicodePropertyValue
                //     1. Return false.
                // CharacterClassEscape :: p{ UnicodePropertyValueExpression }
                //     1. Return MayContainStrings of the UnicodePropertyValueExpression.
                // UnicodePropertyValueExpression :: LoneUnicodePropertyNameOrValue
                //     1. If SourceText of LoneUnicodePropertyNameOrValue is identical to a List of Unicode code points that is a binary property of strings listed in the “Property name” column of Table 69, return true.
                //     2. Return false.
                //
                // negate==true && mayContainStrings==true is already errors, so no need to handle it.
                return { mayContainStrings: result.strings }
            }
            this.raise("Invalid property name")
        }

        return null
    }

    /**
     * Validate the next characters as a RegExp `CharacterEscape` production if
     * possible.
     * ```
     * CharacterEscape[UnicodeMode, N]::
     *      ControlEscape
     *      `c` ControlLetter
     *      `0` [lookahead ∉ DecimalDigit]
     *      HexEscapeSequence
     *      RegExpUnicodeEscapeSequence[?UnicodeMode]
     *      [annexB][~UnicodeMode] LegacyOctalEscapeSequence
     *      IdentityEscape[?UnicodeMode, ?N]
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeCharacterEscape(): boolean {
        const start = this.index
        if (
            this.eatControlEscape() ||
            this.eatCControlLetter() ||
            this.eatZero() ||
            this.eatHexEscapeSequence() ||
            this.eatRegExpUnicodeEscapeSequence() ||
            (!this.strict &&
                !this._unicodeMode &&
                this.eatLegacyOctalEscapeSequence()) ||
            this.eatIdentityEscape()
        ) {
            this.onCharacter(start - 1, this.index, this._lastIntValue)
            return true
        }
        return false
    }

    /**
     * Validate the next characters as the following alternatives if possible.
     * ```
     *      `k` GroupName[?UnicodeMode]
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeKGroupName(): boolean {
        const start = this.index
        if (this.eat(LATIN_SMALL_LETTER_K)) {
            if (this.eatGroupName()) {
                const groupName = this._lastStrValue
                this._backreferenceNames.add(groupName)
                this.onBackreference(start - 1, this.index, groupName)
                return true
            }
            this.raise("Invalid named reference")
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `CharacterClass` production if
     * possible.
     * ```
     * CharacterClass[UnicodeMode, UnicodeSetsMode]::
     *      `[` [lookahead ≠ ^] ClassContents[?UnicodeMode, ?UnicodeSetsMode] `]`
     *      `[^` ClassContents[?UnicodeMode, ?UnicodeSetsMode] `]`
     * ```
     * @returns the object if it consumed the next characters successfully.
     */
    private consumeCharacterClass(): UnicodeSetsConsumeResult | null {
        const start = this.index
        if (this.eat(LEFT_SQUARE_BRACKET)) {
            const negate = this.eat(CIRCUMFLEX_ACCENT)
            this.onCharacterClassEnter(start, negate, this._unicodeSetsMode)
            const result = this.consumeClassContents()
            if (!this.eat(RIGHT_SQUARE_BRACKET)) {
                if (this.currentCodePoint === -1) {
                    this.raise("Unterminated character class")
                }
                this.raise("Invalid character in character class")
            }
            if (negate && result.mayContainStrings) {
                this.raise("Negated character class may contain strings")
            }

            this.onCharacterClassLeave(start, this.index, negate)

            // * Static Semantics: MayContainStrings
            // CharacterClass[UnicodeMode, UnicodeSetsMode] ::
            //         [ ^ ClassContents[?UnicodeMode, ?UnicodeSetsMode] ]
            //     1. Return false.
            // CharacterClass :: [ ClassContents ]
            //     1. Return MayContainStrings of the ClassContents.
            return result
        }
        return null
    }

    /**
     * Validate the next characters as a RegExp `ClassContents` production.
     * ```
     * ClassContents[UnicodeMode, UnicodeSetsMode] ::
     *      [empty]
     *      [~UnicodeSetsMode] NonemptyClassRanges[?UnicodeMode]
     *      [+UnicodeSetsMode] ClassSetExpression
     * NonemptyClassRanges[UnicodeMode]::
     *      ClassAtom[?UnicodeMode]
     *      ClassAtom[?UnicodeMode] NonemptyClassRangesNoDash[?UnicodeMode]
     *      ClassAtom[?UnicodeMode] `-` ClassAtom[?UnicodeMode] ClassContents[?UnicodeMode, ~UnicodeSetsMode]
     * NonemptyClassRangesNoDash[UnicodeMode]::
     *      ClassAtom[?UnicodeMode]
     *      ClassAtomNoDash[?UnicodeMode] NonemptyClassRangesNoDash[?UnicodeMode]
     *      ClassAtomNoDash[?UnicodeMode] `-` ClassAtom[?UnicodeMode] ClassContents[?UnicodeMode, ~UnicodeSetsMode]
     * ```
     */
    private consumeClassContents(): UnicodeSetsConsumeResult {
        if (this._unicodeSetsMode) {
            if (this.currentCodePoint === RIGHT_SQUARE_BRACKET) {
                // [empty]

                // * Static Semantics: MayContainStrings
                // ClassContents[UnicodeMode, UnicodeSetsMode] ::
                //         [empty]
                //     1. Return false.
                return {}
            }
            const result = this.consumeClassSetExpression()

            // * Static Semantics: MayContainStrings
            // ClassContents :: ClassSetExpression
            //     1. Return MayContainStrings of the ClassSetExpression.
            return result
        }
        const strict = this.strict || this._unicodeMode
        for (;;) {
            // Consume the first ClassAtom
            const rangeStart = this.index
            if (!this.consumeClassAtom()) {
                break
            }
            const min = this._lastIntValue

            // Consume `-`
            if (!this.eat(HYPHEN_MINUS)) {
                continue
            }
            this.onCharacter(this.index - 1, this.index, HYPHEN_MINUS)

            // Consume the second ClassAtom
            if (!this.consumeClassAtom()) {
                break
            }
            const max = this._lastIntValue

            // Validate
            if (min === -1 || max === -1) {
                if (strict) {
                    this.raise("Invalid character class")
                }
                continue
            }
            if (min > max) {
                this.raise("Range out of order in character class")
            }

            this.onCharacterClassRange(rangeStart, this.index, min, max)
        }

        // * Static Semantics: MayContainStrings
        // ClassContents[UnicodeMode, UnicodeSetsMode] ::
        //         NonemptyClassRanges[?UnicodeMode]
        //     1. Return false.
        return {}
    }

    /**
     * Validate the next characters as a RegExp `ClassAtom` production if
     * possible.
     * Set `this._lastIntValue` if it consumed the next characters successfully.
     * ```
     * ClassAtom[UnicodeMode, N]::
     *      `-`
     *      ClassAtomNoDash[?UnicodeMode, ?N]
     * ClassAtomNoDash[UnicodeMode, N]::
     *      SourceCharacter but not one of \ ] -
     *      `\` ClassEscape[?UnicodeMode, ?N]
     *      [annexB] `\` [lookahead = c]
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeClassAtom(): boolean {
        const start = this.index
        const cp = this.currentCodePoint

        if (
            cp !== -1 &&
            cp !== REVERSE_SOLIDUS &&
            cp !== RIGHT_SQUARE_BRACKET
        ) {
            this.advance()
            this._lastIntValue = cp
            this.onCharacter(start, this.index, this._lastIntValue)
            return true
        }

        if (this.eat(REVERSE_SOLIDUS)) {
            if (this.consumeClassEscape()) {
                return true
            }
            if (
                !this.strict &&
                this.currentCodePoint === LATIN_SMALL_LETTER_C
            ) {
                this._lastIntValue = REVERSE_SOLIDUS
                this.onCharacter(start, this.index, this._lastIntValue)
                return true
            }
            if (this.strict || this._unicodeMode) {
                this.raise("Invalid escape")
            }
            this.rewind(start)
        }

        return false
    }

    /**
     * Validate the next characters as a RegExp `ClassEscape` production if
     * possible.
     * Set `this._lastIntValue` if it consumed the next characters successfully.
     * ```
     * ClassEscape[UnicodeMode, N]::
     *      `b`
     *      [+UnicodeMode] `-`
     *      [annexB][~UnicodeMode] `c` ClassControlLetter
     *      CharacterClassEscape[?UnicodeMode]
     *      CharacterEscape[?UnicodeMode, ?N]
     * ClassControlLetter::
     *      DecimalDigit
     *      `_`
     * ```
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeClassEscape(): boolean {
        const start = this.index

        // `b`
        if (this.eat(LATIN_SMALL_LETTER_B)) {
            this._lastIntValue = BACKSPACE
            this.onCharacter(start - 1, this.index, this._lastIntValue)
            return true
        }

        // [+UnicodeMode] `-`
        if (this._unicodeMode && this.eat(HYPHEN_MINUS)) {
            this._lastIntValue = HYPHEN_MINUS
            this.onCharacter(start - 1, this.index, this._lastIntValue)
            return true
        }

        // [annexB][~UnicodeMode] `c` ClassControlLetter
        let cp = 0
        if (
            !this.strict &&
            !this._unicodeMode &&
            this.currentCodePoint === LATIN_SMALL_LETTER_C &&
            (isDecimalDigit((cp = this.nextCodePoint)) || cp === LOW_LINE)
        ) {
            this.advance()
            this.advance()
            this._lastIntValue = cp % 0x20
            this.onCharacter(start - 1, this.index, this._lastIntValue)
            return true
        }

        return (
            Boolean(this.consumeCharacterClassEscape()) ||
            this.consumeCharacterEscape()
        )
    }

    /**
     * Validate the next characters as a RegExp `ClassSetExpression` production.
     * ```
     * ClassSetExpression ::
     *     ClassUnion
     *     ClassIntersection
     *     ClassSubtraction
     * ClassUnion ::
     *     ClassSetRange ClassUnion(opt)
     *     ClassSetOperand ClassUnion(opt)
     * ClassIntersection ::
     *     ClassSetOperand `&&` [lookahead ≠ &] ClassSetOperand
     *     ClassIntersection `&&` [lookahead ≠ &] ClassSetOperand
     * ClassSubtraction ::
     *     ClassSetOperand `--` ClassSetOperand
     *     ClassSubtraction `--` ClassSetOperand
     * ```
     */
    private consumeClassSetExpression(): UnicodeSetsConsumeResult {
        const start = this.index
        let mayContainStrings: boolean | undefined = false
        let result: UnicodeSetsConsumeResult | null = null
        if (this.consumeClassSetCharacter()) {
            if (this.consumeClassSetRangeFromOperator(start)) {
                // ClassUnion
                this.consumeClassUnionRight({})
                return {}
            }
            // ClassSetOperand

            // * Static Semantics: MayContainStrings
            // ClassSetOperand ::
            //         ClassSetCharacter
            //     1. Return false.
            mayContainStrings = false
        } else if ((result = this.consumeClassSetOperand())) {
            mayContainStrings = result.mayContainStrings
        } else {
            const cp = this.currentCodePoint
            if (cp === REVERSE_SOLIDUS) {
                // Make the same message as V8.
                this.advance()
                this.raise("Invalid escape")
            }
            if (
                cp === this.nextCodePoint &&
                isClassSetReservedDoublePunctuatorCharacter(cp)
            ) {
                // Make the same message as V8.
                this.raise("Invalid set operation in character class")
            }
            this.raise("Invalid character in character class")
        }

        if (this.eat2(AMPERSAND, AMPERSAND)) {
            // ClassIntersection
            while (
                this.currentCodePoint !== AMPERSAND &&
                (result = this.consumeClassSetOperand())
            ) {
                this.onClassIntersection(start, this.index)
                if (!result.mayContainStrings) {
                    mayContainStrings = false
                }
                if (this.eat2(AMPERSAND, AMPERSAND)) {
                    continue
                }

                // * Static Semantics: MayContainStrings
                // ClassSetExpression :: ClassIntersection
                //     1. Return MayContainStrings of the ClassIntersection.
                // ClassIntersection :: ClassSetOperand && ClassSetOperand
                //     1. If MayContainStrings of the first ClassSetOperand is false, return false.
                //     2. If MayContainStrings of the second ClassSetOperand is false, return false.
                //     3. Return true.
                // ClassIntersection :: ClassIntersection && ClassSetOperand
                //     1. If MayContainStrings of the ClassIntersection is false, return false.
                //     2. If MayContainStrings of the ClassSetOperand is false, return false.
                //     3. Return true.
                return { mayContainStrings }
            }

            this.raise("Invalid character in character class")
        }
        if (this.eat2(HYPHEN_MINUS, HYPHEN_MINUS)) {
            // ClassSubtraction
            while (this.consumeClassSetOperand()) {
                this.onClassSubtraction(start, this.index)
                if (this.eat2(HYPHEN_MINUS, HYPHEN_MINUS)) {
                    continue
                }
                // * Static Semantics: MayContainStrings
                // ClassSetExpression :: ClassSubtraction
                //     1. Return MayContainStrings of the ClassSubtraction.
                // ClassSubtraction :: ClassSetOperand -- ClassSetOperand
                //     1. Return MayContainStrings of the first ClassSetOperand.
                // ClassSubtraction :: ClassSubtraction -- ClassSetOperand
                //     1. Return MayContainStrings of the ClassSubtraction.
                return { mayContainStrings }
            }
            this.raise("Invalid character in character class")
        }
        // ClassUnion
        return this.consumeClassUnionRight({ mayContainStrings })
    }

    /**
     * Validate the next characters as right operand of a RegExp `ClassUnion` production.
     * ```
     * ClassUnion ::
     *     ClassSetRange ClassUnion(opt)
     *     ClassSetOperand ClassUnion(opt)
     * ```
     * @param leftResult The result information for the left `ClassSetRange` or `ClassSetOperand`.
     */
    private consumeClassUnionRight(
        leftResult: UnicodeSetsConsumeResult,
    ): UnicodeSetsConsumeResult {
        // ClassUnion
        let mayContainStrings = leftResult.mayContainStrings
        for (;;) {
            const start = this.index
            if (this.consumeClassSetCharacter()) {
                this.consumeClassSetRangeFromOperator(start)
                continue
            }
            const result = this.consumeClassSetOperand()
            if (result) {
                if (result.mayContainStrings) {
                    mayContainStrings = true
                }
                continue
            }
            break
        }

        // * Static Semantics: MayContainStrings
        // ClassSetExpression :: ClassUnion
        //     1. Return MayContainStrings of the ClassUnion.
        // ClassUnion :: ClassSetRange ClassUnion(opt)
        //     1. If the ClassUnion is present, return MayContainStrings of the ClassUnion.
        //     2. Return false.
        // ClassUnion :: ClassSetOperand ClassUnion(opt)
        //     1. If MayContainStrings of the ClassSetOperand is true, return true.
        //     2. If ClassUnion is present, return MayContainStrings of the ClassUnion.
        //     3. Return false.
        return { mayContainStrings }
    }

    /**
     * Validate the next characters as from the `-` operator in a RegExp `ClassSetRange` production if possible.
     *
     * ```
     * ClassSetRange ::
     *     ClassSetCharacter `-` ClassSetCharacter
     * ```
     *
     * @param start The starting position of the left operand.
     * @returns `true` if it consumed the next characters successfully.
     */
    private consumeClassSetRangeFromOperator(start: number) {
        const currentStart = this.index
        const min = this._lastIntValue
        if (this.eat(HYPHEN_MINUS)) {
            if (this.consumeClassSetCharacter()) {
                const max = this._lastIntValue

                // Validate
                if (min === -1 || max === -1) {
                    this.raise("Invalid character class")
                }
                if (min > max) {
                    this.raise("Range out of order in character class")
                }
                this.onCharacterClassRange(start, this.index, min, max)
                return true
            }
            this.rewind(currentStart)
        }
        return false
    }

    /**
     * Validate the next characters as a RegExp `ClassSetOperand` production if possible.
     * ```
     * ClassSetOperand ::
     *     ClassSetCharacter
     *     ClassStringDisjunction
     *     NestedClass
     * ```
     *
     * @returns the object if it consumed the next characters successfully.
     */
    private consumeClassSetOperand(): UnicodeSetsConsumeResult | null {
        let result: UnicodeSetsConsumeResult | null = null
        if ((result = this.consumeNestedClass())) {
            // * Static Semantics: MayContainStrings
            // ClassSetOperand :: NestedClass
            //     1. Return MayContainStrings of the NestedClass.
            return result
        }
        if ((result = this.consumeClassStringDisjunction())) {
            // * Static Semantics: MayContainStrings
            // ClassSetOperand :: ClassStringDisjunction
            //     1. Return MayContainStrings of the ClassStringDisjunction.
            return result
        }
        if (this.consumeClassSetCharacter()) {
            // * Static Semantics: MayContainStrings
            // ClassSetOperand ::
            //         ClassSetCharacter
            //     1. Return false.
            return {}
        }
        return null
    }

    /**
     * Validate the next characters as a RegExp `NestedClass` production if possible.
     * ```
     * NestedClass ::
     *     `[` [lookahead ≠ ^] ClassContents[+UnicodeMode, +UnicodeSetsMode] `]`
     *     `[^` ClassContents[+UnicodeMode, +UnicodeSetsMode] `]`
     *     `\` CharacterClassEscape[+UnicodeMode]
     * ```
     * @returns the object if it consumed the next characters successfully.
     */
    private consumeNestedClass(): UnicodeSetsConsumeResult | null {
        const start = this.index
        if (this.eat(LEFT_SQUARE_BRACKET)) {
            const negate = this.eat(CIRCUMFLEX_ACCENT)
            this.onCharacterClassEnter(start, negate, true)
            const result = this.consumeClassContents()
            if (!this.eat(RIGHT_SQUARE_BRACKET)) {
                this.raise("Unterminated character class")
            }
            if (negate && result.mayContainStrings) {
                this.raise("Negated character class may contain strings")
            }
            this.onCharacterClassLeave(start, this.index, negate)

            // * Static Semantics: MayContainStrings
            // NestedClass ::
            //         [ ^ ClassContents[+UnicodeMode, +UnicodeSetsMode] ]
            //     1. Return false.
            // NestedClass :: [ ClassContents ]
            //     1. Return MayContainStrings of the ClassContents.
            return result
        }
        if (this.eat(REVERSE_SOLIDUS)) {
            const result = this.consumeCharacterClassEscape()
            if (result) {
                // * Static Semantics: MayContainStrings
                // NestedClass :: \ CharacterClassEscape
                //     1. Return MayContainStrings of the CharacterClassEscape.
                return result
            }
            this.rewind(start)
        }
        return null
    }

    /**
     * Validate the next characters as a RegExp `ClassStringDisjunction` production if possible.
     * ```
     * ClassStringDisjunction ::
     *     `\q{` ClassStringDisjunctionContents `}`
     * ClassStringDisjunctionContents ::
     *     ClassString
     *     ClassString `|` ClassStringDisjunctionContents
     * ```
     * @returns the object if it consumed the next characters successfully.
     */
    private consumeClassStringDisjunction(): UnicodeSetsConsumeResult | null {
        const start = this.index
        if (
            this.eat3(REVERSE_SOLIDUS, LATIN_SMALL_LETTER_Q, LEFT_CURLY_BRACKET)
        ) {
            this.onClassStringDisjunctionEnter(start)

            let i = 0
            let mayContainStrings = false
            do {
                if (this.consumeClassString(i++).mayContainStrings) {
                    mayContainStrings = true
                }
            } while (this.eat(VERTICAL_LINE))

            if (this.eat(RIGHT_CURLY_BRACKET)) {
                this.onClassStringDisjunctionLeave(start, this.index)

                // * Static Semantics: MayContainStrings
                // ClassStringDisjunction :: \q{ ClassStringDisjunctionContents }
                //     1. Return MayContainStrings of the ClassStringDisjunctionContents.
                // ClassStringDisjunctionContents :: ClassString
                //     1. Return MayContainStrings of the ClassString.
                // ClassStringDisjunctionContents :: ClassString | ClassStringDisjunctionContents
                //     1. If MayContainStrings of the ClassString is true, return true.
                //     2. Return MayContainStrings of the ClassStringDisjunctionContents.
                return { mayContainStrings }
            }
            this.raise("Unterminated class string disjunction")
        }
        return null
    }

    /**
     * Validate the next characters as a RegExp `ClassString ` production.
     * ```
     * ClassString ::
     *     [empty]
     *     NonEmptyClassString
     * NonEmptyClassString ::
     *     ClassSetCharacter NonEmptyClassString(opt)
     * ```
     */
    private consumeClassString(i: number): UnicodeSetsConsumeResult {
        const start = this.index

        let count = 0
        this.onStringAlternativeEnter(start, i)
        while (
            this.currentCodePoint !== -1 &&
            this.consumeClassSetCharacter()
        ) {
            count++
        }
        this.onStringAlternativeLeave(start, this.index, i)

        // * Static Semantics: MayContainStrings
        // ClassString :: [empty]
        //     1. Return true.
        // ClassString :: NonEmptyClassString
        //     1. Return MayContainStrings of the NonEmptyClassString.
        // NonEmptyClassString :: ClassSetCharacter NonEmptyClassString(opt)
        //     1. If NonEmptyClassString is present, return true.
        //     2. Return false.
        return { mayContainStrings: count !== 1 }
    }

    /**
     * Validate the next characters as a RegExp `ClassSetCharacter` production if possible.
     * Set `this._lastIntValue` if it consumed the next characters successfully.
     * ```
     * ClassSetCharacter ::
     *     [lookahead ∉ ClassSetReservedDoublePunctuator] SourceCharacter but not ClassSetSyntaxCharacter
     *     `\` CharacterEscape[+UnicodeMode]
     *     `\` ClassSetReservedPunctuator
     *     `\b`
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private consumeClassSetCharacter(): boolean {
        const start = this.index
        const cp = this.currentCodePoint
        if (
            // [lookahead ∉ ClassSetReservedDoublePunctuator]
            cp !== this.nextCodePoint ||
            !isClassSetReservedDoublePunctuatorCharacter(cp)
        ) {
            if (cp !== -1 && !isClassSetSyntaxCharacter(cp)) {
                this._lastIntValue = cp
                this.advance()
                this.onCharacter(start, this.index, this._lastIntValue)
                return true
            }
        }
        if (this.eat(REVERSE_SOLIDUS)) {
            if (this.consumeCharacterEscape()) {
                return true
            }
            if (isClassSetReservedPunctuator(this.currentCodePoint)) {
                this._lastIntValue = this.currentCodePoint
                this.advance()
                this.onCharacter(start, this.index, this._lastIntValue)
                return true
            }
            if (this.eat(LATIN_SMALL_LETTER_B)) {
                this._lastIntValue = BACKSPACE
                this.onCharacter(start, this.index, this._lastIntValue)
                return true
            }
            this.rewind(start)
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `GroupName` production if possible.
     * Set `this._lastStrValue` if the group name existed.
     * ```
     * GroupName[UnicodeMode]::
     *      `<` RegExpIdentifierName[?UnicodeMode] `>`
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatGroupName(): boolean {
        if (this.eat(LESS_THAN_SIGN)) {
            if (this.eatRegExpIdentifierName() && this.eat(GREATER_THAN_SIGN)) {
                return true
            }
            this.raise("Invalid capture group name")
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `RegExpIdentifierName` production if
     * possible.
     * Set `this._lastStrValue` if the identifier name existed.
     * ```
     * RegExpIdentifierName[UnicodeMode]::
     *      RegExpIdentifierStart[?UnicodeMode]
     *      RegExpIdentifierName[?UnicodeMode] RegExpIdentifierPart[?UnicodeMode]
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatRegExpIdentifierName(): boolean {
        if (this.eatRegExpIdentifierStart()) {
            this._lastStrValue = String.fromCodePoint(this._lastIntValue)
            while (this.eatRegExpIdentifierPart()) {
                this._lastStrValue += String.fromCodePoint(this._lastIntValue)
            }
            return true
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `RegExpIdentifierStart` production if
     * possible.
     * Set `this._lastIntValue` if the identifier start existed.
     * ```
     * RegExpIdentifierStart[UnicodeMode] ::
     *      IdentifierStartChar
     *      `$`
     *      `_`
     *      `\` RegExpUnicodeEscapeSequence[+UnicodeMode]
     *      [~UnicodeMode] UnicodeLeadSurrogate UnicodeTrailSurrogate
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatRegExpIdentifierStart(): boolean {
        const start = this.index
        const forceUFlag = !this._unicodeMode && this.ecmaVersion >= 2020
        let cp = this.currentCodePoint
        this.advance()

        if (
            cp === REVERSE_SOLIDUS &&
            this.eatRegExpUnicodeEscapeSequence(forceUFlag)
        ) {
            cp = this._lastIntValue
        } else if (
            forceUFlag &&
            isLeadSurrogate(cp) &&
            isTrailSurrogate(this.currentCodePoint)
        ) {
            cp = combineSurrogatePair(cp, this.currentCodePoint)
            this.advance()
        }

        if (isIdentifierStartChar(cp)) {
            this._lastIntValue = cp
            return true
        }

        if (this.index !== start) {
            this.rewind(start)
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `RegExpIdentifierPart` production if
     * possible.
     * Set `this._lastIntValue` if the identifier part existed.
     * ```
     * RegExpIdentifierPart[UnicodeMode] ::
     *      IdentifierPartChar
     *      `\` RegExpUnicodeEscapeSequence[+UnicodeMode]
     *      [~UnicodeMode] UnicodeLeadSurrogate UnicodeTrailSurrogate
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatRegExpIdentifierPart(): boolean {
        const start = this.index
        const forceUFlag = !this._unicodeMode && this.ecmaVersion >= 2020
        let cp = this.currentCodePoint
        this.advance()

        if (
            cp === REVERSE_SOLIDUS &&
            this.eatRegExpUnicodeEscapeSequence(forceUFlag)
        ) {
            cp = this._lastIntValue
        } else if (
            forceUFlag &&
            isLeadSurrogate(cp) &&
            isTrailSurrogate(this.currentCodePoint)
        ) {
            cp = combineSurrogatePair(cp, this.currentCodePoint)
            this.advance()
        }

        if (isIdentifierPartChar(cp)) {
            this._lastIntValue = cp
            return true
        }

        if (this.index !== start) {
            this.rewind(start)
        }
        return false
    }

    /**
     * Eat the next characters as the following alternatives if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     *      `c` ControlLetter
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatCControlLetter(): boolean {
        const start = this.index
        if (this.eat(LATIN_SMALL_LETTER_C)) {
            if (this.eatControlLetter()) {
                return true
            }
            this.rewind(start)
        }
        return false
    }

    /**
     * Eat the next characters as the following alternatives if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     *      `0` [lookahead ∉ DecimalDigit]
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatZero(): boolean {
        if (
            this.currentCodePoint === DIGIT_ZERO &&
            !isDecimalDigit(this.nextCodePoint)
        ) {
            this._lastIntValue = 0
            this.advance()
            return true
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `ControlEscape` production if
     * possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * ControlEscape:: one of
     *      f n r t v
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatControlEscape(): boolean {
        if (this.eat(LATIN_SMALL_LETTER_F)) {
            this._lastIntValue = FORM_FEED
            return true
        }
        if (this.eat(LATIN_SMALL_LETTER_N)) {
            this._lastIntValue = LINE_FEED
            return true
        }
        if (this.eat(LATIN_SMALL_LETTER_R)) {
            this._lastIntValue = CARRIAGE_RETURN
            return true
        }
        if (this.eat(LATIN_SMALL_LETTER_T)) {
            this._lastIntValue = CHARACTER_TABULATION
            return true
        }
        if (this.eat(LATIN_SMALL_LETTER_V)) {
            this._lastIntValue = LINE_TABULATION
            return true
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `ControlLetter` production if
     * possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * ControlLetter:: one of
     *      a b c d e f g h i j k l m n o p q r s t u v w x y z
     *      A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatControlLetter(): boolean {
        const cp = this.currentCodePoint
        if (isLatinLetter(cp)) {
            this.advance()
            this._lastIntValue = cp % 0x20
            return true
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `RegExpUnicodeEscapeSequence`
     * production if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * RegExpUnicodeEscapeSequence[UnicodeMode]::
     *      [+UnicodeMode] `u` HexLeadSurrogate `\u` HexTrailSurrogate
     *      [+UnicodeMode] `u` HexLeadSurrogate
     *      [+UnicodeMode] `u` HexTrailSurrogate
     *      [+UnicodeMode] `u` HexNonSurrogate
     *      [~UnicodeMode] `u` Hex4Digits
     *      [+UnicodeMode] `u{` CodePoint `}`
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatRegExpUnicodeEscapeSequence(forceUFlag = false): boolean {
        const start = this.index
        const uFlag = forceUFlag || this._unicodeMode

        if (this.eat(LATIN_SMALL_LETTER_U)) {
            if (
                (uFlag && this.eatRegExpUnicodeSurrogatePairEscape()) ||
                this.eatFixedHexDigits(4) ||
                (uFlag && this.eatRegExpUnicodeCodePointEscape())
            ) {
                return true
            }
            if (this.strict || uFlag) {
                this.raise("Invalid unicode escape")
            }
            this.rewind(start)
        }

        return false
    }

    /**
     * Eat the next characters as the following alternatives if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     *      HexLeadSurrogate `\u` HexTrailSurrogate
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatRegExpUnicodeSurrogatePairEscape(): boolean {
        const start = this.index

        if (this.eatFixedHexDigits(4)) {
            const lead = this._lastIntValue
            if (
                isLeadSurrogate(lead) &&
                this.eat(REVERSE_SOLIDUS) &&
                this.eat(LATIN_SMALL_LETTER_U) &&
                this.eatFixedHexDigits(4)
            ) {
                const trail = this._lastIntValue
                if (isTrailSurrogate(trail)) {
                    this._lastIntValue = combineSurrogatePair(lead, trail)
                    return true
                }
            }

            this.rewind(start)
        }

        return false
    }

    /**
     * Eat the next characters as the following alternatives if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     *      `{` CodePoint `}`
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatRegExpUnicodeCodePointEscape(): boolean {
        const start = this.index

        if (
            this.eat(LEFT_CURLY_BRACKET) &&
            this.eatHexDigits() &&
            this.eat(RIGHT_CURLY_BRACKET) &&
            isValidUnicode(this._lastIntValue)
        ) {
            return true
        }

        this.rewind(start)
        return false
    }

    /**
     * Eat the next characters as a RegExp `IdentityEscape` production if
     * possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * IdentityEscape[UnicodeMode, N]::
     *      [+UnicodeMode] SyntaxCharacter
     *      [+UnicodeMode] `/`
     *      [strict][~UnicodeMode] SourceCharacter but not UnicodeIDContinue
     *      [annexB][~UnicodeMode] SourceCharacterIdentityEscape[?N]
     * SourceCharacterIdentityEscape[N]::
     *      [~N] SourceCharacter but not c
     *      [+N] SourceCharacter but not one of c k
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatIdentityEscape(): boolean {
        const cp = this.currentCodePoint
        if (this.isValidIdentityEscape(cp)) {
            this._lastIntValue = cp
            this.advance()
            return true
        }
        return false
    }

    private isValidIdentityEscape(cp: number): boolean {
        if (cp === -1) {
            return false
        }
        if (this._unicodeMode) {
            return isSyntaxCharacter(cp) || cp === SOLIDUS
        }
        if (this.strict) {
            return !isIdContinue(cp)
        }
        if (this._nFlag) {
            return !(cp === LATIN_SMALL_LETTER_C || cp === LATIN_SMALL_LETTER_K)
        }
        return cp !== LATIN_SMALL_LETTER_C
    }

    /**
     * Eat the next characters as a RegExp `DecimalEscape` production if
     * possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * DecimalEscape::
     *      NonZeroDigit DecimalDigits(opt) [lookahead ∉ DecimalDigit]
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatDecimalEscape(): boolean {
        this._lastIntValue = 0
        let cp = this.currentCodePoint
        if (cp >= DIGIT_ONE && cp <= DIGIT_NINE) {
            do {
                this._lastIntValue = 10 * this._lastIntValue + (cp - DIGIT_ZERO)
                this.advance()
            } while (
                (cp = this.currentCodePoint) >= DIGIT_ZERO &&
                cp <= DIGIT_NINE
            )
            return true
        }
        return false
    }

    /**
     * Eat the next characters as a RegExp `UnicodePropertyValueExpression`
     * production if possible.
     * Set `this._lastProperty` if it ate the next
     * characters successfully.
     * ```
     * UnicodePropertyValueExpression::
     *      UnicodePropertyName `=` UnicodePropertyValue
     *      LoneUnicodePropertyNameOrValue
     * ```
     * @returns the object if it ate the next characters successfully.
     */
    private eatUnicodePropertyValueExpression(): UnicodePropertyValueExpressionConsumeResult | null {
        const start = this.index

        // UnicodePropertyName `=` UnicodePropertyValue
        if (this.eatUnicodePropertyName() && this.eat(EQUALS_SIGN)) {
            const key = this._lastStrValue
            if (this.eatUnicodePropertyValue()) {
                const value = this._lastStrValue
                if (isValidUnicodeProperty(this.ecmaVersion, key, value)) {
                    return {
                        key,
                        value: value || null,
                    }
                }
                this.raise("Invalid property name")
            }
        }
        this.rewind(start)

        // LoneUnicodePropertyNameOrValue
        if (this.eatLoneUnicodePropertyNameOrValue()) {
            const nameOrValue = this._lastStrValue
            if (
                isValidUnicodeProperty(
                    this.ecmaVersion,
                    "General_Category",
                    nameOrValue,
                )
            ) {
                return {
                    key: "General_Category",
                    value: nameOrValue || null,
                }
            }
            if (isValidLoneUnicodeProperty(this.ecmaVersion, nameOrValue)) {
                return {
                    key: nameOrValue,
                    value: null,
                }
            }
            if (
                this._unicodeSetsMode &&
                isValidLoneUnicodePropertyOfString(
                    this.ecmaVersion,
                    nameOrValue,
                )
            ) {
                return {
                    key: nameOrValue,
                    value: null,
                    strings: true,
                }
            }
            this.raise("Invalid property name")
        }
        return null
    }

    /**
     * Eat the next characters as a RegExp `UnicodePropertyName` production if
     * possible.
     * Set `this._lastStrValue` if it ate the next characters successfully.
     * ```
     * UnicodePropertyName::
     *      UnicodePropertyNameCharacters
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatUnicodePropertyName(): boolean {
        this._lastStrValue = ""
        while (isUnicodePropertyNameCharacter(this.currentCodePoint)) {
            this._lastStrValue += String.fromCodePoint(this.currentCodePoint)
            this.advance()
        }
        return this._lastStrValue !== ""
    }

    /**
     * Eat the next characters as a RegExp `UnicodePropertyValue` production if
     * possible.
     * Set `this._lastStrValue` if it ate the next characters successfully.
     * ```
     * UnicodePropertyValue::
     *      UnicodePropertyValueCharacters
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatUnicodePropertyValue(): boolean {
        this._lastStrValue = ""
        while (isUnicodePropertyValueCharacter(this.currentCodePoint)) {
            this._lastStrValue += String.fromCodePoint(this.currentCodePoint)
            this.advance()
        }
        return this._lastStrValue !== ""
    }

    /**
     * Eat the next characters as a RegExp `UnicodePropertyValue` production if
     * possible.
     * Set `this._lastStrValue` if it ate the next characters successfully.
     * ```
     * LoneUnicodePropertyNameOrValue::
     *      UnicodePropertyValueCharacters
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatLoneUnicodePropertyNameOrValue(): boolean {
        return this.eatUnicodePropertyValue()
    }

    /**
     * Eat the next characters as a `HexEscapeSequence` production if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * HexEscapeSequence::
     *      `x` HexDigit HexDigit
     * HexDigit:: one of
     *      0 1 2 3 4 5 6 7 8 9 a b c d e f A B C D E F
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatHexEscapeSequence(): boolean {
        const start = this.index
        if (this.eat(LATIN_SMALL_LETTER_X)) {
            if (this.eatFixedHexDigits(2)) {
                return true
            }
            if (this._unicodeMode || this.strict) {
                this.raise("Invalid escape")
            }
            this.rewind(start)
        }
        return false
    }

    /**
     * Eat the next characters as a `DecimalDigits` production if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * DecimalDigits::
     *      DecimalDigit
     *      DecimalDigits DecimalDigit
     * DecimalDigit:: one of
     *      0 1 2 3 4 5 6 7 8 9
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatDecimalDigits(): boolean {
        const start = this.index

        this._lastIntValue = 0
        while (isDecimalDigit(this.currentCodePoint)) {
            this._lastIntValue =
                10 * this._lastIntValue + digitToInt(this.currentCodePoint)
            this.advance()
        }

        return this.index !== start
    }

    /**
     * Eat the next characters as a `HexDigits` production if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * HexDigits::
     *      HexDigit
     *      HexDigits HexDigit
     * HexDigit:: one of
     *      0 1 2 3 4 5 6 7 8 9 a b c d e f A B C D E F
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatHexDigits(): boolean {
        const start = this.index
        this._lastIntValue = 0
        while (isHexDigit(this.currentCodePoint)) {
            this._lastIntValue =
                16 * this._lastIntValue + digitToInt(this.currentCodePoint)
            this.advance()
        }
        return this.index !== start
    }

    /**
     * Eat the next characters as a `HexDigits` production if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * LegacyOctalEscapeSequence::
     *      OctalDigit [lookahead ∉ OctalDigit]
     *      ZeroToThree OctalDigit [lookahead ∉ OctalDigit]
     *      FourToSeven OctalDigit
     *      ZeroToThree OctalDigit OctalDigit
     * OctalDigit:: one of
     *      0 1 2 3 4 5 6 7
     * ZeroToThree:: one of
     *      0 1 2 3
     * FourToSeven:: one of
     *      4 5 6 7
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatLegacyOctalEscapeSequence(): boolean {
        if (this.eatOctalDigit()) {
            const n1 = this._lastIntValue
            if (this.eatOctalDigit()) {
                const n2 = this._lastIntValue
                if (n1 <= 3 && this.eatOctalDigit()) {
                    this._lastIntValue = n1 * 64 + n2 * 8 + this._lastIntValue
                } else {
                    this._lastIntValue = n1 * 8 + n2
                }
            } else {
                this._lastIntValue = n1
            }
            return true
        }
        return false
    }

    /**
     * Eat the next characters as a `OctalDigit` production if possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * OctalDigit:: one of
     *      0 1 2 3 4 5 6 7
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatOctalDigit(): boolean {
        const cp = this.currentCodePoint
        if (isOctalDigit(cp)) {
            this.advance()
            this._lastIntValue = cp - DIGIT_ZERO
            return true
        }
        this._lastIntValue = 0
        return false
    }

    /**
     * Eat the next characters as the given number of `HexDigit` productions if
     * possible.
     * Set `this._lastIntValue` if it ate the next characters successfully.
     * ```
     * HexDigit:: one of
     *      0 1 2 3 4 5 6 7 8 9 a b c d e f A B C D E F
     * ```
     * @returns `true` if it ate the next characters successfully.
     */
    private eatFixedHexDigits(length: number): boolean {
        const start = this.index
        this._lastIntValue = 0
        for (let i = 0; i < length; ++i) {
            const cp = this.currentCodePoint
            if (!isHexDigit(cp)) {
                this.rewind(start)
                return false
            }
            this._lastIntValue = 16 * this._lastIntValue + digitToInt(cp)
            this.advance()
        }
        return true
    }
}
