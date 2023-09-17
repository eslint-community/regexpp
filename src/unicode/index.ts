export { isIdContinue, isIdStart } from "./ids"
export {
    isValidLoneUnicodeProperty,
    isValidUnicodeProperty,
    isValidLoneUnicodePropertyOfString,
} from "./properties"

export const NULL = 0x00
export const BACKSPACE = 0x08
export const CHARACTER_TABULATION = 0x09
export const LINE_FEED = 0x0a
export const LINE_TABULATION = 0x0b
export const FORM_FEED = 0x0c
export const CARRIAGE_RETURN = 0x0d
export const EXCLAMATION_MARK = 0x21
export const NUMBER_SIGN = 0x23
export const DOLLAR_SIGN = 0x24
export const PERCENT_SIGN = 0x25
export const AMPERSAND = 0x26
export const LEFT_PARENTHESIS = 0x28
export const RIGHT_PARENTHESIS = 0x29
export const ASTERISK = 0x2a
export const PLUS_SIGN = 0x2b
export const COMMA = 0x2c
export const HYPHEN_MINUS = 0x2d
export const FULL_STOP = 0x2e
export const SOLIDUS = 0x2f
export const DIGIT_ZERO = 0x30
export const DIGIT_ONE = 0x31
export const DIGIT_SEVEN = 0x37
export const DIGIT_NINE = 0x39
export const COLON = 0x3a
export const SEMICOLON = 0x3b
export const LESS_THAN_SIGN = 0x3c
export const EQUALS_SIGN = 0x3d
export const GREATER_THAN_SIGN = 0x3e
export const QUESTION_MARK = 0x3f
export const COMMERCIAL_AT = 0x40
export const LATIN_CAPITAL_LETTER_A = 0x41
export const LATIN_CAPITAL_LETTER_B = 0x42
export const LATIN_CAPITAL_LETTER_D = 0x44
export const LATIN_CAPITAL_LETTER_F = 0x46
export const LATIN_CAPITAL_LETTER_P = 0x50
export const LATIN_CAPITAL_LETTER_S = 0x53
export const LATIN_CAPITAL_LETTER_W = 0x57
export const LATIN_CAPITAL_LETTER_Z = 0x5a
export const LOW_LINE = 0x5f
export const LATIN_SMALL_LETTER_A = 0x61
export const LATIN_SMALL_LETTER_B = 0x62
export const LATIN_SMALL_LETTER_C = 0x63
export const LATIN_SMALL_LETTER_D = 0x64
export const LATIN_SMALL_LETTER_F = 0x66
export const LATIN_SMALL_LETTER_G = 0x67
export const LATIN_SMALL_LETTER_I = 0x69
export const LATIN_SMALL_LETTER_K = 0x6b
export const LATIN_SMALL_LETTER_M = 0x6d
export const LATIN_SMALL_LETTER_N = 0x6e
export const LATIN_SMALL_LETTER_P = 0x70
export const LATIN_SMALL_LETTER_Q = 0x71
export const LATIN_SMALL_LETTER_R = 0x72
export const LATIN_SMALL_LETTER_S = 0x73
export const LATIN_SMALL_LETTER_T = 0x74
export const LATIN_SMALL_LETTER_U = 0x75
export const LATIN_SMALL_LETTER_V = 0x76
export const LATIN_SMALL_LETTER_W = 0x77
export const LATIN_SMALL_LETTER_X = 0x78
export const LATIN_SMALL_LETTER_Y = 0x79
export const LATIN_SMALL_LETTER_Z = 0x7a
export const LEFT_SQUARE_BRACKET = 0x5b
export const REVERSE_SOLIDUS = 0x5c
export const RIGHT_SQUARE_BRACKET = 0x5d
export const CIRCUMFLEX_ACCENT = 0x5e
export const GRAVE_ACCENT = 0x60
export const LEFT_CURLY_BRACKET = 0x7b
export const VERTICAL_LINE = 0x7c
export const RIGHT_CURLY_BRACKET = 0x7d
export const TILDE = 0x7e
export const ZERO_WIDTH_NON_JOINER = 0x200c
export const ZERO_WIDTH_JOINER = 0x200d
export const LINE_SEPARATOR = 0x2028
export const PARAGRAPH_SEPARATOR = 0x2029

export const MIN_CODE_POINT = 0x00
export const MAX_CODE_POINT = 0x10ffff

export function isLatinLetter(code: number): boolean {
    return (
        (code >= LATIN_CAPITAL_LETTER_A && code <= LATIN_CAPITAL_LETTER_Z) ||
        (code >= LATIN_SMALL_LETTER_A && code <= LATIN_SMALL_LETTER_Z)
    )
}

export function isDecimalDigit(code: number): boolean {
    return code >= DIGIT_ZERO && code <= DIGIT_NINE
}

export function isOctalDigit(code: number): boolean {
    return code >= DIGIT_ZERO && code <= DIGIT_SEVEN
}

export function isHexDigit(code: number): boolean {
    return (
        (code >= DIGIT_ZERO && code <= DIGIT_NINE) ||
        (code >= LATIN_CAPITAL_LETTER_A && code <= LATIN_CAPITAL_LETTER_F) ||
        (code >= LATIN_SMALL_LETTER_A && code <= LATIN_SMALL_LETTER_F)
    )
}

export function isLineTerminator(code: number): boolean {
    return (
        code === LINE_FEED ||
        code === CARRIAGE_RETURN ||
        code === LINE_SEPARATOR ||
        code === PARAGRAPH_SEPARATOR
    )
}

export function isValidUnicode(code: number): boolean {
    return code >= MIN_CODE_POINT && code <= MAX_CODE_POINT
}

export function digitToInt(code: number): number {
    if (code >= LATIN_SMALL_LETTER_A && code <= LATIN_SMALL_LETTER_F) {
        return code - LATIN_SMALL_LETTER_A + 10
    }
    if (code >= LATIN_CAPITAL_LETTER_A && code <= LATIN_CAPITAL_LETTER_F) {
        return code - LATIN_CAPITAL_LETTER_A + 10
    }
    return code - DIGIT_ZERO
}

export function isLeadSurrogate(code: number): boolean {
    return code >= 0xd800 && code <= 0xdbff
}

export function isTrailSurrogate(code: number): boolean {
    return code >= 0xdc00 && code <= 0xdfff
}

export function combineSurrogatePair(lead: number, trail: number): number {
    return (lead - 0xd800) * 0x400 + (trail - 0xdc00) + 0x10000
}
