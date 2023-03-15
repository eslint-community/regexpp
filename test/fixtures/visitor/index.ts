import fs from "fs"
import path from "path"
import type { EcmaVersion } from "../../../src/ecma-versions"

type FixtureData = Record<
    string,
    {
        options: {
            strict?: boolean
            ecmaVersion?: EcmaVersion
        }
        patterns: Record<string, string[]>
    }
>
const fixturesRoot = __dirname

export const fixturesData: FixtureData = fs
    .readdirSync(fixturesRoot)
    .filter((filename) => path.extname(filename) === ".json")
    .reduce<FixtureData>((fixtures, filename) => {
        fixtures[filename] = JSON.parse(
            fs.readFileSync(path.join(fixturesRoot, filename), "utf8"),
            (_, v: unknown) => (v === "$$Infinity" ? Infinity : v),
        ) as FixtureData[string]
        return fixtures
    }, {})
export function save(): void {
    for (const filename of Object.keys(fixturesData)) {
        fs.writeFileSync(
            path.join(fixturesRoot, filename),
            JSON.stringify(
                fixturesData[filename],
                (_, v: unknown) => (v === Infinity ? "$$Infinity" : v),
                2,
            ),
        )
    }
}
