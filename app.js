// Typescript
import {v2 as webdav} from 'webdav-server'
import axios from "axios";
import {decodeMixFile} from "./utils.js";
import {API_BASE, SERVER_PORT} from "./config.js";


const server = new webdav.WebDAVServer({
    port: SERVER_PORT,
    autoSave: { // Will automatically save the changes in the 'webdav.dat' file
        treeFilePath: 'wevdav.dat'
    }
});
try {
    await server.autoLoadAsync()
} catch (e) {
}

const system = server.rootFileSystem()

const originOpenRead = system._openReadStream

async function readText(readable) {
    let result = '';
    for await (const chunk of readable) {
        result += chunk;
    }
    return result
}

system._openReadStream = function (...args) {
    const [path, context, callback] = args
    const serverResponse = context.context.response
    args[2] = async function (...args) {
        try {
            const [, readable] = args
            let shareCode = await readText(readable)
            const clientHeaders = context.context.request.headers
            const response = await client.get(`download?s=${shareCode}`, {
                responseType: 'stream',
                headers: {
                    range: clientHeaders.range
                }
            })
            const mixHeaders = response.headers
            serverResponse.statusCode = response.status
            for (const key in mixHeaders) {
                serverResponse.setHeader(key, mixHeaders[key])
            }
            serverResponse.setHeader('x-mix-code', shareCode)
            await response.data.pipe(serverResponse)
        } catch (e) {
            console.log(e)
        }
    }
    return originOpenRead.apply(system, args)
}

const oOpenWrite = system._openWriteStream

system._size = function (...args) {
    const [path, context, callback] = args
    originOpenRead.apply(system, [path, context, async (_, readable) => {
        const code = await readText(readable)
        const size = decodeMixFile(code)?.s ?? 0
        callback(null, size)
    }])
}

const client = await axios.create({
    baseURL: API_BASE,
    timeout: 1000 * 60 * 60 * 24
})

system._openWriteStream = function (...args) {
    const [path, context, callback] = args
    const fileSize = context.estimatedSize
    const fileName = path.paths.at(-1)
    const readStream = context.context.request
    args[2] = async function (...args) {
        try {
            const [, writable] = args
            const response = await client.put(`upload?name=${fileName}`, readStream, {
                headers: {
                    "Content-Length": fileSize
                }
            })
            const shareCode = response.data
            writable.write(shareCode)
            callback(...args)
            console.log(`文件上传成功: ${shareCode}`)
        } catch (e) {
            console.log(e)
        }
    }
    return oOpenWrite.apply(system, args)
}


server.start(httpServer => {
    console.log('MixFileWebDAV已启动: ' + httpServer.address().port);
});
