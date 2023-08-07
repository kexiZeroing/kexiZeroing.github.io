---
layout: "../layouts/BlogPost.astro"
title: "Rice clear turn-in"
slug: rice-clear-turn-in
description: ""
added: "Jan 28 2019"
tags: [other]
---

CLEAR is a robust and dynamic Linux cluster with exciting features available to Rice students and faculty. The cluster is designed to offer a Linux environment available for teaching and courseware needs.

```sh
ssh kd38@ssh.clear.rice.edu

scp ~/Documents/Rice/DB530/A0.zip kd38@ssh.clear.rice.edu:/storage-home/k/kd38
```

- Mac OS X has a built-in SSH client which can be used to connect to remote servers.
- In Unix, you can use `scp` command to securely copy files and directories between remote hosts without starting an FTP session or logging into the remote systems explicitly. The `scp` command uses SSH to transfer data, so it requires a password or passphrase for authentication. Unlike rcp or FTP, `scp` encrypts both the file and any passwords exchanged so that anyone snooping on the network cannot view them.
- To upload: `scp /path/to/localfile user@host:/path/to/dest`. To download: `scp user@remote_host:remote_file local_file`

```sh
# Create tar Archive File
# c – Creates a new .tar archive file
# v – Verbosely show the .tar file progress
# z - Create a compressed gzip archive file (tar.gz and tgz are similar)
# f – File name and type of the archive file

tar -cvf tecmint-14-09-12.tar /home/tecmint/
tar -cvzf MyImages-14-09-12.tar.gz /home/MyImages
tar -cvzf MyImages-14-09-12.tgz /home/MyImages

# To extract a tar file, use option -C (specified directory) to untar in a different directory
tar -xvf public_html-14-09-12.tar
tar -xvf public_html-14-09-12.tar -C /home/public_html/videos/ 

# To list the contents of tar archive file
tar -tvf uploadprogress.tar
```

The code must compile and run on Clear. That way, we have a common environment for grading and we don’t have to spend time getting your code to compile. First you need to install the **SCons** build tool. SCons is a modern build tool (sort of like `Make`, but far more useful because it is Python-based, and it allows you to include scripting code within your build tool). 

And now you can run `~/scons/bin/scons-2.4.1`, but nothing is going to happen because there is no **SConstruct** file in this directory to tell SCons what to do. (If you're used to build systems like Make you've already figured out that the SConstruct file is the SCons equivalent of a Makefile.)

- Go into the build directory and use SCons to build the project.
- Once the build completes, you can run the test code: `bin/someUnitTest`.
- Note that as long as you keep your header and source files in the directories that are currently there, SCons will automatically find and build them.

Please don't include executables and object files in your submission. Basically, you should submit a clean version of your project that can be built using scons. BTW, you can use scons to clean everything by using `scons -c`. This will remove everything that has been built. 
