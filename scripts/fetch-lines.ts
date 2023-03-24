export async function* fetchLines(url: string): AsyncIterable<string> {
    const response = await fetch(url)
    yield* (await response.text()).split("\n")
}
