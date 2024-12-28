---
title: "Git knowledge that not clear to me"
description: ""
added: "Jun 19 2022"
tags: [system]
updatedDate: "July 20 2024"
---

## helpful links
- https://ohshitgit.com
- https://github.com/k88hudson/git-flight-rules
- https://dev.to/g_abud/advanced-git-reference-1o9j
- https://gitexplorer.com
- https://jvns.ca/blog/2023/11/01/confusing-git-terminology/

## git reset
You’ve made some commits locally (not yet pushed), but everything is terrible, you want to undo last commits like they never happened.

`--soft`, does not touch the index file or the working tree at all (but resets the head). This leaves all your changed files "Changes to be committed", as git status would put it.

`--mixed`, resets the index but not the working tree. The commits are gone, but the contents are still on disk. This is the default action.

`--hard`, resets the index and working tree. Any changes to tracked files in the working tree are discarded.

> A branch is a pointer to a commit. Run `cat .git/refs/heads/master` to see it. Understanding this will make it way easier to fix your branches when they're broken: you just need to figure out how to get your branch to point at the right commit again.
>
> - The remote changes are useless and I want to overwrite them. To do this, I’ll run `git push --force`.
> - The local changes are useless and I want to overwrite them. To do this, I’ll run `git reset --hard origin/main`.
> - I want to keep both sets of changes on `main`. To do this, I’ll run `git pull --rebase`. It rebases `main` onto the remote `main` branch.

## git merge
```
*---* (master)
     \
      *---*---* (foo)

*---*
     \
      *---*---* (master, foo)

In this situation, the merge is fast-forward because `master` is reachable from `foo`. In other words, you just have to move the master reference to foo, and you're done.

*---*---* (master)
     \
      *---*---* (foo)

*---*---*-------* (master)
     \         / 
      *---*---* (foo)

When your branches diverge, you have to create a commit to "join" the two branches. The new commit is the merge commit and has two parent commits.
```

- `--ff`, when possible resolve the merge as a fast-forward (only update the branch pointer to match the merged branch; do not create a merge commit). When not possible (when the merged-in history is not a descendant of the current history), create a merge commit.

- `--no-ff`, create a merge commit in all cases, even when the merge could instead be resolved as a fast-forward.

- `--ff-only`, resolve the merge as a fast-forward when possible. When not possible, refuse to merge and exit with a non-zero status.

## git pull --rebase vs. --merge
- When you decide to push your work your push is rejected, because there's been parallel work on the same branch. At this point do a `git pull --rebase` to avoid the extra merge commits. You actually commit on top of the remote branch.

- If you pull remote changes with the flag `--merge`, which is also the default, then your local changes are merged with the remote changes. This results in a merge commit that points to the latest local commit and the latest remote commit.

> Note that `git fetch` is the command that tells your local git to retrieve the latest meta-data info from the original yet doesn't do any file transferring. `git pull` on the other hand does that AND brings those changes from the remote repository.

## undo a git merge with conflicts
- Since your pull was unsuccessful then HEAD is the last "valid" commit on your branch: `git reset --hard HEAD`

- If you make a mistake or you’re not confident which the decision change to accept, you can stop the merge process by running `git merge --abort`

- Generally you shouldn't merge with uncommitted changes. If you have changes you don't want to commit before starting a merge, just `git stash` them before the merge and `git stash pop` after finishing the merge. *To stash your working directory including untracked files, use `git stash --include-untracked` or `git stash -u`.*

## merge with ours & theirs
Let's merge conflicting branch feature into master by `git merge feature`. You can use `git checkout --ours <file>` to select the changes done in master or `git checkout --theirs <file>` to select the changes done in feature. Then, continue as you would normally merge with `git add <file>` and `git merge --continue`.

## merge strategies
'ort' ("Ostensibly Recursive’s Twin") is the default merge strategy when pulling or merging one branch. This strategy can only resolve two heads using a 3-way merge algorithm. When there is more than one common ancestor that can be used for 3-way merge, it creates a merged tree of the common ancestors and uses that as the reference tree for the 3-way merge. This has been reported to result in fewer merge conflicts without causing mismerges. This algorithm came from the fact that it was written as a replacement for the previous default algorithm, `recursive`.

Say you and your friend both checked out a file, and made some changes to it. You removed a line at the beginning, and your friend added a line at the end. Then he committed his file, and you need to merge his changes into your copy. With a three-way merge, it can compare the two files, but it can also compare each of them against the original copy. So it can see that you removed the first line, and that your friend added the last line. And it can use that information to produce the merged version.

