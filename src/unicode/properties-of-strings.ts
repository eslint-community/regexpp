const binPropertyOfStringSets = new Set([
    "Basic_Emoji",
    "Emoji_Keycap_Sequence",
    "RGI_Emoji_Modifier_Sequence",
    "RGI_Emoji_Flag_Sequence",
    "RGI_Emoji_Tag_Sequence",
    "RGI_Emoji_ZWJ_Sequence",
    "RGI_Emoji",
])

export function isValidLoneUnicodePropertyOfString(
    version: number,
    value: string,
): boolean {
    return version >= 2024 && binPropertyOfStringSets.has(value)
}
