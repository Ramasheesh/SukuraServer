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
  return `https://drive.google.com/uc?id=${id}`;
};

const buildDrivePdfUrl = (id) => {
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/view`;
};

module.exports = {
  getDriveId,
  buildDriveImageUrl,
  buildDrivePdfUrl
};
