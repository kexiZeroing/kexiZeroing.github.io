---
layout: "../layouts/BlogPost.astro"
title: "Setup a new mac"
slug: setup-new-mac
description: ""
added: "Feb 13 2022"
tags: [system]
updatedDate: "Apr 05 2023"
---

## Setting up development environment
1. The first step is getting around the firewall. You may download [clashX](https://github.com/yichengchen/clashX/releases) and acquire subscription links from ss.

2. Install [Homebrew](https://brew.sh) package manager, and you can install almost any app from the command line. Make sure everything is up to date `brew update`. (M1 installation at `/opt/homebrew/`, Intel at `/usr/local/Cellar/`)

    > If it complains `curl: fail to connect raw.gitmirror.com port 443`. It's about DNS cache poisoning, we may set DNS Server to `8.8.8.8` or update the `/etc/hosts` file.

3. Check `git --version` and may need to install Command Line Developer Tools.

4. Install VSCode, Chrome, iTerm2, Docker through Homebrew, then you can use `brew list` and `brew info google-chrome` to check.
    ```shell
    # refer to https://formulae.brew.sh
    brew install git yarn make
    brew install --cask visual-studio-code google-chrome iterm2 docker
    
    # replace with other mirror address (default is using GitHub)
    cd `brew --repo`
    git remote set-url origin https://mirrors.tuna.tsinghua.edu.cn/git/homebrew/brew.git
    brew update
    ```
  
    > - `cask` is no longer a `brew` command. When you want to install a Cask, just do `brew install` or `brew install --cask` instead of `brew cask install`
    > - install an package behind a proxy: `ALL_PROXY=127.0.0.1:7890 brew install <package>`

5. Catalina comes with `zsh` as the default shell. Install [Oh My Zsh](https://github.com/ohmyzsh/ohmyzsh) anc check the `.zshrc` file.
  - `robbyrussell` is the default theme, and you can change to use [spaceship prompt](https://github.com/spaceship-prompt/spaceship-prompt) theme.
  - show the current shell `echo $SHELL`; list all shells `cat /etc/shells`; change the current shell `chsh -s /bin/zsh`
  
    > 'unable to access error': Something is blocking the connection to github. It is likely some kind of firewall, either on your machine or in your network. If it works with a browser on same machine then the browser is probably using a proxy and you need to configure git to use this proxy too.
    > - check if your git uses proxy: `git config --global http.proxy`
    > - set proxy address: `git config --global http.proxy 127.0.0.1:7890`
    > - reset the proxy: `git config --global --unset http.proxy`

6. Use `nvm` to install Node.js, then install a version of node `nvm install xx.xx`, `nvm use xx.xx` and run `nvm ls`. Use `node -v && npm -v` to check the version. (`echo $PATH` or `which node`)
   -  nvm install script clones the nvm repository to `~/.nvm`, and attempts to add the source lines to the correct profile file like `~/.zshrc` or `~/.bashrc`.
   - `nvm ls-remote` to browse available versions
   - set default node version: `nvm alias default x.y.z` (`nvm alias default node` to make the "latest" default)
   - check npm config: `npm config ls`
   - `npm config set registry https://registry.npmmirror.com` to change the registry, `npm config delete registry` to change back to default (`https://registry.npmjs.org/`), `npm get registry` to see the current set.
   - set npm proxy `npm config set proxy http://127.0.0.1:7890` and remove this proxy `npm config delete proxy`
   <img alt="npm proxy" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/008i3skNly1gz5abxu18ij31bu0eijtx.jpg" width="700">
   - `npm list --depth=0 --silent` to see the installed non-global libraries for your current location and `npm list -g --depth=0` to find globally installed modules. (`npm ls` exits with an exit code of `1` if it finds unmet peer dependencies even with `--silent`)
   - Global Node modules will be installed at `~/.nvm/versions/node/v12.13.0/bin/` if you use nvm.
   <img alt="global node_modules" src="https://raw.gitmirror.com/kexiZeroing/blog-images/main/e6c9d24ely1h2zj27plslj218q04ydgm.jpg" width="700" />

    > package manager mirrors: https://github.com/eryajf/Thanks-Mirror
    > - Taobao: http://registry.npmmirror.com
    > - HUAWEI: https://repo.huaweicloud.com/repository/npm/
    > - Tencent: http://mirrors.cloud.tencent.com
    > ---
    > Alternative ways to `nvm`:
    > - [Volta](https://volta.sh)
    > - [fnm](https://github.com/Schniz/fnm), works with `.node-version` file

7. Set global configuration with Git `touch ~/.gitconfig`, and check with `git config --list`.
    ```
    [user]
      name   = Firstname Lastname
      email  = you@example.com
    [github]
      user   = username
    [alias]
      a      = add
      cm     = commit -m
      s      = status
      pom    = push origin master
      puom   = pull origin master
      co     = checkout
      lg     = log --pretty=format:'%h %ad%x09%an%x09%s' --date=short
    ```
    *(%h = commit hash, %x09 = tab, %an = author name, %ad = author date, %s = subject)*   

8. Some commands for Finder
    ```shell
    # Show Library folder
    chflags nohidden ~/Library

    # Show hidden files
    defaults write com.apple.finder AppleShowAllFiles YES

    # Show path bar
    defaults write com.apple.finder ShowPathbar -bool true

    # Show status bar
    defaults write com.apple.finder ShowStatusBar -bool true
    ```

    A curated list of shell commands specific to macOS: https://git.herrbischoff.com/awesome-macos-command-line/about

9. Install Chrome extension [DevTools Theme: New Moon](https://github.com/taniarascia/new-moon-chrome-devtools), then set devtool's theme to "Dark" and go to Experiments and select "Allow custom UI themes".

10. Add VSCode extentions like `Prettier`, `GitLens`, `New Moon Theme`, `Live Server`, `Import Cost`. 
   - Prettier usage: https://prettier.io/docs/en/install.html
   - [Import Cost](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost) will display inline in the editor the size of the imported packages.
   - [Preview.js](https://previewjs.com): Preview UI components in your IDE instantly. It leverages the power of Vite to support React and Vue.js. (needs NodeJS 14.18.0+ to run)
   - [Markdown PDF](https://marketplace.visualstudio.com/items?itemName=yzane.markdown-pdf) converts Markdown files to pdf, html, png or jpeg files in VSCode.
   - Add `Emoji Snippets` and `Markdown Emoji` for emoji support :tada: and check https://github.com/ikatyang/emoji-cheat-sheet for emoji shortcode to use.

11. Check out dotfiles https://github.com/mathiasbynens/dotfiles

Some references:
- https://dev.to/swyx/my-new-mac-setup-4ibi
- https://www.taniarascia.com/setting-up-a-brand-new-mac-for-development
- https://github.com/nicolashery/mac-dev-setup
- https://github.com/kentcdodds/dotfiles
- https://github.com/stefanjudis/dotfiles
- https://github.com/wesbos/dotfiles
- https://github.com/antfu/use

## Moving to zsh
From macOS Catalina the default shell is `zsh`. `zsh` has a list of configuration files (`.z*` files) that will get executed at shell startup. `zsh` will start with `/etc/zshenv`, then the user’s `.zshenv`. Since changes in the `zshenv` will affect `zsh` behavior in all contexts, you should be very cautious about the changes applied here. Next, when the shell is a login shell, `zsh` will run `/etc/zprofile` and `.zprofile`. For interactive shells `/etc/zshrc` and `.zshrc`. Then, again, for login shells `/etc/zlogin` and `.zlogin`.

**macOS Terminal considers every new shell to be a login shell and an interactive shell**. So, in Terminal a new `zsh` will potentially run all configuration files. For simplicity’s sake, you should use just one file and the common choice is `.zshrc`. Most tools you download to configure `zsh`, such as `Oh My Zsh`, will override or re-configure your `.zshrc`.

## Git for the first time
The first thing you should do when you install Git is to set your user name and email address. This is important because every Git commit uses this information. Use `git config --list` (`git config --global --list`) command to list all the settings.
```shell
# settings in a global ~/.gitconfig file located in your home directory
git config --global user.name "Your name here"
git config --global user.email "your_email@example.com"
git config --global color.ui true

# remove a git config
git config --global --unset user.name
```

### Cloning with HTTPS or SSH
When you `git clone` using HTTPS URLs on the command line, Git will ask for your GitHub username and password the first time. It is likely that Git will use a credential helper provided by your operating system. If so, your GitHub credentials were cached and this setup applies across repos. Password-based authentication for Git is [deprecated](https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations), and we recommend using a **personal access token (PAT)** when prompted for a password instead. Once you have a token, you can enter it instead of your password when performing Git operations over HTTPS. (If you are not prompted for the username and password, your credentials may be cached on your computer. You can update your credentials in the Keychain to replace your old password with the token).
   
SSH URLs provide access to a Git repository via SSH, a secure protocol. To use these URLs, you must generate an SSH keypair on your computer and add the public key to your GitHub account.

1. Enter the directory `cd ~/.ssh`
2. Generate the personalised SSH key `ssh-keygen` *(multiple SSH keys: `ssh-keygen -t rsa -b 4096 -C email@another.com -f $HOME/.ssh/another/id_rsa`)*
3. Copy the key `cat id_rsa.pub | pbcopy`
4. Go to Github Settings -> select SSH and GPG keys -> New SSH Key. Give the SSH key a description so we can know which device it belongs too (i.e., MacBook Pro 2020).
5. Type `ssh-add -K ~/.ssh/id_rsa` to store the passphrase (`-K` for adding in your keychain). Note that **the addition of keys to the agent is transient** and they last only as long as the agent is running. If you kill it or restart your computer they're lost until you re-add them again.
6. Optional, type `ssh -T git@github.com` to test the connection.

<img alt="https ssh" src="https://ftp.bmp.ovh/imgs/2020/10/830c711c7263ab75.png" width="700">

### PAT in Azure DevOps
A personal access token (PAT) is used as an alternate password to authenticate into Azure DevOps. Treat and use a PAT like your password. PATs are given permissions from a broad set of read and write scopes. They have access to all of the repositories and organizations that the user could access. Once you have a token, you can enter it instead of your password when performing Git operations over HTTPS. *If you are not prompted for your username and password, your credentials may be cached on your computer. You can update your credentials in the Keychain to replace your old password with the token.*

The **user's `.npmrc`** should contain credentials for all of the registries that you need to connect to. The NPM client will look at your **project's `.npmrc`**, discover the registry, and fetch matching credentials from user's `.npmrc`. This enables you to share project's `.npmrc` with the whole team while keeping your credentials secure.

If you are developing on Windows, you only need to provide registries like `@foo:registry=https://pkgs.dev.azure.com/xxx/` in the user `.npmrc` file and run `vsts-npm-auth -config .npmrc` command on a periodic basis. Vsts will automatically create PAT tokens in Azure DevOps for each registry and inject credentials into your `.npmrc` file.

If you are developing on Linux or Mac, vsts-npm-auth is not supported and we need to set up credentials manually. First generate a personal access token with packaging read & write scopes, and then Base64 encode the PAT. Now use the encoded PAT values as password in the user `.npmrc` file (also need the organization, feed, username, and email).

## Debug iOS Safari from your Mac
1. On your iPhone, go to Settings > Safari > Advanced and toggle on `Web Inspector`.
2. On your Mac, open Safari and go to Safari > Preferences > Advanced then check `Show Develop menu in menu bar`.
3. Connect your iPhone to your Mac with the USB cable.
4. On your iPhone, open the web site that you want to debug.
5. On your Mac, in Safari, the name of the iOS device will appear as a submenu in the `Develop menu`. This will open a Web Inspector window on your Mac.
