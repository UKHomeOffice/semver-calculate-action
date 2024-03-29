const github = require("@actions/github");
const core = require("@actions/core");

async function getTagsForRepo(token) {
  core.info("Getting tags from repository.");

  const { data: tags } = await github.getOctokit(token).rest.repos.listTags({
    owner: github.context.payload.repository.owner.login,
    repo: github.context.payload.repository.name,
  });

  core.info(`Retrieved ${tags.length} tags from repository.`);

  return tags.map((tag) => ({
    semver: tag.name,
    sha: tag.commit?.sha,
  }));
}

function getHeadTag(tags) {
  const headSha = getHeadRefSha()
  return tags.find((tag) => tag.sha === headSha);
}

function getHeadRefSha({ context } = github) {
  if (isPullRequest()) {
    return context.payload.pull_request.base?.sha;
  } else if (isWorkflowDispatch()) {
    return context.sha;
  }
}

function valueExistsAsTag(tags, semver) {
  return tags.some((tag) => tag.semver === semver);
}

const isValidEventType = () => {
  return isPullRequest() || isWorkflowDispatch();
};

const isPullRequest = ({ context } = github) => {
  return ["pull_request", "pull_request_target"].includes(context.eventName);
};

const isWorkflowDispatch = ({ context } = github) => {
  return context.eventName === "workflow_dispatch";
};

const getActionInputs = (variables) => {
  return variables.reduce((obj, variable) => {
    let value = core.getInput(variable.name, variable.options);
    if (!value) {
      if (variable.hasOwnProperty("default")) {
        value = variable.default;
      }
    }
    return Object.assign(obj, { [variable.name]: value });
  }, {});
};

module.exports = {
  getActionInputs,
  getHeadTag,
  getTagsForRepo,
  isValidEventType,
  valueExistsAsTag,
};
