# toss-file

Visual Studio Code plugin for copying the current file to new pre-mapped locations

## Extension Settings

- Always use a trailing slash to the end of the path mappings you list
- On Windows the root drive folder name must be lower case in your path mappings, for example c: instead of C:

Windows
```
"tossfile.pathMapping": [
    {
        "input": "c:\\home\\source1\\",
        "output": "c:\\home\\destination1\\"
    },
    {
        "input": "c:\\home\\source2\\",
        "output": "c:\\home\\destination2\\"
    }
]
```

*nix
```
"tossfile.pathMapping": [
    {
        "input": "/home/source1/",
        "output": "/home/destination1/"
    },
    {
        "input": "/home/source2/",
        "output": "/home/destination2/"
    }
]
```

Control how long the status message appears (in seconds) in the footer of the file the command was run in. A value of 0 turns off the status message.
```
"tossfile.statusTimeout": 5
```

Replace an exisiting file at the output location if it already exists. Default is true.
```
"tossfile.replaceIfExists": true
```

## Example Scenarios

Invoke the plugin by pressing `Ctrl+Shift+P` or `Cmd+Shift+P` and executing the `Toss File` command

Example 1 (assume you are using the settings listed above):

1. Run the toss file command against a file, for example `/home/source1/my/special/file/file.txt`
2. The file is copied to `/home/destination1/my/special/file/file.txt`
3. If the directories at step 2 don't already exist, they will be created

Example 2 (assume you are using the settings listed above):

1. Run the toss file command against a file, for example `/home/source77/my/special/file/file.txt`
2. No matches found, nothing happens
