# webapp-timelapse

## Installation

Clone from github, npm install:

```
git clone https://github.com/wiggzz/webapp-timelapse
cd webapp-timelapse
npm install
```

## Usage

Take a look at the example configuration in `examples/font-dragr.js`.

To run it, install as above, and then run

```
node examples/simpleConfig.js
```

The simple example clones https://github.com/ryanseddon/font-dragr into a temporary directory and starts a protractor browser session for taking screenshots.  Then it checks out each commit between one with a SHA starting with `0134fb69cf...` and one with a SHA starting with `2d2d3f26e6...`, and then runs any assigned tasks.

`repo.select()` returns a selection object that provides some convenience functions for selecting commit ranges.  The `.from()` function allows one to specify where to start a selection with a string that matches the beginning of the commit SHA, `.end()` specifies the ending commit.

Inside `repo.select().apply()` for each commit it will:

1. lock the directory
2. check out the commit
3. run the callback for each active selection

The callback uses the `timelapseRepository.context()` function to obtain an execution context that will execute commands in the working directory of the repository.  Additionally, it will make sure that the commands are executed in sequence.  Use the `repositoryContext.call()` function to execute arbitrary functions in sequence with other commands.

## Selecting commit ranges

```javascript
var selection = repo.select()
    .beforeAll(function() {
      // runs for the first commit
    })
    .forEach(function(commit) {
      // runs for every single commit
    })
    .afterAll(function() {
      // runs after the last commit
    })
  .from('abcdefd')
    .beforeAll(function() {
      // runs for commit abcdefd
    })
    .forEach(function(commit) {
      // runs for every commit after and including abcdef...
    })
    .afterAll(function() {
      // runs after the last commit
    })
  .to('efghij')
    .beforeAll(function() {
      // also runs for abcdefd
    })
    .forEach(function(commit) {
      // runs for every commit between abcdef... and efgij... inclusive
    })
    .afterAll(function() {
      // runs for after efghij...
    }).apply()
```

If available `commit` will be provided to the callbacks.  Each callback in `.forEach()`, `.afterAll()`, or `.beforeAll()` can return a promise which when resolved signals the completion of the actions.  Actions will be called in the order that they are added to the selection.
