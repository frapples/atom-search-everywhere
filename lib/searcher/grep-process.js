'use babel';
import { BufferedProcess } from 'atom';
import path from 'path';
import hasbin from 'hasbin';
import config from '../config';

export default class GrepProcess {
    constructor({commandArgs, cwd, env, parseLine}) {
        let command, args;
        [command, ...args] = commandArgs;
        this.command = command;
        this.args = args;
        this.parseLine = parseLine;
        this.process = null;

        this.options = {
            cwd: cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: env
        };
    }

    run() {
        if (!hasbin.sync(this.command)) {
            return Promise.reject(
                `The command ${this.command} does not exist in the system. Please try again after installation.`);
        }

        return new Promise((resolve, reject) => {
            let listItems = [];
            this.process = new BufferedProcess({
                command: this.command,
                args: this.args,
                options: this.options,
                stdout: (output) => {
                    if (listItems.length > config.maxCandidates) {
                        this.destroy();
                        return;
                    }
                    listItems = listItems.concat(this.parseOutput(output));
                },
                stderr: (error) => {
                    reject(error);
                },
                exit: (code) => {
                    resolve(listItems);
                    if (code == 1) {
                        reject(code);
                    }
                }
            });
        });
    }

    parseOutput(output) {
        return output.split(/\n/)
        .filter(line => line.trim())
        .map((line) => this.parseLine(line));
    }

    destroy() {
        this.process && this.process.kill();
    }
}
