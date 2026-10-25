type FavoriteCollectionAsset = {
  id: string;
  fileName: string;
  width: number | null;
  height: number | null;
};

type FavoriteCollectionImage = {
  id: string;
  width: number | null;
  height: number | null;
  outputAsset: FavoriteCollectionAsset;
  thumbnailAsset: FavoriteCollectionAsset | null;
  task: {
    prompt: string;
  };
};

type FavoriteCollectionImageItem = {
  id: string;
  createdAt: string;
  generatedImage: FavoriteCollectionImage;
};

/** Java FavoriteCollectionVO；列表接口返回的 items 为空数组。 */
type FavoriteCollection = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  count: {
    items: number;
  };
  items: FavoriteCollectionImageItem[];
};

/** Java FavoriteCollectionDTO */
type FavoriteCollectionRequest = {
  name: string;
};

/** Java FavoriteImageDTO */
type FavoriteImageRequest = {
  generatedImageId: string;
};

export type {
  FavoriteCollectionAsset,
  FavoriteCollectionImage,
  FavoriteCollectionImageItem,
  FavoriteCollection,
  FavoriteCollectionRequest,
  FavoriteImageRequest,
};
