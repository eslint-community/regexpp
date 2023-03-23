export async function* fetchLines(url: string): AsyncIterable<string> {
    const response = await fetch(url)
    let buffer = ""
    const decoder = new TextDecoder()
    // Already supports AsyncIterable in Node.js v18
    const body = response.body as unknown as AsyncIterable<Uint8Array>
    for await (const chunk of body) {
        const lines = (buffer + decoder.decode(chunk)).split("\n")
        if (lines.length === 1) {
            buffer = lines[0]
        } else {
            buffer = lines.pop()!
            for (const line of lines) {
                yield line
            }
        }
    }
    yield buffer
}
