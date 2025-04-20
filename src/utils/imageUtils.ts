
export const processImageUrl = (imageUrl: string | Record<string, any> | undefined): string | undefined => {
  if (!imageUrl) return undefined;
  
  if (typeof imageUrl === 'string') {
    try {
      const parsedImage = JSON.parse(imageUrl);
      if (parsedImage && typeof parsedImage === 'object' && 'url' in parsedImage) {
        return parsedImage.url as string;
      }
    } catch (e) {
      // Not JSON, use as-is
      return imageUrl;
    }
    return imageUrl;
  } 
  
  // Handle object with URL property
  if (typeof imageUrl === 'object' && imageUrl !== null && !Array.isArray(imageUrl)) {
    const imgObj = imageUrl as Record<string, any>;
    if ('url' in imgObj && imgObj.url) {
      return imgObj.url as string;
    }
  }
  
  // Handle array of images
  if (Array.isArray(imageUrl) && imageUrl.length > 0) {
    const firstItem = imageUrl[0];
    if (typeof firstItem === 'string') {
      return firstItem;
    } else if (firstItem && typeof firstItem === 'object' && firstItem !== null) {
      const imgObj = firstItem as Record<string, any>;
      if ('url' in imgObj && imgObj.url) {
        return imgObj.url as string;
      }
    }
  }
  
  return undefined;
};
