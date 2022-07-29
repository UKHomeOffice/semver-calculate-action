const semver = require("semver");
const core = require("@actions/core");

function getAllowedSemverIdentifier() {
  return [
    "pre",
    "premajor",
    "preminor",
    "prepatch",
    "prerelease",
    "major",
    "minor",
    "patch",
  ];
}

function calculateNewTag(base, increment) {
  core.info(`Using tag ${base} with increment "${increment}".`);

  if (!isValidSemverIncrement(increment)) {
    core.setFailed(
        `Invalid increment or SemVer tag provided, acceptable increment values are: ${getAllowedSemverIdentifier().toString()}.`
    );
    return;
  }
  if (!semver.valid(base)) {
    core.setFailed("Invalid base SemVer tag, unable to calculate increment.");
    return;
  }

  core.info(`Incrementing latest tag value ${base} by "${increment}".`);
  const newValue = semver.inc(base, increment.toString()).toString();
  core.info(`Calculated new tag value: ${newValue}`);

  return newValue;
}

function isValidSemverIncrement(identifier) {
  return getAllowedSemverIdentifier().includes(identifier?.toLowerCase());
}

function sortTags(tags) {
  return tags
    .filter((tag) => semver.valid(tag.semver))
    .sort((tagA, tagB) => semver.rcompare(tagA.semver, tagB.semver, true));
}

module.exports = {
  calculateNewTag,
  isValidSemverIncrement,
  sortTags,
};
