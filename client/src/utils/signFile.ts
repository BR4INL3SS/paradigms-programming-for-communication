import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * 
 * @param fileName The filename
 */
const signFile = (fileName: string) => {
    const pathToFile = path.join(__dirname, '..', 'downloads', fileName);

    const fileBuffer = fs.readFileSync(pathToFile);

    const hash = createHash("md5").update(fileBuffer).digest("hex")

    return hash;
}

export default signFile;