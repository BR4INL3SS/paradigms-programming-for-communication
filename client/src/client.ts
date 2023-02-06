import net from "net"
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from "fs";
import path from 'path';
import signFile from "./utils/signFile";

const rl = readline.createInterface({ input, output });

const client = new net.Socket();

const connectionOptions = {
    host: process.argv[2] ?? "localhost",
    port: process.argv[3] ? parseInt(process.argv[3]) : 59090,
}

client.connect(connectionOptions, async () => {
    /**
     * Menu-Like
     */
    console.log('\nTo download a file Enter --> download <filename.ext>');
    console.log('To list downloadable files Enter --> list\n');

    /**
     * Prompt
     */
    let command = await rl.question('What do you want to do? ');
    while (!command.startsWith('download ') && command !== 'list') {
        console.log(`${command} is not a valid command`);
        command = await rl.question('What do you want to do? ');
    }

    if (command === 'list') {
        client.write(JSON.stringify({
            command,
        }));
    } else if (command.startsWith('download ')) {
        // In this case we want to download a certain file
        // We check for its existence first
        const fileName = command.split(' ')[1];
        const pathToFile = path.join(__dirname, 'downloads', fileName);

        client.write(JSON.stringify({
            command: 'download:request',
            data: `${fileName} ${fs.existsSync(pathToFile) ? fs.statSync(pathToFile).size : ''}`.trim(),
        }));
    }


    rl.close();
});

client.on("data", (data) => {
    const result: { command: string, data: Buffer | string | null } = JSON.parse(data.toString('utf-8'));

    switch (result.command) {
        case 'list.response':
            console.log(result.data);
            break;

        case 'download:signature':
            var [fileName, signature] = (result.data as string).split(' ');
            const pathToFile = path.join(__dirname, 'downloads', fileName);
            if (signFile(fileName) !== signature) {
                fs.unlinkSync(pathToFile);
                client.write(JSON.stringify({
                    command: 'download:request',
                    data: `${fileName}`,
                }));
            } else {
                client.write(JSON.stringify({
                    command: 'download:start',
                    data: `${fileName} ${fs.statSync(pathToFile).size}`,
                }));
            }
            break;

        case 'download:file':
            var [fileName, fileBuffer] = (result.data as string).split(' ');

            fs.writeFileSync(path.join(__dirname, 'downloads', fileName), Buffer.from(fileBuffer, "base64"), {flag: 'a+'});

            break;

        default:
            break;
    }
});

client.on("error", (err) => console.log(`Error: ${err.message}`))