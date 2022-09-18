---
layout: "../layouts/BlogPost.astro"
title: "Git knowledge that not clear to me"
slug: git-knowledge-not-clear
description: ""
added: "June 19 2022"
---

## git reset
You’ve made some commits locally (not yet pushed), but everything is terrible, you want to undo last commits like they never happened.

`--soft`, does not touch the index file or the working tree at all (but resets the head). This leaves all your changed files "Changes to be committed", as git status would put it.

`--mixed`, resets the index but not the working tree. The commits are gone, but the contents are still on disk. This is the default action.

`--hard`, resets the index and working tree. Any changes to tracked files in the working tree are discarded.

> Use `git push -f` to change the remote after `git reset` locally.

## git merge
The `--no-ff` flag prevents `git merge` from executing a "fast-forward" if it detects that your current `HEAD` is an ancestor of the commit you're trying to merge. A fast-forward is when, instead of constructing a merge commit, git just moves your branch pointer to point at the incoming commit. This commonly occurs when doing a `git pull` without any local changes.

- `--ff`, when possible resolve the merge as a fast-forward (only update the branch pointer to match the merged branch; do not create a merge commit). When not possible (when the merged-in history is not a descendant of the current history), create a merge commit.

- `--no-ff`, create a merge commit in all cases, even when the merge could instead be resolved as a fast-forward.

- `--ff-only`, resolve the merge as a fast-forward when possible. When not possible, refuse to merge and exit with a non-zero status. *(Unix systems have a convention that an exit status of 0 denotes success, and any non-zero exit status denotes failure)*

## git pull --rebase vs. --merge
- If you pull remote changes with the flag `--rebase`, then your local changes are reapplied on top of the remote changes.

- If you pull remote changes with the flag `--merge`, which is also the default, then your local changes are merged with the remote changes. This results in a merge commit that points to the latest local commit and the latest remote commit.

## git remote
A remote URL is the place where your code is stored. You can only push to two types of URL addresses: HTTPS URL like `https://github.com/user/repo.git` or SSH URL like `git@github.com:user/repo.git`. Git associates a remote URL with a name, and your default remote is usually called `origin`.

- `git remote [-v | --verbose]` will show remote url after name.
- use `git remote add` to match a remote URL with a name. It takes two arguments: a remote name, for example, `origin`, and a remote URL, for example, `https://github.com/user/repo.git`
- use `git remote set-url` to change an existing remote repository URL. It takes two arguments: an existing remote name like `origin` and a new URL for the remote.

## undo a git merge with conflicts
- Since your pull was unsuccessful then HEAD is the last "valid" commit on your branch: `git reset --hard HEAD`

- If you make a mistake or you’re not confident which the decision change to accept, you can stop the merge process by running `git merge -- abort`

- Generally you shouldn't merge with uncommitted changes. If you have changes you don't want to commit before starting a merge, just `git stash` them before the merge and `git stash pop` after finishing the merge.

## merge with ours & theirs
Let's merge conflicting branch feature into master by `git merge feature`. You can use `git checkout --ours <file>` to select the changes done in master or `git checkout --theirs <file>` to select the changes done in feature. Then, continue as you would normally merge with `git add <file>` and `git merge --continue`.

How about resolving cherry-pick conflicts using their changes? First you should undo your cherry-pick, try to run `git cherry-pick --abort`. Second, try to make cherry-pick getting their changes not yours with `git cherry-pick -s recursive -X theirs {commit}`. Here `-s` is a short for `--strategy` and `-X` short for `--strategy-option`.

## working on a wrong branch
- If you did't commit the changes, use `git stash` (**git stash is per-repository, not per-branch**)
  - git stash
  - git checkout right_branch
  - git stash apply
- If you committed to the wrong branch, `git reset` those commits individually. Once you have done that, switch back to the desired branch and there you can use `git cherry-pick` to pick the specific commits.
  - git checkout right_branch
  - git cherry-pick commit_hash

## stash untracked files
To stash your working directory including untracked files, use `git stash --include-untracked` or `git stash -u`.

## refusing to merge unrelated histories
I always see this error when I create a new Github repository with a README.md or a LICENSE file, then pull it to a local repository at the first time. `git pull origin main --allow-unrelated-histories` should fix it, which force the merge to happen.

## git log and git reflog
- `git log` shows the current HEAD and its ancestry. That is, it prints the commit HEAD points to, then its parent, its parent, and so on. It traverses back through the repo's ancestry by recursively looking up each commit's parent. (often use `git log --pretty=oneline`)

- `git reflog` doesn't traverse HEAD's ancestry. The reflog is an ordered list of the commits that HEAD has pointed to: **it's the undo history for your repo**. The reflog isn't part of the repo itself (it's stored separately to the commits themselves and it's purely local). If you accidentally reset to an older commit, or rebase wrongly, or any other operation that visually "removes" commits, you can use the reflog to see where you were before and `git reset --hard HEAD@{index}` back to that ref to restore your previous state.

