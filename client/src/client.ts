import net from "net"
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs, { existsSync, readFileSync, statSync } from "fs";
import path from 'path';
import signFile from "./utils/signFile";

const rl = readline.createInterface({ input, output });

const client = new net.Socket();

const connectionOptions = {
    host: "localhost",
    port: 59090,
}

client.connect(connectionOptions, async () => {
    /**
     * Menu-Like
     */
    console.log('\nTo list downloadable files Enter --> list');
    console.log('To download a file Enter --> download <filename.ext>');
    console.log('To upload a file Enter --> upload <filename.ext>\n');

    /**
     * Prompt
     */
    let command = await rl.question('What do you want to do? ');
    while (!command.startsWith('download ') && !command.startsWith('upload ') && command !== 'list') {
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
        // If it exists we send the already existing size
        const fileName = command.split(' ')[1];
        const pathToFile = path.join(__dirname, 'files', fileName);

        client.write(JSON.stringify({
            command: 'download:request',
            data: `${fileName} ${fs.existsSync(pathToFile) ? fs.statSync(pathToFile).size : ''}`.trim(),
        }));

    } else if (command.startsWith('upload ')) {
        // In this case we want to upload a certain file
        // We check for its existence first
        const fileName = command.split(' ')[1];
        const pathToFile = path.join(__dirname, 'files', fileName);

        if (existsSync(pathToFile)) {
            client.write(JSON.stringify({
                command: 'upload:request',
                data: fileName,
            }));
        } else {
            console.log(`File ${fileName} doesn't exist... Exiting...`)
        }
    }


    rl.close();
});

client.on("data", (data) => {
    const result: { command: string, data: Buffer | string | null } = JSON.parse(data.toString('utf-8'));

    switch (result.command) {
        case 'list:response':
            console.log(result.data);
            client.end();
            break;

        case 'download:signature':
            var [fileName, signature] = (result.data as string).split(' ');
            const pathToFile = path.join(__dirname, 'files', fileName);
            if (signFile(fileName, statSync(pathToFile).size) !== signature) {
                console.clear();
                console.log(`file ${fileName} has become dirty or stale deleting and re-downloading...`)
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

            fs.writeFileSync(path.join(__dirname, 'files', fileName), Buffer.from(fileBuffer, "base64"), { flag: 'a+' });
            client.end();

            break;

        case 'upload:signature':
            var [fileName, startingSize, signature] = (result.data as string).split(' ');
            var pathToFileUpload = path.join(__dirname, 'files', fileName);
            if (startingSize === '0') {
                client.write(JSON.stringify({
                    command: 'upload:file',
                    data: `${fileName} OK ${readFileSync(pathToFileUpload).subarray(parseInt(startingSize)).toString('base64')}`,
                }));
            } else {
                if (signFile(fileName, parseInt(startingSize)) !== signature) {
                    console.log(`File ${fileName} on the server machine has become dirty/stale... re-uploading...`)
                    client.write(JSON.stringify({
                        command: 'upload:file',
                        data: `${fileName} N ${readFileSync(pathToFileUpload).toString('base64')}`,
                    }));

                }
                else {
                    console.log(`File ${fileName} already found and is not dirty/stale... resuming...`)
                    client.write(JSON.stringify({
                        command: 'upload:file',
                        data: `${fileName} OK ${readFileSync(pathToFileUpload).subarray(parseInt(startingSize)).toString('base64')}`,
                    }));
                }
            }

            break;

        default:
            break;
    }
});

client.on("error", (err) => console.log(`Error: ${err.message}`))