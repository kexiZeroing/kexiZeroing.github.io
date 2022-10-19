---
layout: "../layouts/BlogPost.astro"
title: "Simple guide to CI/CD for FE projects"
slug: simple-guide-to-cicd-for-fe-projects
description: ""
added: "Sep 11 2022"
---

### Linting, Formatting, and Unit tests
Linting and formatting are essential to keep your codebase consistent and clean. Each team member should follow the same rules and conventions when it comes to writing code.

- [ESlint](https://eslint.org) for linting, it comes with a set of rules to write proper Javascript, and these rules can be customized to your own team's fit.
- [Prettier](https://prettier.io) for formatting. I set it up in my project and editor in a way that saving a file will format it automatically for me.

You can execute this step as a [pre-commit hook](https://githooks.com) as it will ensure that the code is formatted and readable before it's up for review by your teammates.

Unit tests are fast to run, fast to fail. They should not take an extensive amount of time to run and should reveal errors or bugs in a matter of a few seconds or even a few minutes depending on the scale of your project. In a React project, for example, these tests can cover Components, Reducers / State / Actions, Utility functions.

### Integration and end-to-end testing
While unit tests help to test parts of your project in isolation, integration tests help to test whether an entire set of units work together as expected. They also allow you to test full user flows and all the different paths they can take.

- Navigation: Does clicking on the user setting menu item load the expected view?
- Forms: Fill up the form in all possible ways (valid and invalid, with and without optional fields). Test that the expected error messages are displayed when invalid. Validate that clicking on submit sends the right payload when valid.
- Views depending on external data: Test your list view that's fetching some data with different mocked API responses: does it show the proper empty state if there's no data? Is the filter button enabled if your API returned an error? Does it show a notification if the fetch was successful?

End-to-End tests are the set of tests that are the closest to what the user should experience when using your product. In most frameworks like Selenium or Cypress, an e2e test suite is nothing more than a scripted user flow that the computer will go through. Most of these tests will be executed directly within a browser.

### Automation
The objective for your team should be to automate as much as possible, from running the tests to previewing the deployments, to deploying to production. The only manual step left in your CI/CD pipeline should be the code review.

We know how to run these tests locally but we want to ensure that these tests can be run automatically every time a change occurs on the codebase. I am in favor of running these tests on every pull request. Each change has to be tested before it's merged to the main branch without any exception. As my main tool for automation, I've been using [Github CI, Actions and Workflows](https://docs.github.com/en/actions) for both work-related and personal projects. Example of Github Workflow that runs automated tests on every PR:

```yaml
name: Linting Formatting Unit and Integration Tests

on:
  pull_request:
    branch:
      # This ensures these tests are run on pull requests that are open against the branch "main"
      - 'main'

jobs:
  validate-code-and-test:
    runs-on: ubuntu-20.04
    strategy:
      matrix:
        # If your app or package needs to be tested on multiple versions of node, 
        # you can specify multiple versions and your workflow will be run on each one of them
        node: [12.x]
    steps:
      - name: Checkout Commit
        uses: actions/checkout@v2
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - name: Use Node.js ${{ matrix.node }}
        uses: actions/setup-node@v1
        with:
          node: ${{ matrix.node }}
      - name: Install Dependencies
        run: |
          yarn install --non-interactive
      - name: Run Prettier
        run: |
          yarn format
      - name: Run Lint
        run: |
          yarn lint
      - name: Run Unit and Integration tests
        run: |
          yarn jest
```

Another thing I tend to run on every PR is **preview deployments**. You can get a standalone deployment each PR that is accessible through a unique endpoint. Each deployment is a version of your frontend project with a specific change. This can not only help your team to speed up reviews, but it also lets your design and product team validate some new features easily.

The last thing we want to automate is the release process. You do not want to have to run 20 scripts, manually, in a specific order, to get your application from your main branch to production. For this, I tend to favor having a release branch and the automated scripts run every time the main branch is merged on the release branch. Example of Release Github Workflow:

```yaml
name: Build and Deploy to Production

on:
  push:
    branches:
      # Any push on the production branch will trigger this workflow
      - 'production'
jobs:
  build-and-deploy:
    runs-on: ubuntu-20.04
    strategy:
      matrix:
        node: [12.x]
    steps:
      - name: Checkout Commit
        uses: actions/checkout@v2
        with:
          ref: ${{ github.event.pull_request.head.sha }}
      - name: Use Node.js ${{ matrix.node }}
        uses: actions/setup-node@v1
        with:
          node: ${{ matrix.node }}
      - name: Install Dependencies
        run: |
          yarn install --non-interactive
      - name: Build UI
        run: yarn build
        env:
          NODE_ENV: production
      - name: Deploy to production
        run: yarn deploy:production
        env: SOME_TOKEN_TO_DEPLOY=${{ secrets.MY_PRODUCTION_TOKEN }}
        # Never expose tokens! Github has a very handy secrets feature that can 
        # store your tokens securely, and allows them to be used in any workflow.
```
