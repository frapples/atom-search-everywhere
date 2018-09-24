# atom-search-everywhere package

This project was converted from https://github.com/geksilla/atom-fuzzy-grep.

1. Written in ES6, easier to maintain.
2. Fix the problem of searching for non-ASCII characters such as Chinese.
3. Fix the problem of detecting git repository under Windows.

Note: Due to porting from coffeescript, the feature has not been fully tested and there may be unknown bugs.


## Install

    apm install atom-search-everywhere

Or search via __Settings View -> Install__

## Usage

Hit ```ctrl-alt-g``` or ```, f f``` in vim-mode to toggle panel.

To open dialog with last searched string there is the command ```search-everywhere:toggleLastSearch```. You can map it in your ```keymap.cson```:

```
'atom-workspace':
  'ctrl-alt-shift-g': 'search-everywhere:toggleLastSearch'
```

To always open dialog with last search string check **Preserve Last Search** in package settings.

You can filter files in opened dialog. Toggle between grep/file mode with ```ctrl-f```.
To change this keybinding add following lines to your *keymaps.cson*:

```
'atom-workspace .atom-search-everywhere':
  '<your_keys_here>': 'search-everywhere:toggleFileFilter'
```

## Configuration

You can specify any command you want by **Grep Command String** option in package settings,  [ag](https://github.com/ggreer/the_silver_searcher) is used by default.

If you want to setup another one instead of **ag** here few examples:

### [pt](https://github.com/monochromegane/the_platinum_searcher)

    pt -i --nocolor --nogroup --column

### [ack](https://github.com/petdance/ack2)

    ack -i --nocolor --nogroup --column

### grep

    grep -r -n --color=never

### [ripgrep](https://github.com/BurntSushi/ripgrep)

    rg -i -n -H --no-heading --column

### git grep

    git grep -n -E

```git grep``` used by default for git projects if you don't want to use it uncheck **Detect Git Project And Use Git Grep** option in package settings.

Check package settings for more info.

## Caveats

* Search folder detects on project path from active text editor.
* When no editors opened or `Untitled` first project root path used.
* When you have opened several projects and want to search through it you need to open any file from this project and start search dialog.
* When active item not in project home directory used as root dir.
* When no projects opened home directory used as root dir.

## Commands

Name                            | Selector         | Key Map               | Description
--------------------------------|------------------|-----------------------|----------------------------------------------------------------------
__search-everywhere:toggle__                | `atom-workspace` | 'ctrl-alt-g' | Open search dialog start typing and select item
__search-everywhere:toggleLastSearch__      | `atom-workspace` | none                  | Open dialog with last search string
__search-everywhere:toggleWordUnderCursor__ | `atom-workspace` | 'cmd-*'               | Open dialog with word under cursor
__search-everywhere:toggleFileFilter__      | `atom-workspace .atom-search-everywhere atom-text-editor` | 'ctrl-f'     | When search dialog opened toggle file name filtering on found results
__search-everywhere:pasteEscaped__          | `body.platform-linux atom-workspace .atom-search-everywhere atom-text-editor, body.platform-win32 atom-workspace .atom-search-everywhere atom-text-editor` | 'ctrl-v'     | Paste text to dialog and escape it, you can disable this behavior with `atom-search-everywhere.escapeOnPaste` config
__search-everywhere:pasteEscaped__          | `body.platform-darwin atom-workspace .atom-search-everywhere atom-text-editor` | 'cmd-v'     | Paste text to dialog and escape it, you can disable this behavior with `atom-search-everywhere.escapeOnPaste` config


## Configs

Name                                              | Default                              | Type      | Description
--------------------------------------------------|--------------------------------------|-----------|-----------------------------------------------------------------------------------
__atom-search-everywhere.minSymbolsToStartSearch__       | 3                                    | _number_  | Start search after N symbol
__atom-search-everywhere.maxCandidates__                 | 100                                  | _number_  | Maximum count of displayed items
__atom-search-everywhere.grepCommandString__             | 'ag -i --nocolor --nogroup --column' | _string_  | Grep command
__atom-search-everywhere.detectGitProjectAndUseGitGrep__ | false                                | _boolean_ | Always use `git grep` when opened project is a git repository
__atom-search-everywhere.gitGrepCommandString__          | 'git grep -i --no-color -n -E'       | _string_  | `git grep` command used when `detectGitProjectAndUseGitGrep` is true
__atom-search-everywhere.preserveLastSearch__            | false                                | _boolean_ | Use last search string as input for search dialog
__atom-search-everywhere.escapeSelectedText__            | true                                 | _boolean_ | Escape special characters when dialog opened with selected text
__atom-search-everywhere.showFullPath__                  | false                                | _boolean_ | Show full file path instead of file name
__atom-search-everywhere.inputThrottle__                 | 50                                   | _integer_ | Input throttle
__atom-search-everywhere.escapeOnPaste__                 | true                                 | _boolean_ | Escape pasted text


## Contributing

Feel free to open issue or send pull request.
