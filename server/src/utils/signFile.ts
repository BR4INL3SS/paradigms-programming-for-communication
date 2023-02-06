import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * @param fileName name of the file to download
 * @param size size of the file already on the client's storage path
 * @returns The hash of the size found in the client's storage path
 */
const signFile = (fileName: string, size: number) => {
    const pathToFile = path.join(__dirname, '..', 'files', fileName);

    const fileBuffer = fs.readFileSync(pathToFile).subarray(size);

    const hash = createHash("md5").update(fileBuffer).digest("hex")

    return hash;
}

export default signFile;