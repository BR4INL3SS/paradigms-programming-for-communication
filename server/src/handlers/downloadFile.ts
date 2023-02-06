import type { Socket } from 'net';

/**
 * 
 * @param fileName 
 * @param startingSize 
 * @param socket 
 */
const downloadFile = (fileName: string, startingSize: number = 0, socket: Socket) => {
    console.log('Let\'s download the file ' + fileName + ' starting ' + startingSize + ' B')
}

export default downloadFile;