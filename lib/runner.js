'use babel';
import { BufferedProcess } from 'atom';

export default class Runner {
    constructor() {
        this.env = process.env;
        this.grepProcess = null;
    }

    get useGitGrep() {
        return atom.config.get('atom-search-everywhere.detectGitProjectAndUseGitGrep');
    }

    get maxCandidates() {
        return atom.config.get('atom-search-everywhere.maxCandidates');
    }

    getCommandString(isGitRepo) {
        return isGitRepo ?
        atom.config.get('atom-search-everywhere.gitGrepCommandString') :
        atom.config.get('atom-search-everywhere.grepCommandString');
    }

    run(search, rootPath) {
        this.destroy();
        const commandString = this.getCommandString(this.useGitGrep && this.isGitRepo(rootPath));
        const isColumnArg = this.detectColumnFlag(commandString);
        let commandArgs = commandString.split(/\s/).concat([search]);

        this.grepProcess = new GrepProcess({
            commandArgs: commandArgs,
            cwd: rootPath,
            env: this.env,
            parseLine: (lineContext) => {
                const contentRegexp = isColumnArg ? /^(\d+):\s*/ : /^\s+/;
                let path, line, content;
                [path, line, ...content] = lineContext.split(':');
                content = content.join(':');
                return {
                    filePath: path,
                    fullPath: rootPath + '/' + path,
                    line: line - 1,
                    column: this.getColumn(isColumnArg, search, content),
                    content: content.replace(contentRegexp, '')
                };
            }
        });
        return this.grepProcess.run();
    }

    detectColumnFlag(commandString) {
        return /(ag|pt|ack|rg)$/.test(commandString.split(/\s/)[0])
        && commandString.indexOf('--column');
    }

    isGitRepo(rootPath) {
        return atom.project.getRepositories().some((repo) => {
            if (rootPath && repo) {
                return rootPath.startsWith(repo.getWorkingDirectory());
            } else {
                return false;
            }
        });
    }

    destroy() {
        this.grepProcess && this.grepProcess.destroy();
    }

    getColumn(isColumnArg, search, content) {
        if (isColumnArg) {
            const match = content.match(/^(\d+):/);
            return match ? match[1] - 1 : 0;
        } else {
            const match = content.match(new RegExp(search, 'gi'));
            return match ? content.indexOf(match[0]) : 0;
        }
    }
}

class GrepProcess {
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
        return new Promise((resolve, reject) => {
            let listItems = [];
            this.process = new BufferedProcess({
                command: this.command,
                args: this.args,
                options: this.options,
                stdout: (output) => {
                    if (listItems.length > this.maxCandidates) {
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
