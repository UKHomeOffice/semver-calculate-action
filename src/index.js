const core = require("@actions/core");
const {
  getActionInputs,
  getHeadTag,
  getTagsForRepo,
  isValidEventType,
  valueExistsAsTag,
} = require("../src/github");
const {
  calculateNewTag,
  sortTags,
} = require("../src/semver");

async function run() {
  try {
    if (!isValidEventType()) {
      core.setFailed(
        "Invalid event specified, it should be used on [pull_request, pull_request_target, workflow_dispatch] events."
      );
      return;
    }

    const inputs = getActionInputs([
      { name: "increment", options: { required: false } },
      { name: "github_token", options: { required: true } },
      { name: "default_to_highest", default: false },
    ]);

    const newTag = await generateSemverTag(
          inputs.github_token,
          inputs.increment,
          inputs.default_to_highest
        );

    if (!newTag) {
      core.setFailed("No new tag could be created.");
      return;
    }

    core.info(`Setting output value "version" as new tag value ${newTag}.`);
    core.setOutput("version", newTag);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function generateSemverTag(token, increment, defaultToGreatest) {
  const tags = await getTagsForRepo(token);

  if (tags.length === 0) {
    return calculateNewTag("0.0.0", increment);
  }

  let currentTag;
  if (defaultToGreatest) {
    core.info("Finding highest repository SemVer tag.");
    currentTag = sortTags(tags).shift();
  } else {
    core.info("Getting head SHA SemVer tag.");
    currentTag = getHeadTag(tags)
  }

  if (!currentTag) {
    core.warning("No usable tag found on repository.");
    return calculateNewTag("0.0.0", increment);
  }

  const newTag = calculateNewTag(currentTag.semver, increment);

  core.info(`Checking if new tag value ${newTag} already exists as tag.`);
  if (valueExistsAsTag(tags, newTag)) {
    core.setFailed(`Value ${newTag} already exists as tag`);
    return;
  }

  return newTag;
}

run();