## git pull/push without parameter
- `git pull`: In order to determine what remote branches to fetch when the command is run without any refspec parameters on the command line, values of the configuration variable `remote.<origin>.fetch` are consulted. *A refspec maps a branch in the local repository to a branch in a remote repository.* For example, `refs/heads/*:refs/remotes/origin/*` specifies that all remote branches are tracked using remote-tracking branches in `refs/remotes/origin/` hierarchy under the same name.

- `git push`: When neither the command-line nor the configuration specify what to push, the default behavior is used, which corresponds to the `simple` value for `push.default`: the current branch is pushed to the corresponding upstream branch, but as a safety measure, the push is aborted if the upstream branch does not have the same name as the local one.

> `git config push.default`:
> - `push.default simple` is the default in Git. It only works if your branch is already tracking a remote branch.
> - `push.default current` will always push the local branch to a remote branch with the same name.
> 
> `git config push.autosetupremote true` assumes `--set-upstream` on default push when no upstream tracking exists for the current branch. It is useful if you want new branches to be pushed to the default remote (like the behavior of `push.default=current`) and you also want the upstream tracking to be set.

## git remote
A remote URL is the place where your code is stored. You can only push to two types of URL addresses: HTTPS URL like `https://github.com/user/repo.git` or SSH URL like `git@github.com:user/repo.git`. Git associates a remote URL with a name, and your default remote is usually called `origin`.

- `git remote [-v | --verbose]` will show remote url after name.
- use `git remote add` to match a remote URL with a name. It takes two arguments: a remote name, for example, `origin`, and a remote URL, for example, `https://github.com/user/repo.git`
- use `git remote set-url` to change an existing remote repository URL. It takes two arguments: an existing remote name like `origin` and a new URL for the remote.

## working on a wrong branch
- If you did't commit the changes, use `git stash`. **git stash is per-repository, not per-branch.**
  - git stash
  - git checkout right_branch
  - git stash apply

> The stash is a bunch of commits: When you run `git stash`, git makes some commits with your changes and labels them with a reference called `stash` (in `.git/refs/stash`).

- If you committed to the wrong branch, `git reset` those commits individually. Once you have done that, switch back to the desired branch and there you can use `git cherry-pick` to pick the specific commits.
  - git checkout right_branch
  - git cherry-pick commit_hash

