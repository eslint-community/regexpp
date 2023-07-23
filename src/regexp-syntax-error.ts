export class RegExpSyntaxError extends SyntaxError {
    public index: number

    public constructor(
        source: string,
        flags: { unicode: boolean; unicodeSets: boolean },
        index: number,
        message: string,
    ) {
        /*eslint-disable no-param-reassign */
        if (source) {
            if (!source.startsWith("/")) {
                source = `/${source}/${flags.unicode ? "u" : ""}${
                    flags.unicodeSets ? "v" : ""
                }`
            }
            source = `: ${source}`
        }
        /*eslint-enable no-param-reassign */

        super(`Invalid regular expression${source}: ${message}`)
        this.index = index
    }
}
