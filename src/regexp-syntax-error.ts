import type { RegExpValidatorSourceContext } from "./validator"

export class RegExpSyntaxError extends SyntaxError {
    public index: number

    public constructor(
        srcCtx: RegExpValidatorSourceContext,
        flags: { unicode: boolean; unicodeSets: boolean },
        index: number,
        message: string,
    ) {
        let source = ""
        if (srcCtx.kind === "literal") {
            const literal = srcCtx.source.slice(srcCtx.start, srcCtx.end)
            if (literal) {
                source = `: ${literal}`
            }
        } else if (srcCtx.kind === "pattern") {
            const pattern = srcCtx.source.slice(srcCtx.start, srcCtx.end)
            const flagsText = `${flags.unicode ? "u" : ""}${
                flags.unicodeSets ? "v" : ""
            }`
            source = `: /${pattern}/${flagsText}`
        }

        super(`Invalid regular expression${source}: ${message}`)
        this.index = index
    }
}
