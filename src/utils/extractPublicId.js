function extractPublicId(url) {
    // Basic Cloudinary URL:
    // https://res.cloudinary.com/<cloud>/image/upload/v1234567890/folder/image.jpg
    // We want: folder/image   OR   image   if no folder
    const parts = url.split('/');
    const filename = parts[parts.length - 1];           // image.jpg
    const publicId = filename.split('.')[0];            // image

    // If there is a folder one level up, prepend it

    // const folder = parts[parts.length - 2];
    // if (folder && folder !== 'upload') {
    //   return `${folder}/${publicId}`;
    // }

    return publicId;
}

export default extractPublicId;

