import fs from "fs"
import { ESLint } from "eslint"
import { fetchLines } from "./fetch-lines"

const DB_URL = "https://unicode.org/Public/UNIDATA/DerivedCoreProperties.txt"
const FILE_PATH = "src/unicode/ids.ts"
const ID_START = /^([0-9a-z]+)(?:\.\.([0-9a-z]+))?[^;]*; ID_Start /iu
const ID_CONTINUE = /^([0-9a-z]+)(?:\.\.([0-9a-z]+))?[^;]*; ID_Continue /iu
const BORDER = 0x7f
const logger = console

// Main
const main = async () => {
    let banner = ""
    const idStartSet = new Set<string>()
    const idStartSmall: [number, number][] = []
    const idStartLarge: [number, number][] = []
    const idContinueSmall: [number, number][] = []
    const idContinueLarge: [number, number][] = []

    logger.log("Fetching data... (%s)", DB_URL)
    for await (const line of fetchLines(DB_URL)) {
        let m: RegExpExecArray | null = null
        if (banner === "") {
            logger.log("Processing data... (%s)", line.slice(2))
            banner = `/* Generated from ${line.slice(2)} */`
        } else if ((m = ID_START.exec(line)) != null) {
            const min = parseInt(m[1], 16)
            const max = m[2] ? parseInt(m[2], 16) : min
            if (max <= BORDER) {
                idStartSmall.push([min, max])
            } else {
                idStartSet.add(`${min}..${max}`)
                idStartLarge.push([min, max])
            }
        } else if ((m = ID_CONTINUE.exec(line)) != null) {
            const min = parseInt(m[1], 16)
            const max = m[2] ? parseInt(m[2], 16) : min
            if (max <= BORDER) {
                idContinueSmall.push([min, max])
            } else if (!idStartSet.has(`${min}..${max}`)) {
                idContinueLarge.push([min, max])
            }
        }
    }

    logger.log("Normalizing data...")
    normalizeRanges(idStartSmall)
    normalizeRanges(idStartLarge)
    normalizeRanges(idContinueSmall)
    normalizeRanges(idContinueLarge)

    logger.log("Generating code...")
    let code = `${banner}

// Each two-element represents a range.
// Even indices are minimum values and odd indices are maximum values.
let largeIdStartRanges: number[] | undefined = undefined
let largeIdContinueRanges: number[] | undefined = undefined

export function isIdStart(cp: number): boolean {
    ${makeSmallCondition(idStartSmall)}
    return isLargeIdStart(cp)
}

export function isIdContinue(cp: number): boolean {
    ${makeSmallCondition(idContinueSmall)}
    return isLargeIdStart(cp) || isLargeIdContinue(cp)
}

function isLargeIdStart(cp: number): boolean {
    return isInRange(cp, largeIdStartRanges ?? (largeIdStartRanges = initLargeIdStartRanges()))
}

function isLargeIdContinue(cp: number): boolean {
    return isInRange(cp, largeIdContinueRanges ?? (largeIdContinueRanges = initLargeIdContinueRanges()))
}

function initLargeIdStartRanges(): number[] {
    ${makeInitLargeIdRanges(idStartLarge)}
}

function initLargeIdContinueRanges(): number[] {
    ${makeInitLargeIdRanges(idContinueLarge)}
}

function isInRange(cp: number, ranges: number[]): boolean {
    let l = 0, r = ranges.length / 2 | 0, i = 0, min = 0, max = 0
    while (l < r) {
        i = (l + r) / 2 | 0
        min = ranges[2 * i]
        max = ranges[2 * i + 1]
        if (cp < min) {
            r = i
        } else if (cp > max) {
            l = i + 1
        } else {
            return true
        }
    }
    return false
}

function restoreRanges(data: string): number[] {
    let last = 0
    return data.split(" ").map(s => (last += parseInt(s, 36) | 0))
}
`

    logger.log("Formatting code...")
    const engine = new ESLint({
        fix: true,
        baseConfig: { rules: { curly: "off" } },
    })
    const [result] = await engine.lintText(code, { filePath: FILE_PATH })
    code = result.output ?? code

    logger.log("Writing '%s'...", FILE_PATH)
    await save(code)

    logger.log("Completed!")
}

main().catch((err) => {
    const error = err as Error
    logger.error(error.stack)
    process.exitCode = 1
})

function normalizeRanges(ranges: [number, number][]): void {
    for (let i = ranges.length - 1; i >= 1; --i) {
        const currRange = ranges[i]
        const prevRange = ranges[i - 1]
        if (currRange[0] - 1 === prevRange[1]) {
            prevRange[1] = currRange[1]
            ranges.splice(i, 1)
        }
    }
}

function makeSmallCondition(ranges: [number, number][]): string {
    const conditions: string[] = []
    for (const [min, max] of ranges) {
        if (min === max) {
            conditions.push(`if (cp === 0x${min.toString(16)}) return true`)
        } else {
            conditions.push(`if (cp < 0x${min.toString(16)}) return false`)
            conditions.push(`if (cp < 0x${(max + 1).toString(16)}) return true`)
        }
    }
    return conditions.join("\n")
}

function makeInitLargeIdRanges(ranges: [number, number][]): string {
    const diffs: string[] = []
    let last = 0
    for (const [min, max] of ranges) {
        diffs.push((min - last).toString(36), (max - min).toString(36))
        last = max
    }
    return `return restoreRanges("${diffs.join(" ")}")`
}

function save(content: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(FILE_PATH, content, (error) => {
            if (error) {
                reject(error)
            } else {
                resolve()
            }
        })
    })
}
