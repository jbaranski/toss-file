/**
 * @author Jeff Baranski <jeff.baranski@outlook.com>
 * @license MIT (see LICENSE in project root for more info)
 *
 * Visual Studio Code plugin for copying the current file to new pre-mapped locations
 *
 */
const vscode = require('vscode');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const fse = require('fs-extra');

class TossFile {
    constructor(statusBar) {
        this.statusBar = statusBar;
        this.count = 0;
    }

    set settings(settings) {
        this.pathMapping = settings.get('pathMapping', []);
        this.statusTimeout = settings.get('statusTimeout', 5);
        this.replaceIfExists = settings.get('replaceIfExists', true);
    }

    set pathMapping(pathMapping) {
        this._pathMapping = Array.isArray(pathMapping) ? pathMapping : [];
    }

    get pathMapping() {
        return this._pathMapping;
    }

    set statusTimeout(statusTimeout) {
        this._statusTimeout = Number.isInteger(statusTimeout) && statusTimeout > 0 ? statusTimeout : 0;
    }

    get statusTimeout() {
        return this._statusTimeout * 1000;
    }

    get showStatus() {
        return this._statusTimeout > 0;
    }

    set replaceIfExists(replaceIfExists) {
        this._replaceIfExists = replaceIfExists === false ? false : true;
    }

    get replaceIfExists() {
        return this._replaceIfExists;
    }

    set inputFile(inputFile) {
        this._inputFile = inputFile && path.isAbsolute(inputFile) ? inputFile : null;
    }

    get inputFile() {
        return this._inputFile;
    }

    toss() {
        if (this.inputFile) {
            for (let i = 0; i < this.pathMapping.length; i++) {
                const pathMap = this.pathMapping[i];
                this.setOutputFile(pathMap);
                if (this.outputFile) {
                    const replaceIfExistsLcl = pathMap.replaceIfExists === false || pathMap.replaceIfExists === true ? pathMap.replaceIfExists : this.replaceIfExists;
                    if (!replaceIfExistsLcl && fs.existsSync(this.outputFile)) {
                        continue;
                    }
                    mkdirp.sync(path.dirname(this.outputFile));
                    fse.copySync(this.inputFile, this.outputFile);
                    this.count++;
                }
            }
        }
        this.setStatus();
        this.count = 0;
    }

    setOutputFile(pathMapping) {
        this.outputFile = null;
        if (pathMapping.input && pathMapping.output) {
            if (this.inputFile.startsWith(pathMapping.input)) {
                this.outputFile = this.inputFile.replace(pathMapping.input, pathMapping.output);
            }
        }
    }

    setStatus() {
        if (this.showStatus && this.count > 0) {
            let baseText = "Tossed file to " + this.count + " location";
            this.statusBar.text = this.count > 1 ? baseText + "s" : baseText;
            this.statusBar.show();
            const me = this;
            setTimeout(() => {
                me.statusBar.hide();
            }, this.statusTimeout);
        } else {
            this.statusBar.hide();
        }
    }

    dispose() {
        this.statusBar.dispose();
        this.statusBar = null;
        this._pathMapping = null;
    }
}

function activate(context) {
    let tf = new TossFile(vscode.window.createStatusBarItem(vscode.StatusBarAlignment.RIGHT));
    let tossFileCmd = vscode.commands.registerCommand('extension.tossFile', function () {
        if (vscode.window.activeTextEditor) {
            tf.settings = vscode.workspace.getConfiguration('tossfile');
            tf.inputFile = vscode.window.activeTextEditor.document.fileName;
            tf.toss();
        } else {
            tf.statusBar.hide();
        }
    });

    context.subscriptions.push(tf);
    context.subscriptions.push(tossFileCmd);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;
