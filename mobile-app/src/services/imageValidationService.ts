import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

let mobileNetModel: mobilenet.MobileNet | null = null;
let isLoadingModel = false;

// Common non-bovine ImageNet keywords for zero-shot rejection
const NON_BOVINE_KEYWORDS = [
  "phone", "cellular", "cellphone", "cell", "mobile phone", "laptop", "notebook",
  "keyboard", "computer keyboard", "space bar", "mouse", "screen", "monitor",
  "television", "desk", "dining table", "table", "chair", "folding chair", "armchair",
  "person", "groom", "suit", "jersey", "t-shirt", "shirt", "sweatshirt", "dress",
  "gown", "cloak", "abaya", "kimono", "cardigan", "jean", "shoe", "sock",
  "hat", "cap", "sunglasses", "handbag", "purse", "backpack", "wallet", "bottle",
  "cup", "mug", "plate", "car", "automobile", "truck", "bus", "bicycle", "motorcycle",
  "wheel", "tire", "dog", "cat", "bird", "parrot", "fish", "tree", "plant",
  "flower", "building", "window", "door", "wall", "room", "floor", "ceiling",
  "pen", "pencil", "book", "paper", "envelope", "packet", "carton"
];

/**
 * Validates an image using MobileNet zero-shot classification to detect common non-bovine subjects.
 */
export async function validateImageWithMobileNet(
  canvasOrImage: HTMLCanvasElement | HTMLImageElement
): Promise<{
  isNonBovine: boolean;
  detectedClass?: string;
  confidence?: number;
}> {
  try {
    if (!mobileNetModel && !isLoadingModel) {
      isLoadingModel = true;
      mobileNetModel = await mobilenet.load({ version: 2, alpha: 0.5 });
      isLoadingModel = false;
    }
    if (!mobileNetModel) return { isNonBovine: false };

    const predictions = await mobileNetModel.classify(canvasOrImage, 5);
    if (!predictions || predictions.length === 0) return { isNonBovine: false };

    for (const p of predictions) {
      const classNameLower = p.className.toLowerCase();
      // If probability >= 10% and matches non-bovine everyday objects/scenes
      if (p.probability >= 0.10) {
        const matchesNonBovine = NON_BOVINE_KEYWORDS.some((kw) =>
          classNameLower.includes(kw)
        );
        if (matchesNonBovine) {
          return {
            isNonBovine: true,
            detectedClass: p.className.split(",")[0],
            confidence: Math.round(p.probability * 100),
          };
        }
      }
    }

    return { isNonBovine: false };
  } catch (err) {
    console.warn("MobileNet check skipped or failed:", err);
    return { isNonBovine: false };
  }
}
