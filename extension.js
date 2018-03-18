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
        this.tossCount = 0;
        this.skipCount = 0;
        this.timer = null;
    }

    set settings(settings) {
        this.pathMapping = settings.get('pathMapping', []);
        this.statusTimeout = settings.get('statusTimeout', 5);
        this.replaceIfExists = settings.get('replaceIfExists', true);
        this.extensionExcludes = settings.get('extensionExcludes', []);
        this.nameExcludes = settings.get('nameExcludes', []);
        this.pathExcludes = settings.get('pathExcludes', []);
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

    set extensionExcludes(extensionExcludes) {
        this._extensionExcludes = Array.isArray(extensionExcludes) ? extensionExcludes : [];
    }

    get extensionExcludes() {
        return this._extensionExcludes;
    }

    set nameExcludes(nameExcludes) {
        this._nameExcludes = Array.isArray(nameExcludes) ? nameExcludes : [];
    }

    get nameExcludes() {
        return this._nameExcludes;
    }

    set pathExcludes(pathExcludes) {
        this._pathExcludes = Array.isArray(pathExcludes) ? pathExcludes : [];
    }

    get pathExcludes() {
        return this._pathExcludes;
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
                    if (this.isSkip(pathMap)) {
                        this.skipCount++;
                        continue;
                    }
                    mkdirp.sync(path.dirname(this.outputFile));
                    fse.copySync(this.inputFile, this.outputFile);
                    this.tossCount++;
                }
            }
        }
        this.setStatus();
        this.tossCount = 0;
        this.skipCount = 0;
    }

    isSkip(pathMap) {
        let ret = false;
        const fileName = path.basename(this.outputFile);
        const fileExtension = path.extname(this.outputFile);
        const replaceIfExists = this.getReplaceIfExists(pathMap.replaceIfExists);
        const extensionExcludes = this.getExtensionExcludes(pathMap.extensionExcludes);
        const nameExcludes = this.getNameExcludes(pathMap.nameExcludes);
        const pathExcludes = this.getPathExcludes(pathMap.pathExcludes);
        if ((!replaceIfExists && fs.existsSync(this.outputFile)) ||
            extensionExcludes.includes(fileExtension) ||
            nameExcludes.includes(fileName) ||
            pathExcludes.includes(this.outputFile)) {
            ret = true;
        }
        return ret;
    }

    getReplaceIfExists(replaceIfExists) {
        return replaceIfExists === false || replaceIfExists === true ? replaceIfExists : this.replaceIfExists;
    }

    getExtensionExcludes(extensionExcludes) {
        return Array.isArray(extensionExcludes) ? extensionExcludes : this.extensionExcludes;
    }

    getNameExcludes(nameExcludes) {
        return Array.isArray(nameExcludes) ? nameExcludes : this.nameExcludes;
    }

    getPathExcludes(pathExcludes) {
        return Array.isArray(pathExcludes) ? pathExcludes : this.pathExcludes;
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
        if (this.showStatus && (this.tossCount > 0 || this.skipCount > 0)) {
            this.clearStatus();
            let baseText = "Tossed file to " + this.tossCount + " location";
            if (this.tossCount !== 1) {
                baseText += "s";
            }
            if (this.skipCount > 0) {
                baseText += "; exclude settings made toss skip " + this.skipCount + " location";
                if (this.skipCount > 1) {
                    baseText += "s";
                }
            }
            this.statusBar.text = baseText;
            this.statusBar.show();
            const me = this;
            this.timer = setTimeout(() => {
                me.statusBar.hide();
            }, this.statusTimeout);
        } else {
            this.clearStatus();
        }
    }

    clearStatus() {
        clearTimeout(this.timer);
        this.statusBar.hide();
    }

    dispose() {
        this.clearStatus();
        this.timer = null;
        this.statusBar.dispose();
        this.statusBar = null;
        this._pathMapping = null;
        this._extensionExcludes = null;
        this._nameExcludes = null;
        this._pathExcludes = null;
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
            tf.clearStatus();
        }
    });

    context.subscriptions.push(tf);
    context.subscriptions.push(tossFileCmd);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;
