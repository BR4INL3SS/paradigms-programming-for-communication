import net from "net";
import { existsSync } from 'fs';
import path from 'path';
import downloadFile from "./handlers/downloadFile";
import listFiles from "./handlers/listFiles";
import signFile from "./utils/signFile";

const PORT = 59090;

const server = net.createServer();

server.on('connection', (socket) => {
    /**
     * Connection initiated
     */
    console.log(`Connection initiated from ${socket.remoteAddress}:${socket.remotePort}`);

    /**
     * Socket connection closed
     */
    socket.on("close", () => {
        console.log(`Connection closed from ${socket.remoteAddress}:${socket.remotePort}`);
    });
    
    /**
     * Connection closed unexpectedly or any other error;
    */
    socket.on("error", (err) => {
        console.log(`Error: ${err.message}`)
        socket.destroy();
    });

    /**
     * On Incoming data
     */
    socket.on("data", (data) => {
        const obj: { command: string, data: Buffer | string | null } = JSON.parse(data.toString("utf-8"));
        switch (obj.command) {
            case 'list':
                listFiles(socket);
                break;
            
            case 'download:request':
                if (typeof obj.data === 'string' && obj.data.split(' ').length) {
                    // At this point we know that the client sent a download request
                    // with 1 or more parameters. So 2 cases: send the whole file or send
                    // the remaining bytes to save bandwidth.
                    
                    const [fileName, startingSize] = obj.data.split(' ');

                    // Let's check the input from the client first
                    if(startingSize && Number.isNaN(parseInt(startingSize)))
                        socket.destroy(new Error("Invalid file size"))

                    // First we check if the file exists
                    if(!existsSync(path.join(__dirname, 'files', fileName)))
                        socket.destroy(new Error("File not found"), )

                    // Then we check whether we have to send the whole file or slice
                    // and send a smaller chunk
                    if (!startingSize) {
                        // In this case we send the whole file;
                        downloadFile(fileName, 0, socket);
                    } else {
                        socket.write(JSON.stringify({
                            command: 'download:signature',
                            data: `${fileName} ${signFile(fileName, parseInt(obj.data.split(' ')[2]))}`,
                        }));
                    }
                } else socket.destroy(new Error("Invalid command"));
                break;

            case 'download:start':
                const [fileName, startingSize] = (obj.data as string).split(' ');

                if(Number.isNaN(parseInt(startingSize)))
                    socket.destroy(new Error("Invalid starting size"));

                downloadFile(fileName, parseInt(startingSize), socket);
                break;
        
            default:
                socket.destroy(new Error("Invalid command"))
                break;
        }
        socket.end();
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
});