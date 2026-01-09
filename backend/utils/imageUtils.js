export const getBaseName = (key) => key?.split("/").pop()?.split(".")[0];

export const generateImageUrls = ({ Bucket, basePath, baseName, exts }) => {
  const baseUrl = `https://${Bucket}.s3.amazonaws.com`;
  const cleanBasePath = basePath.replace(/\/$/, "");

  return {
    id: baseName,
    thumbUrl: `${baseUrl}/${cleanBasePath}/derivative/thumb/${baseName}.${exts.thumb}`,
    mdUrl: `${baseUrl}/${cleanBasePath}/derivative/md/${baseName}.${exts.md}`,
    rawUrl: `${baseUrl}/${cleanBasePath}/rawuploads/${baseName}.${exts.raw}`,
  };
};

// export const getBaseName = (key) => key?.split("/").pop()?.split(".")[0];

// export const generateImageUrls = ({ Bucket, basePath, baseName, rawExt }) => {
//   const baseUrl = `https://${Bucket}.s3.amazonaws.com`;
//   const cleanBasePath = basePath.replace(/\/$/, "");

//   return {
//     id: baseName,
//     thumbUrl: `${baseUrl}/${cleanBasePath}/derivative/thumb/${baseName}.webp`,
//     mdUrl: `${baseUrl}/${cleanBasePath}/derivative/md/${baseName}.png`,
//     rawUrl: `${baseUrl}/${cleanBasePath}/rawuploads/${baseName}.${rawExt}`,
//   };
// };
