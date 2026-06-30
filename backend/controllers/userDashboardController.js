import { listObjects } from "../lib/storageService.js";

export const getTotalUserPhotos = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: "UserId is required" });

    const basePrefix = `saylani-moments/${userId}/`;

    const allObjects = await listObjects(basePrefix);

    const mdImages = allObjects.filter((obj) =>
      obj.name.includes("/derivative/md/") &&
      (obj.name.endsWith(".webp") || obj.name.endsWith(".jpg") || obj.name.endsWith(".jpeg") || obj.name.endsWith(".png"))
    );

    return res.json({ totalPhotos: mdImages.length });
  } catch (err) {
    console.error("Error in getTotalUserPhotos:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