## rename branch
- Rename the branch while working in this branch: `git branch -m <new name>`; rename from outside the branch: `git branch -m <old name> <new name>`.
- Using 'master' as the name for the initial branch. This default branch name is subject to change. To configure the initial branch name to use in all of your new repositories, call `git config --global init.defaultBranch <name>`.

## change the most recent commit message after push
`git commit --amend` brings up the editor with the last commit message and lets you edit the message. You can use `-m` if you want to wipe out the old message and use a new one: `git commit --amend -m "new commit message"`. And then when you push, do `git push --force-with-lease <repository> <branch>`.

## rewrite history: squash commit, fixup and autosquash
- https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History
- https://fle.github.io/git-tip-keep-your-branch-clean-with-fixup-and-autosquash.html

For example, I want to change the git user (rewrite history) after push the code:
1. `git config user.name "New User"` and `git config user.email "newuser@gmail.com"` to change the user info.
2. `git log` shows commit logs and find out **the commit id that ahead of your commit which you want to change**.
3. `git rebase -i <after-this-commit>`
4. Change the word 'pick' to 'edit' (there is a commit list you can change), save and exit; rebase is stopped at the next commit (you just changed) and you can amend this commit.
5. `git commit --amend --reset-author --no-edit` and `git rebase --continue` to confirm and continue your rebase. (there is also a `git rebase --abort` command)
6. `git push --force-with-lease` to overwrite the remote history. (`--force-with-lease` is safer than `--force`: If the remote branch has the same value as the remote branch on your local machine, you will overwrite remote. If it doesn't have the same value, it indicates a change that someone else made to the remote branch while you were working on your code and thus will not overwrite any code.)

Another example, I want to squash my last 3 commits together into one commit: `git reset --soft HEAD~3 && git commit`. The soft reset just re-points HEAD to the last commit that you do not want to squash. Neither the index nor the working tree are touched, leaving the index in the desired state for your new commit.

Github takes all of the commits on your PR branch and combines them into a single one when you merge. You also can squash all commits from a branch into one commit by `git merge --squash <branch>`.

## git restore and git switch
`git checkout` is one of the many reasons why newcomers find git confusing, and that is because its effect is context-dependent. In version 2.23 of git, two new commands have been introduced to split the old `git checkout` in two.

`git restore` implements the behavior of `git checkout` when running it against a file, `git restore -- test.txt`. 

`git switch` implements the behavior of `git checkout` when running it only against a branch name, so you can use it to switch between branches: `git switch develop`. While with `git checkout` you can switch to a commit and transition into a detached HEAD state, by default `git switch` does not allow that. You need to provide the `-d` flag: `git switch -d commit_id`. Another difference is that with `git checkout` you can create and switch to the new branch using the `-b` flag. You can do the same with the new one, but the flag is `-c`: `git switch -c new_branch`.

`git checkout -` will checkout the previous branch.

## Another git process seems to be running in this repository
Such problems generally occur when you execute two git commands simultaneously; maybe one from the command prompt and one from an IDE. Try `rm -f .git/index.lock` to delete the `index.lock` file and release the active lock.

## speed up git clone
`git clone [repo] --depth=1` When you don't need the entire history of a repository, you can speed up the download by specifying the number of revisions you need.

## degit - straightforward project scaffolding
[degit](https://github.com/Rich-Harris/degit) makes copies of git repositories. When you run `degit some-user/some-repo`, it will find the latest commit and download the associated tar file if it doesn't exist locally. This is much quicker than using git clone, because you're not downloading the entire git history.

## update your GitHub fork
Take contributing to Angular as an example. You have a fork of the Angular repository. You want to update your GitHub fork to the new `main` branch naming:
1. git checkout master
2. git fetch upstream main
3. git rebase upstream/main

> `git fetch` is the command that tells your local git to retrieve the latest meta-data info from the original yet doesn't do any file transferring. `git pull` on the other hand does that AND brings those changes from the remote repository.

## GitHub protocol comparison
- plain Git, aka `git://github.com/`, does not add security beyond what Git itself provides. The server is not verified and you cannot push over it. Now Github permanently disabled the [unencrypted Git protocol](https://github.blog/changelog/2022-03-15-removed-unencrypted-git-protocol-and-certain-ssh-keys/).

- HTTPS, aka `https://github.com/`, will always verify the server automatically, using certificate authorities. Uses password authentication for pushing, and still allows anonymous pull. If you have two-factor authentication enabled, you will use a personal access token instead of your regular password.

- HTTP, aka `http://github.com/`, doesn't work with GitHub anymore.

- SSH, aka `git@github.com:` or `ssh://git@github.com/`, uses public-key authentication. You have to generate a keypair, then add it to your GitHub account. Authentication is needed for all connections, so you always need a GitHub account – even to pull or clone.

> You can tell git to use https instead of `git://` with the command `git config --global url."https://".insteadOf git://`, and the change goes to your git config file `~/.gitconfig`.
