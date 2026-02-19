const { extractGoogleDriveId } = require("google-drive-id-extractor");

const getDriveId = (url) => {

  if (!url) return null;

  try {
    return extractGoogleDriveId(url);
  } catch {

    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);

    return match ? match[1] : null;

  }

};

const buildDriveImageUrl = (id) => {
  if (!id) return null;
  return `${id}/view`;
};

const buildDrivePdfUrl = (id) => {
  if (!id) return null;
  return `${id}/preview`;
};

module.exports = {
  getDriveId,
  buildDriveImageUrl,
  buildDrivePdfUrl
};
