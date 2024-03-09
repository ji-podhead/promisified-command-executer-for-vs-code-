const cp = require('child_process');
const util = require('util');
const path = require('path');
const vscode = require('vscode');

// Promisify cp.spawn
const spawn = util.promisify(cp.spawn);

class CommandExecutor {
    constructor() {
        this.terminal = null;
    }

    initialize() {
        if (!this.terminal) {
            this.terminal = vscode.window.createTerminal({
                name: "Command Execution",
                cwd: vscode.workspace.workspaceFolders[0].uri.fsPath
            });
            this.terminal.show();
        }
    }

    dispose() {
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = null;
        }
    }

    async runCommands(commands) {
        this.initialize();
        for (const command of commands) {
            await this.executeCommand(command);
        }
        this.dispose();
    }

    async executeCommand(command) {
        this.terminal.sendText(command);

        return new Promise((resolve, reject) => {
            const child = cp.spawn('bash', ['-c', command], {
                cwd: vscode.workspace.workspaceFolders[0].uri.fsPath
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data;
                this.terminal.sendText(data.toString());
            });

            child.stderr.on('data', (data) => {
                stderr += data;
                this.terminal.sendText(data.toString());
            });

            child.on('error', (error) => {
                reject(error);
            });

            child.on('exit', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    }
}

// Beispielverwendung
const commandExecutor = new CommandExecutor();
const commands = ['echo "Hello, World!"', 'sleep 2 && ls -la'];
commandExecutor.runCommands(commands).then(() => {
    console.log('All commands executed successfully.');
}).catch(error => {
    console.error('Error executing commands:', error);
});
