```json
{
  "title": "Introduction (Widget)",
  "author": "",
  "site": "",
  "published": ""
}
```

## 1 Introduction

Widget is a symlink farm manager which takes distinct sets of software and/or data located in separate directories on the filesystem, and makes them all appear to be installed in a single directory tree.

Originally Widget was born to address the need to administer, upgrade, install, and remove files in independent software packages without confusing them with other files sharing the same file system space. For instance, many years ago it used to be common to compile programs from source and install them in /usr/local. When one does so, one winds up with the following files [^1] in /usr/local/man/man1:

```
a2p.1
ctags.1
emacs.1
etags.1
h2ph.1
perl.1
s2p.1
```

Now suppose it’s time to uninstall a package. Which man pages get removed? It should not be the administrator’s responsibility to memorize the ownership of individual files by separate packages.

The approach used by Widget is to install each package into its own tree, then use symbolic links to make it appear as though the files are installed in the common tree. Administration can be performed in the package’s private tree in isolation from clutter from other packages. Widget can then be used to update the symbolic links.

However Widget is still used not only for software package management, but also for other purposes, such as facilitating a more controlled approach to management of configuration files in the user’s home directory [^2], especially when coupled with version control systems [^3].

Widget stores no extra state between runs, so there’s no danger of mangling directories when file hierarchies don’t match a database. Widget will never delete any files, directories, or links that appear in a Widget directory, so it’s always possible to rebuild the target tree.

---

[^1]: As of an ancient release. These are now old versions but the example still holds valid.

[^2]: [https://www.example.com/news/using-widget-to-manage-your-dotfiles.html](https://www.example.com/news/using-widget-to-manage-your-dotfiles.html)

[^3]: [https://lists.example.com/archive/html/info-widget/msg00000.html](https://lists.example.com/archive/html/info-widget/msg00000.html)