# webapp-timelapse

## Installation

Clone from github, npm install:

```
git clone https://github.com/wiggzz/webapp-timelapse
npm install
```

## Usage

Take a look at the example configuration in `examples/simpleConfig.js`.

The simple example clones the `font-dragr` and starts a protractor browser session for taking screenshots.  Then it checks out each commit between one with a SHA starting with `0134fb69cf...` and one with a SHA starting with `2d2d3f26e6...`.  Inside `repo.select().apply()` for each commit `timelapse` will:

1. lock the directory
2. checks out the commit
3. run the callback for each active selection

It is possible to assign actions to be executed at the beginning of a group of commits by using `.beforeAll()`, or assign actions to be executed at the end of a group of commits by using `.afterAll()`.

The callback uses the `timelapseRepository.context()` function to obtain an execution context that will execute commands in the working directory of the repository.  Additionally, it will make sure that the commands are executed in sequence.  Use the `repositoryContext.call()` function to execute arbitrary functions in sequence with other commands.