> To cherry-pick all the commits from commit A to commit B (where A is older than B), run: `git cherry-pick <commitA>^..<commitB>`.
>
> Usually you cannot cherry-pick a merge because you do not know which side of the merge should be considered the mainline. *(If a commit has two or more parents, it also represents two or more diffs - which one should be applied?)* `-m` option specifies the parent number (starting from 1, the order is the one in which they're listed in the commit as viewed by `git show`). For example, if your commit tree is like below:
```
- A - D - E - F  master  
   \     /  
    B - C        branch one
```
> Then `git cherry-pick E` will produce the issue you faced. `git cherry-pick E -m 1` means using D-E, while `git cherry-pick E -m 2` means using B-C-E.

- `git checkout -` will checkout the previous branch.

## show the changes
Run `git show` to show the changes made in the most recent commit, which is equivalent to `git show HEAD`.

- diff two branches: git diff master..develop
- diff local and remote: git diff HEAD..origin/master
- diff for a certain folder: git diff master..yourbranch -- path/to/folder
- save in a file: git diff master..develop > my.diff
- diff between a commit and the head: git diff COMMIT

## refuse to merge unrelated histories
I always see this error when I create a new Github repository with a README.md or a LICENSE file, then pull it to a local repository at the first time. `git pull origin main --allow-unrelated-histories` should fix it, which force the merge to happen.

## git log and git reflog
`git log` (often use `git log --pretty=oneline`) shows the current HEAD and its ancestry. That is, it prints the commit HEAD points to, then its parent, its parent, and so on. It traverses back through the repo's ancestry by recursively looking up each commit's parent.

`git reflog` doesn't traverse HEAD's ancestry. The reflog is an ordered list of the commits that HEAD has pointed to: **it's the undo history for your repo**. The reflog isn't part of the repo itself (it's stored separately to the commits themselves and it's purely local). If you accidentally reset to an older commit, or rebase wrongly, or any other operation that visually "removes" commits, you can use the reflog to see where you were before and `git reset --hard HEAD@{index}` back to that ref to restore your previous state.

```sh
## Recover deleted branch
## Pre-requisite: You have to know your last commit message from your deleted branch.
git reflog
# Search for message in the list
# a901eda HEAD@{18}: commit: <last commit message>

# Now you have two options, either checkout revision or HEAD
git checkout a901eda 
# Or
git checkout HEAD@{18}

# Create branch
git branch recovered-branch

# You may want to push that back to remote
git push origin recovered-branch:recovered-branch
```

## searching for commits by code
The `-S` option for `git log` lets us pass a string used to filter out commits whose diff doesn't include that specific string. More specifically, it is used to match code that was added or deleted in that commit. If no match is found, the commit is not included in the output.

```sh
# Show commits that include "getUser" in the diff
git log -S "getUser"
```

## rename branch
- Rename the branch while working in this branch: `git branch -m <new name>`; rename from outside the branch: `git branch -m <old name> <new name>`.
- Using 'master' as the name for the initial branch. This default branch name is subject to change. To configure the initial branch name to use in all of your new repositories, call `git config --global init.defaultBranch <name>`.

## change the most recent commit message after push
`git commit --amend` brings up the editor with the last commit message and lets you edit the message. You can use `-m` if you want to wipe out the old message and use a new one: `git commit --amend -m "new commit message"`. And then when you push, do `git push --force-with-lease <repository> <branch>`.

## make empty commits
`git commit --allow-empty -m 'trigger build'` allows you to trigger a commit with no content, skipping the error you would usually see that says you have nothing staged. This trick is especially useful when you need to kick off a CI run or even a production deployment without having to push arbitrary code.

Btw, you can add a commit subject and description as follows: `git commit -m "subject line" -m "longer description"`.

You can easily insert emojis into commit messages provided you know them by name. You can reference the [Gitmoji](https://gitmoji.dev) cheatsheet to pick a relevant emoji, and insert it as text in your commit message.

## rewrite history: squash commit, fixup and autosquash
- https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History
- https://fle.github.io/git-tip-keep-your-branch-clean-with-fixup-and-autosquash.html

For example, I want to change the git user (rewrite history) after push the code:
1. `git config user.name "New User"` and `git config user.email "newuser@gmail.com"` to change the user info.
2. `git log` shows commit logs and find out **the commit id that ahead of your commit which you want to change**.
3. `git rebase -i <after-this-commit>`, which initiates an interactive rebase and allows you to modify commits interactively.
4. Change the word 'pick' to 'edit' (there is a commit list you can change), save and exit; rebase is stopped at the next commit (you just changed) and you can amend this commit.
5. `git commit --amend --reset-author --no-edit` and `git rebase --continue` to confirm and continue your rebase.
6. `git push --force-with-lease` to overwrite the remote history. (**`--force-with-lease` is safer than `--force`**: If a change that someone else made to the remote branch while you were working on your code, you will not overwrite any remote code.)

To fixup a commit:
```sh
git commit --fixup a0b1c2d3  # The new commit message will start with "fixup!" followed by the message of the original commit.

git rebase -i --autosquash a0b1c2d3~1  # Clean up the history by combining the fixup commit with the original commit.
```

Another example, I want to squash my last 3 commits together into one commit.
- Method 1: `git reset --soft HEAD~3 && git commit`. The soft reset just re-points HEAD to the last commit that you do not want to squash. Neither the index nor the working tree are touched, leaving the index in the desired state for your new commit.

- Method 2: `git reset --hard HEAD~3`, where `HEAD@{1}` is where the branch was just before the reset command. Then `git merge --squash HEAD@{1} && git commit`. This way you get the commit message prepopulated with every commit message that you're squashing.

## `git add -p` is underrated
Interactively choose hunks of patch between the index and the work tree and add them to the index. This gives the user a chance to review the difference before adding modified contents to the index.

```
y - stage this hunk
n - do not stage this hunk
q - quit; do not stage this hunk or any of the remaining ones
a - stage this hunk and all later hunks in the file
d - do not stage this hunk or any of the later hunks in the file
e - manually edit the current hunk
? - print help
```

## git restore and git switch
`git checkout` is one of the many reasons why newcomers find git confusing, and that is because its effect is context-dependent. In version 2.23 of git, two new commands have been introduced to split the old `git checkout` in two.

`git restore` implements the behavior of `git checkout` when running it against a file, `git restore -- test.txt`. 

`git switch` implements the behavior of `git checkout` when running it only against a branch name, so you can use it to switch between branches: `git switch develop`. While with `git checkout` you can switch to a commit and transition into a detached HEAD state, by default `git switch` does not allow that. You need to provide the `-d` flag: `git switch -d commit_id`. Another difference is that with `git checkout` you can create and switch to the new branch using the `-b` flag. You can do the same with the new one, but the flag is `-c`: `git switch -c new_branch`.

> `git checkout -b <new_branch> <remote_name>/<remote_branch>` create and switch to a new branch based on a specific reference (branch, remote branch, tag are examples of valid references).

## another git process seems to be running in this repository
Such problems generally occur when you execute two git commands simultaneously; maybe one from the command prompt and one from an IDE. Try `rm -f .git/index.lock` to delete the `index.lock` file and release the active lock.

## skip git commit hooks
The pre-commit hook can be used to run tests, lint, type check, etc. The hooks are located in the `.git/hooks/` directory. Use the `--no-verify` option to bypass git commit hooks, e.g. `git commit -m "commit message" --no-verify`. And as a long-term solution, assure CI is configured.

## speed up git clone
`git clone [repo] --depth=1` When you don't need the entire history of a repository, you can speed up the download by specifying the number of revisions you need. You still get a `.git` folder that pertains to the project template.

[degit](https://github.com/Rich-Harris/degit) makes copies of git repositories. When you run `degit some-user/some-repo`, it will find the latest commit and download the associated tar file if it doesn't exist locally. This is much quicker than using `git clone`, because you're not downloading the entire git history.

## gitignore
- https://gitignore.io/
- https://github.com/github/gitignore

After committing several times, you realize that you need to create `.gitignore` and exclude some files. You have to `git rm --cached` to remove the files that you don't want in the repo, then add and commit it.

## git tag
- To create a tag on your current branch, run `git tag <tagname>`. If you want to include a description with your annotated tag, run `git tag -a v1.1.0 -m "xyz feature is released in this tag"`.
- `git tag` lists all tags.
- Use `git push origin v1.1.0` to push a particular tag, or `git push --tags` if you want to push all tags.
- `git push origin :tagname` to delete a remote tag, and if you also need to delete the local tag, use `git tag --delete tagname`.

## git submodules
A git submodule is a full repo that’s been nested inside another repo. Any repo can be a submodule of another. Submodules can only be pinned to a specific commit. This is because a submodule isn’t a package; it’s code that you have embedded in another repo, and git wants you to be precise.

Run `git submodule init` to initialize the submodules. This doesn’t actually download them, though. Run `git submodule update` to actually pull the submodules. Just do `git submodule update --init`, which initializes any submodules and updates them in one step.

How do you make webapp point at the new commit? You can go into webapp, then `cd library`, and just do `git pull` in there. When you cd back into webapp, if you `git diff` you’ll see that webapp points to the newest branch of library. You can commit that.

## git lfs
GitHub limits the size of files allowed in repositories. If you attempt to add or update a file that is larger than 50 MiB, you will receive a warning from Git. GitHub blocks files larger than 100 MiB. To track files beyond this limit, you must use Git Large File Storage (Git LFS). Git LFS handles large files by storing references to the file in the repository, but not the actual file itself.

```sh
brew install git-lfs
git lfs install

git lfs track "*.psd"

git lfs help
```

## optimize git repo size
https://github.com/github/git-sizer

Before the pack it was 3.1 GB. After the repack, it shrunk to the following values:

```sh
# default value for --window is 10 and --depth is 50.
git repack -a -d --depth=50 --window=10 -f
141.584 MB

git repack -a -d --depth=250 --window=1000 -f
110.484 MB
```

## update your GitHub fork
You cannot push code to repositories that you don’t own. So instead, you make your own copy of the repository by “forking” it. You are then free to make any changes you wish to your repository.

One of the challenges with forking a repository is keeping your copy up-to-date with the original repository, or the upstream repository. We're going to add the original repository as a git remote, so we can easily fetch and pull from it. Say you want to update your GitHub fork to the new `main` branch:
1. git remote add origin git@github.com:original-repo-url
2. git checkout master
3. git fetch origin main
4. git rebase origin/main

If there are merge conflicts, we need to fix it, then `git add .` and run `git rebase --continue`. Now git will apply the rest of our commits. It's notable that if you had trouble with the merge conflict, you can run `git rebase --abort` to abort the rebase and get back to where you were before you started the rebase.

## Organize multiple Git identities
One awesome feature of the `.gitconfig` file is that you can conditionally include other config files. For every identity, you keep a separate gitconfig file and include it in the main `~/.gitconfig`. See an example: https://garrit.xyz/posts/2023-10-13-organizing-multiple-git-identities

```
[user]
  name = foo
  email = foo@bar.com

[includeIf "gitdir:~/work/"]
  path = ~/.gitconfig-work

[includeIf "gitdir:~/work/client/"]
  path = ~/.gitconfig-client
```

## Git Extras
[git-extras](https://github.com/tj/git-extras) is a collection of Git utilities, which hosts more than 60 of "extras" with features that extend the basic functionality of Git. Install it with Homebrew `brew install git-extras`.

To get an overview of all extras, it is worth running `git extras --help` after installation. Alternatively there is a [Commands.md](https://github.com/tj/git-extras/blob/master/Commands.md) in the repository which lists and explains all extras.
