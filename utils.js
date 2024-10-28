import basex from 'base-x'
import {createDecipheriv, createHash} from 'node:crypto'

const mixBase = basex('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')

const key = hashMd5("123")

export function decodeMixFile(data){
    const encData = mixBase.decode(data)
    if (!encData){
        return null
    }
    const dData = decrypt(encData,key).toString()
    try {
        return JSON.parse(dData)
    } catch (e){
        // console.log(e)
    }
}


function hashMd5(data) {
    const hash = createHash('md5');

    hash.update(data, 'utf-8');

    return hash.digest();
}

function decrypt(encryptedData, key) {
    try {
        const iv = encryptedData.slice(0, 12);
        const authTag = encryptedData.slice(encryptedData.length - 12);
        const ciphertext = encryptedData.slice(12, encryptedData.length - 12);

        const decipher = createDecipheriv('aes-128-gcm', key, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([
            decipher.update(ciphertext),
            decipher.final()
        ]);
    } catch (e) {
        // console.log(e)
        return "";
    }
}
