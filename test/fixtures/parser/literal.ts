import fs from "fs"
import path from "path"
import type { EcmaVersion } from "../../../src/ecma-versions"

type FixtureData = Record<
    string,
    {
        options: {
            strict: boolean
            ecmaVersion: EcmaVersion
        }
        patterns: Record<
            string,
            { ast: object } | { error: { message: string; index: number } }
        >
    }
>

export const fixturesData: FixtureData = {}
const fixturesRoot = path.join(__dirname, "literal")
for (const filename of extractFixtureFiles(fixturesRoot)) {
    fixturesData[filename] = JSON.parse(
        fs.readFileSync(path.join(fixturesRoot, filename), "utf8"),
        (_, v: unknown) => (v === "$$Infinity" ? Infinity : v),
    ) as FixtureData[string]
}

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

function* extractFixtureFiles(dir: string): Iterable<string> {
    for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (dirent.isDirectory()) {
            for (const name of extractFixtureFiles(
                path.join(dir, dirent.name),
            )) {
                yield path.join(dirent.name, name)
            }
        } else if (dirent.name.endsWith(".json")) {
            yield dirent.name
        }
    }
}
