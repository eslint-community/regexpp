import fs from "fs"
import path from "path"

type FixtureData = Record<
    string,
    {
        options: {
            strict: boolean
            ecmaVersion:
                | 5
                | 2015
                | 2016
                | 2017
                | 2018
                | 2019
                | 2020
                | 2021
                | 2022
        }
        patterns: Record<
            string,
            { ast: object } | { error: { message: string; index: number } }
        >
    }
>

export const fixturesData: FixtureData = {}
const fixturesRoot = path.join(__dirname, "literal")
for (const filename of fs.readdirSync(fixturesRoot)) {
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
