# webapp-timelapse

[![Build Status](https://secure.travis-ci.org/wiggzz/webapp-timelapse.png?branch=master)](http://travis-ci.org/wiggzz/webapp-timelapse)


## Installation

Clone from github, npm install:

```
git clone https://github.com/wiggzz/webapp-timelapse
npm install
```

## Running

On a local repo, start whatever server is needed, and then run:

```
node bin/run --local PATH_TO_LOCAL_REPO [--max NUMBER_OF_COMMITS] [--baseUrl SERVER_URL]
```

webapp-timelapse will walk through at most NUMBER_OF_COMMITS commits backwards in time, making a request to --baseUrl with a protractor instance.  It will take a screenshot of the resulting website after waiting for angular to load.

Other options:

```
--local LOCAL_REPOSITORY   Location of the local repository to work on...working
                           directory for remote repos
--max NUMBER_OF_COMMITS    Number of commits to walk through
--baseUrl SERVER_URL       Url to request when running protractor
--protractorConfig PATH_TO_PROTRACTOR_CONFIG    Specifies an optional protractor
                                                configuration to use.
--start START_COMMAND      A command run every time a commit is checked out, to
                           prepare the repository
--finish FINISH_COMMAND    [Not implemented yet... ] A command run after
                           attempting to snapshot a commit. Should run every
                           time
--url REMOTE_REPOSITORY    A remote repository to pull down into the --local
                           directory
```

I also want to implement a way to run different commands depending on the SHA of the commit.

## Testing

No tests yet :(
