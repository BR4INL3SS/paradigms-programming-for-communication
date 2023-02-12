import type { Socket } from 'net';
import fs from 'fs';
import path from 'path';

const listFiles = (socket: Socket) => {
    const files = fs.readdirSync(path.join(__dirname, '..', 'files'), { withFileTypes: true });
    const obj = {
        command: 'list:response',
        data: `\n\x1b[1mFiles available for download:\x1b[0m\n---------\n${files.map(s => s.name).join('\n')}\n---------\n`,
    }
    socket.write(JSON.stringify(obj));
}

export default listFiles;