'use babel';
import config from '../config';
import GrepSearcher from './grep-searcher';
import AtomBuiltinSearcher from './atom-builtin-searcher';

export default class Searcher {
    static create(projectPath) {
        let searcher;
        if (config.detectGitProjectAndUseGitGrep) {
            searcher = [
                new GrepSearcher(true),
                new GrepSearcher(false),
                new AtomBuiltinSearcher()
            ];
        } else {
            searcher = [
                new GrepSearcher(false),
                new GrepSearcher(true),
                new AtomBuiltinSearcher()
            ];
        }

        return searcher.find((searcher) => searcher.isSupported(projectPath));
    }
}
