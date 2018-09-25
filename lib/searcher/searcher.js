'use babel';
import config from '../config';
import GrepSearcher from './grep-searcher';

export default class Searcher {
    static create(projectPath) {
        if (config.detectGitProjectAndUseGitGrep) {
            const searcher = new GrepSearcher(true);
            if (searcher.isSupported(projectPath)) {
                return searcher;
            }
        }
        return new GrepSearcher(false);

    }
}
