'use babel';
/** @jsx etch.dom */
/*
* decaffeinate suggestions:
* DS102: Remove unnecessary code created because of implicit returns
* DS206: Consider reworking classes to avoid initClass
* DS207: Consider shorter variations of null checks
* Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
*/
import etch from 'etch';
import SelectListView from 'atom-select-list';
import { BufferedProcess, CompositeDisposable } from 'atom';
import path from 'path';
import Runner from './runner';
import escapeStringRegexp from 'escape-string-regexp';
import os from 'os';

const fuzzyFilter = null;

export default class GrepView {
    constructor() {
        this.lastSearch = '';

        this.emptyMessage = "Search result is empty.";

        this.selectListView = new SelectListView({
            items: [],
            maxResults: 15,
            // This property must be customized. The default filter function has a bug and will filter out Chinese.
            filter: (item) => item,
            filterQuery: (query) => query,
            didCancelSelection: () => {
                this.cancel();
            },
            didConfirmSelection: (item) => {
                this.confirm(item);
            },
            didConfirmEmptySelection: () => {
                this.confirm();
            },
            didChangeQuery: () => {
                this.grepProject(this.selectListView.getFilterQuery());
            },
            elementForItem: (item) => {
                return this.renderItem(item).element;
            }
        });
        this.selectListView.element.classList.add('atom-search-everywhere');

        this.subscriptions = new CompositeDisposable;
        // this.subscriptions.add(atom.commands.add(this.filterEditorView.element, 'search-everywhere:toggleFileFilter', this.toggleFileFilter));
        this.subscriptions.add(atom.commands.add(
            this.selectListView.element, 'search-everywhere:pasteEscaped', (e) => this.pasteEscaped(e)));
        this.runner = new Runner();
    }


    get minFilterLength() {
        return atom.config.get('atom-search-everywhere.minSymbolsToStartSearch');
    }

    get maxItems() {
        return atom.config.get('atom-search-everywhere.maxCandidates');
    }
    get preserveLastSearch() {
        return atom.config.get('atom-search-everywhere.preserveLastSearch');
    }

    get escapeSelectedText() {
        return atom.config.get('atom-search-everywhere.escapeSelectedText');
    }

    get showFullPath() {
        return atom.config.get('atom-search-everywhere.showFullPath');
    }

    get inputThrottle() {
        return atom.config.get('atom-search-everywhere.inputThrottle');
    }

    get escapeOnPaste() {
        return atom.config.get('atom-search-everywhere.escapeOnPaste');
    }


    getSearchValue() {
        return this.selectListView.getFilterQuery();
    }

    renderItem(item) {
        let rowContent = item.content;
        if (rowContent.length >= 500) {
            rowContent = rowContent.slice(0, 500);
        }
        let matched, reg;
        try {
            reg = new RegExp(this.getSearchValue(), 'ig');
            matched = reg.exec(rowContent);
        } catch (error) {}
        if (reg && matched) {
            item.contentSeg = [
                rowContent.slice(0, matched.index),
                matched[0],
                rowContent.slice(reg.lastIndex)
            ];
        } else {
            item.contentSeg = [rowContent];
        }
        return new ListItemComponent({item: item,
            showFullPath: this.showFullPath
        });
    }

    confirm(item) {
        this.lastSearch = this.selectListView.getFilterQuery();
        if (item) {
            this.openFile(item.fullPath, item.line, item.column);
        }
        this.cancel();
    }

    openFile(filePath, line, column) {
        if (!filePath) {
            return;
        }
        return atom.workspace.open(filePath, {initialLine: line, initialColumn: column})
        .then(function(editor) {
            const editorElement = atom.views.getView(editor);
            const { top } = editorElement.pixelPositionForBufferPosition(editor.getCursorBufferPosition());
            return editorElement.setScrollTop(top - (editorElement.getHeight() / 2));
        });
    }

    cancel() {
        this.isFileFiltering = false;
        this.selectListView.reset();
        this.hide();
        this.runner && this.runner.destroy();
    }

    grepProject(query) {
        console.log(query);
        if (this.minFilterLength && (query.length < this.minFilterLength)) {
            this.selectListView.update({
                items: [],
                infoMessage: `Please enter more than ${this.minFilterLength} chars`,
                emptyMessage: null
            });
            return;
         }

         this.selectListView.update({
             loadingMessage: "loading...",
             infoMessage: null,
             errorMessage: null,
             emptyMessage: null
         });

        this.runner.run(query, this.getProjectPath())
        .then((items) => {
            console.log("Result:");
            console.log(items);
            this.selectListView.update({
                items: items,
                loadingMessage: null,
                emptyMessage: this.emptyMessage
            });

        }).catch((error) => {
            console.log(error);
            this.selectListView.update({items: [], errorMessage: error});
        });
    }

    getProjectPath() {
        const homeDir = os.homedir();
        const editor = atom.workspace.getActiveTextEditor();
        if (!editor) {
             return atom.project.getPaths()[0] || homeDir;
         }
        if (editor.getPath()) {
            return atom.project.relativizePath(editor.getPath())[0] || path.dirname(editor.getPath());
        } else {
            return atom.project.getPaths()[0] || homeDir;
        }
    }

    destroy() {
        if (this.subscriptions != null) {
            this.subscriptions.dispose();
        }
        this.subscriptions = null;
    }

    show() {
        this.previouslyFocusedElement = document.activeElement;
        if (!this.panel) {
            this.panel = atom.workspace.addModalPanel({item: this.selectListView});
        }
        this.panel.show();
        this.selectListView.focus();
    }

    hide() {
        if (this.panel) {
            this.panel.hide();
        }

        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }
    toggle() {
    if (this.panel && this.panel.isVisible()) {
      this.cancel();
    } else {
      this.show();
    }
}

    toggleLastSearch() {
        this.toggle();
        console.log(this.lastSearch);
        this.selectListView.update({
            query: this.lastSearch || ''
        });
    }

    toggleWordUnderCursor() {
        this.toggle();
        const editor  = atom.workspace.getActivePaneItem();
        let pattern = editor || editor.getSelectedText();
        pattern = editor != null ? editor.getSelectedText() : "";
        if (pattern === "") {
             pattern = editor != null ? editor.getWordUnderCursor() : "";
         }
        this.selectListView.update({
            query: pattern
        });
    }

    pasteEscaped(e) {
        const { target } = e;
        atom.commands.dispatch(target, "core:paste");
            console.log(this.escapeOnPaste);
        if (this.escapeOnPaste) {
            let query = this.selectListView.getFilterQuery();
            query = escapeStringRegexp(query);
            this.selectListView.update({
                query: query
            });
        }
    }
}

class ListItemComponent {
  constructor (prop) {
      this.prop = prop;
      this.item = this.prop.item;
      etch.initialize(this);
  }

  render () {
      const c1 = this.item.contentSeg[0];
      const c2 = this.item.contentSeg[1] || '';
      const c3 = this.item.contentSeg[2] || '';
      const displayedPath = this.prop.showFullPath ? this.item.filePath : path.basename(this.item.filePath);
      return (
          <li class="two-lines">
          <div class="primary-line file icon icon-file-text" data-name={displayedPath}>
          {displayedPath}:{this.item.line + 1}
          </div>
          <div class="secondary-line">
          <span>{c1}</span>
          <span class="matched-search">{c2}</span>
          <span>{c3}</span>
          </div>
          </li>
      );
  }

  update (props, children) {
      return etch.update(this);
  }
}
