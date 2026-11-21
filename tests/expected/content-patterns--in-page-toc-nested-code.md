```json
{
  "title": "Example Tool README",
  "author": "Jane Doe",
  "site": "Jane Doe",
  "published": ""
}
```

## Example Tool

Example Tool manages several installed versions of a runtime side by side, so each project can pin the version it was written for without affecting the rest of the system.

## About

The tool is a single script that runs in any POSIX shell. It keeps every version in its own directory and switches between them by changing the search path of the current shell session only.

## Installing

### Install Script

Download and run the install script. It clones the repository into a directory in your home folder and adds a few lines to your shell profile so the tool loads in every new session.

### Verify Installation

Open a new terminal and run the command below. It should print the word tool, which confirms that the shell found the function.

```
command -v tool
```

## Usage

### tool use

Switches the current shell to the requested version. The change lasts until the shell exits or another version is selected, and it does not touch other open terminals.

### .toolrc

A project can commit a small file naming its version. Running the use command without an argument in that directory reads the file and selects the version it names.

### Shell Integration

Each shell can switch versions automatically when you enter a directory that contains the project file.

#### bash

Add a short function to your profile that checks for the project file whenever the working directory changes.

#### zsh

Register the same check as a directory change hook so it runs after every change of directory.

#### fish

Define an event handler on the working directory variable that performs the same check.

## License

The tool is released under a permissive open source license. See the license file in the repository for the full text.