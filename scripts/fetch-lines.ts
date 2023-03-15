import https from "https"

export function fetchLines(url: string): AsyncIterable<string> {
    const linesBuffer: Promise<IteratorResult<string>>[] = []

    let resolve: (val: IteratorResult<string>) => void = () => {
            // empty function
        },
        reject: (reason?: any) => void = resolve

    function pushNext() {
        linesBuffer.push(
            new Promise<IteratorResult<string>>((res, rej) => {
                resolve = res
                reject = rej
            }),
        )
    }

    function resolveLine(line: string) {
        resolve({ value: line })
        pushNext()
    }

    pushNext()

    const itr: AsyncIterable<string> = {
        [Symbol.asyncIterator](): AsyncIterator<string> {
            return {
                next(): Promise<IteratorResult<string>> {
                    return linesBuffer.shift()!
                },
            }
        },
    }
    https
        .get(url, (res) => {
            let buffer = ""
            res.setEncoding("utf8")
            res.on("data", (chunk) => {
                const lines = (buffer + String(chunk)).split("\n")
                if (lines.length === 1) {
                    buffer = lines[0]
                } else {
                    buffer = lines.pop()!
                    for (const line of lines) {
                        resolveLine(line)
                    }
                }
            })
            res.on("end", () => {
                if (buffer) {
                    resolveLine(buffer)
                }
                resolve({ done: true, value: undefined })
            })
            res.on("error", (e) => {
                reject(e)
            })
        })
        .on("error", (e) => {
            reject(e)
        })

    return itr
}
