import { blueBright, bold, greenBright, magentaBright, redBright } from "chalk";
import { spawn, exec as childExec } from "child_process";
import util from "util";

const exec = util.promisify(childExec);

export const executeCommand = <T extends boolean = false>(
    command: string,
    saveOutput?: T
): Promise<T extends true ? string : void> => {
    if (!saveOutput) console.log(`\n${blueBright("Executing command:")} ${command}\n`);

    return new Promise((resolve, reject) => {
        const process = spawn(command, [], {
            stdio: saveOutput ? "pipe" : "inherit",
            shell: true,
        });

        let output = "";
        if (saveOutput) {
            process.stdout?.on("data", (data) => {
                output += data.toString();
            });
            process.stderr?.on("data", (data) => {
                output += data.toString();
            });
        }

        process.on("close", (code) => {
            if (code === 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resolve(saveOutput ? (output as any) : undefined);
            } else {
                const error = new Error(`Process exited with code ${code}.`);
                reject(error);
            }
        });
        process.on("error", (error) => {
            reject(error);
        });
    });
};

// execute a command & get the output
export const captureCommandOutput = async (cmd: string) => {
    try {
        const { stdout, stderr } = await exec(cmd);
        if (stderr) {
            console.error(`exec error: ${JSON.stringify(stderr)}`);
            console.log(`stderr: ${stderr}`);
        }
        return stdout && stdout.length > 0 ? stdout.trim() : "success";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        // console.info(err)
        console.log(magentaBright(`\n Error - ${JSON.stringify(err.stderr)}\n`));
    }
    return null;
};

export const freePort = async (port: number) => {
    const processId = await executeCommand(
        `lsof -i :${port} | grep LISTEN | awk '{print $2}'`,
        true
    );
    if (processId) {
        try {
            await executeCommand(`kill -9 ${processId}`, true);
            console.log(greenBright(`\nFreed port ${port}!`));
        } catch {
            console.log(redBright(`\n🛑 Failed to free port ${port}.`));
            bye();
        }
    }
};

export const bye = (exitCode: number = 1) => {
    // default exit code is 1 to indicate error pass 0 to exit gracefully
    if (exitCode === 0) {
        console.log(bold(magentaBright("\nGoodbye! 👋\n")));
    } else {
        console.log("");
    }
    process.exit(exitCode);
};
