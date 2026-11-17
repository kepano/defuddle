```json
{
  "title": "Setting Up the Tool",
  "author": "Jane Doe",
  "site": "Example Docs",
  "published": ""
}
```

This page walks through a first installation. It assumes a recent operating system and a working network connection, and it takes about fifteen minutes from start to finish on most machines.

## Steps

1. [Download the installer](#step-1)
2. [Run the installer and accept the license](#step-2)
3. [Restart your computer](#step-3)

## Step 1

Download the installer from the release page. Pick the build that matches your processor, and check the file size against the value listed next to the download link before opening it.

## Step 2

Open the installer and follow the prompts. The default location works for most people, but you can choose another folder if your system drive is short on space.

## Step 3

Restart the computer so that the background service starts with the new settings. After the restart, the tool appears in the application menu and is ready to use.

The package is also available through the common package managers. Pick the one your project already uses:

- [npm](#pm-one)
- [yarn](#pm-two)
- [pnpm](#pm-three)

Run the install command with npm in the project folder.

Run the add command with yarn in the project folder.

Run the add command with pnpm in the project folder.

Whichever manager you pick, keep the lock file under version control. It records the exact versions that were installed, so every machine that builds the project ends up with the same set of files.

Each manager installs the same files, so the choice only affects how the dependency is recorded in your project and how updates are applied later on.

[Next](https://partner.example.net/offer)

Next: [Configure the tool](https://example.com/docs/configure)