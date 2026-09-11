import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

let mobileNetModel: mobilenet.MobileNet | null = null;
let isLoadingModel = false;

// ── Comprehensive Non-Bovine & Human Keywords for Zero-Shot Rejection ──────────
const NON_BOVINE_KEYWORDS = [
  // 1. Humans, body parts, fingers, hands, faces
  "person", "human", "man", "woman", "boy", "girl", "child", "baby", "adult", "teenager",
  "finger", "hand", "thumb", "index", "nail", "fingernail", "wrist", "arm", "palm", "knuckle", "fist",
  "face", "head", "eye", "nose", "mouth", "lip", "ear", "forehead", "chin", "cheek", "beard", "mustache",
  "leg", "foot", "toe", "knee", "thigh", "ankle", "heel", "skin", "flesh", "torso", "chest", "abdomen", "stomach",
  "groom", "bride", "selfie",

  // 2. Clothing, wearables, accessories
  "suit", "jersey", "t-shirt", "shirt", "sweatshirt", "dress", "gown", "cloak", "abaya", "kimono",
  "cardigan", "jean", "jeans", "pants", "trousers", "shorts", "shoe", "sock", "sneaker", "boot", "sandal",
  "hat", "cap", "sunglasses", "handbag", "purse", "backpack", "wallet", "jacket", "coat", "tie", "belt",
  "band-aid", "bandage", "glove", "mitten", "ring", "bracelet", "wristwatch", "watch", "necklace",

  // 3. Electronics, indoor items, furniture
  "phone", "cellular", "cellphone", "cell", "mobile phone", "smart phone", "iphone", "android",
  "laptop", "notebook", "keyboard", "computer keyboard", "space bar", "mouse", "screen", "monitor",
  "television", "tv", "desk", "dining table", "table", "chair", "folding chair", "armchair", "couch", "sofa",
  "bed", "pillow", "blanket", "bottle", "cup", "mug", "plate", "bowl", "fork", "spoon", "knife",
  "pen", "pencil", "book", "paper", "envelope", "packet", "carton", "box", "remote control", "joystick",
  "camera", "clock", "wall clock", "light", "lamp", "fan",

  // 4. Non-bovine animals & vehicles
  "dog", "puppy", "cat", "kitten", "bird", "parrot", "fish", "snake", "horse", "zebra", "pig", "swine",
  "hog", "sheep", "ram", "monkey", "ape", "gorilla", "elephant", "bear", "lion", "tiger", "rabbit",
  "hare", "mouse", "rat", "car", "automobile", "truck", "bus", "bicycle", "motorcycle", "scooter",
  "van", "train", "airplane", "boat", "ship", "wheel", "tire",

  // 5. Environment & structures
  "tree", "plant", "flower", "rose", "leaf", "grass", "forest", "mountain", "building", "window",
  "door", "wall", "room", "floor", "ceiling", "carpet", "tile", "pavement", "road", "street",
];

export interface ValidationResult {
  isValid: boolean;
  detectedSubject: string;
  confidence: number;
  reason: string;
  hindiReason: string;
  tamilReason: string;
}

/**
 * Validates an image using MobileNet zero-shot classification to detect humans,
 * fingers, hands, everyday objects, and non-bovine scenes.
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

    const predictions = await mobileNetModel.classify(canvasOrImage, 6);
    if (!predictions || predictions.length === 0) return { isNonBovine: false };

    for (const p of predictions) {
      const classNameLower = p.className.toLowerCase();
      // If probability >= 5% and matches any non-bovine/human/object keyword
      if (p.probability >= 0.05) {
        const matchedKw = NON_BOVINE_KEYWORDS.find((kw) =>
          classNameLower.includes(kw)
        );
        if (matchedKw) {
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

/**
 * Biometric heuristic to detect human fingers, hands, and human skin dermis.
 * Human fingers typically present as high aspect-ratio vertical cylinders
 * with smooth uniform flesh tone without bovine teat papillae/creases.
 */
export function checkHumanFingerOrHand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): { isFingerOrHand: boolean; reason?: string } {
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    const totalPixels = w * h;

    let humanSkinCount = 0;
    let minX = w, maxX = 0, minY = h, maxY = 0;
    let rSum = 0, gSum = 0, bSum = 0;

    for (let idx = 0; idx < totalPixels; idx++) {
      const i = idx * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const x = idx % w;
      const y = Math.floor(idx / w);

      // Human skin cluster: R > G > B, with normalized R > 0.38, G > 0.28, B < 0.30
      const totalRgb = r + g + b + 0.001;
      const normR = r / totalRgb;
      const normG = g / totalRgb;
      const normB = b / totalRgb;

      const isHumanSkin =
        r > 95 && g > 40 && b > 20 &&
        (r - g) > 15 && (r - b) > 15 &&
        normR > 0.38 && normG > 0.26 && normB < 0.32;

      if (isHumanSkin) {
        humanSkinCount++;
        rSum += r;
        gSum += g;
        bSum += b;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    const skinRatio = humanSkinCount / totalPixels;
    const bboxW = Math.max(1, maxX - minX);
    const bboxH = Math.max(1, maxY - minY);
    const aspectRatio = bboxH / bboxW;

    // A finger held up to camera has high vertical aspect ratio (> 2.3) or high horizontal aspect ratio (> 2.3)
    // with smooth uniform pink/peach tone
    if (skinRatio > 0.15 && skinRatio < 0.85 && (aspectRatio > 2.3 || aspectRatio < 0.43)) {
      return {
        isFingerOrHand: true,
        reason: "Human Finger / Appendage Detected",
      };
    }

    return { isFingerOrHand: false };
  } catch {
    return { isFingerOrHand: false };
  }
}
