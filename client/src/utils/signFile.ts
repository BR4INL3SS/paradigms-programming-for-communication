import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * 
 * @param fileName The filename
 */
const signFile = (fileName: string, startingSize: number) => {
    const pathToFile = path.join(__dirname, '..', 'files', fileName);

    const fileBuffer = fs.readFileSync(pathToFile).subarray(0, startingSize);

    const hash = createHash("md5").update(fileBuffer).digest("hex")

    return hash;
}

export default signFile;