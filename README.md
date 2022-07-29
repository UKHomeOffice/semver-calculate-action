# Calculate a SemVer value

Action that identifies the latest SemVer tag and increments it.

### All input options

| Input                                                               | Description                                                                 | Default               | Required |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------- | -------- |
| [increment](#increment) | The amount to increment the tag by | | Yes |
| [github_token](#github_token) | Github API token | | Yes |
| [default_to_highest](#default_to_highest) | Use greatest tag when SHA is not linked to tag | false | No |

### Detailed inputs

#### increment

The main accepted values are:
* `major` e.g. 1.4.5 -> 2.0.0
* `minor` e.g. 1.4.5 -> 1.5.0
* `patch` e.g. 1.4.5 -> 1.4.6

Other accepted values include:
* `pre`
* `premajor`
* `preminor`
* `prepatch`
* `prerelease`

#### github_token

Required to make API requests and tagging. pass using `secrets.GITHUB_TOKEN`.

#### default_to_highest

Sometimes the head commit of a branch does not refer to a tag. If a user ignores certain merges into a branch - maybe using a `skip-release` approach.

In these circumstances a user may want to user the highest tag on the repository as the base.

This is coerced by a 'falsey' check on the input.

Default: `false`

### List of outputs

| Output | Description |
| --- | --- |
| version | The new SemVer tag based on the existing tag + increment |

### Usage

This action can only be triggered on the following events: `pull_request`, `pull_request_target`, `workflow_dispatch`. If used on other events the job will fail.

#### Increment tag on repository

```yaml
name: 'SemVer'
on:
  pull_request:
    types: [ closed ]

jobs:
  build:
    name: SemVer
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == true
    steps:
      - id: label
        uses: UKHomeOffice/match-label-action@main
        with:
          labels: minor,major,patch
          mode: singular

      - name: Calculate SemVer value
        id: calculate
        uses: UKHomeOffice/semver-calculate-action@main
        with:
          increment: ${{ steps.label.outputs.matchedLabels }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          default_to_highest: ${{ github.base_ref == 'main' }}

      - uses: some-provider/any-action@main
        with:
          tag: ${{ steps.calculate.outputs.version }}

      - name: Tag Repository
        uses: UKHomeOffice/semver-tag-action@main
        with:
          tag: ${{ steps.calculate.outputs.version }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          move_major_tag: true
```

### Generating dist/index.js

We use [ncc](https://github.com/vercel/ncc) to package the action into an executable file.
This removes the need to either check in the node_modules folder or build the action prior to using.

We need to ensure that the dist folder is updated whenever there is a functionality change, otherwise we won't be running the correct version within jobs that use this action.

Before creating your Pull Request you should ensure that you have built this file by running `npm run build` within the root directory.

A blocking workflow called [check-dist](.github/workflows/check-dist.yml) is enabled that checks this dist folder for changes at both 'push to main' and on 'pull request events'.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
