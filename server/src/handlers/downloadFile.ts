import type { Socket } from 'net';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * 
 * @param fileName 
 * @param startingSize 
 * @param socket 
 */
const downloadFile = (fileName: string, startingSize: number = 0, socket: Socket) => {
    console.log('Downloading ' + fileName + ' starting from ' + startingSize + ' B');
    const obj = {
        command: 'download:file',
        data: `${fileName} ${readFileSync(path.join(__dirname, '..', 'files', fileName)).subarray(startingSize).toString('base64')}`,
    };
    socket.write(JSON.stringify(obj));
}

export default downloadFile;