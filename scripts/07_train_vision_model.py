"""
07_train_vision_model.py
Bovine Mastitis Image Classification & Vision Feature Extraction (PS #26109)
Dataset: SCTL Bovine Teat Condition & Udder Health Scoring Dataset (1,500+ Images)

Classes:
- 0: Score 1 -> No Risk (Healthy, smooth teat end, closed orifice)
- 1: Score 2 -> Low Risk (Smooth hyperkeratotic ring, slight stress)
- 2: Score 3 -> Moderate Risk (Rough ring, keratin breakdown; 7-14 day subclinical infection gateway)
- 3: Score 4 -> High Risk (Very rough/cracked everted orifice; acute clinical flare portal)
"""

import json
import time
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "raw" / "sctl"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Device selection: MPS (Apple Silicon GPU) if available, else CPU
DEVICE = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"[*] Vision Training Device: {DEVICE}")

class BovineTeatDataset(Dataset):
    """Loads bovine teat and udder images with labels."""
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        path = self.image_paths[idx]
        try:
            image = Image.open(path).convert("RGB")
        except Exception:
            # Fallback black image if corrupt
            image = Image.new("RGB", (224, 224), (0, 0, 0))
            
        label = self.labels[idx]

        if self.transform:
            image = self.transform(image)

        return image, label

def load_sctl_data():
    """Compiles train and test sets from SCTL dataset folders."""
    train_paths = []
    train_labels = []
    
    # Class mapping: Score_1 -> 0, Score_2 -> 1, Score_3 -> 2, Score_4 -> 3
    class_dirs = {
        "Score_1": 0,
        "Score_2": 1,
        "Score_3": 2,
        "Score_4": 3
    }
    
    for folder_name, label in class_dirs.items():
        folder_path = DATA_DIR / folder_name
        if folder_path.exists():
            files = list(folder_path.glob("*.jpg")) + list(folder_path.glob("*.png"))
            for f in files:
                train_paths.append(str(f))
                train_labels.append(label)
                
    print(f"[+] Loaded {len(train_paths)} training images across 4 risk scores.")
    for folder_name, label in class_dirs.items():
        cnt = sum(1 for l in train_labels if l == label)
        print(f"    - {folder_name} (Risk Tier {label}): {cnt} images")
        
    # Load Test dataset from sample_results.csv
    test_paths = []
    test_labels = []
    csv_file = DATA_DIR / "sample_results.csv"
    test_dir = DATA_DIR / "Test"
    
    if csv_file.exists() and test_dir.exists():
        df_test = pd.read_csv(csv_file, header=None, names=["filename", "label"])
        for _, row in df_test.iterrows():
            img_path = test_dir / str(row["filename"]).strip()
            if img_path.exists():
                test_paths.append(str(img_path))
                test_labels.append(int(row["label"]))
                
    print(f"[+] Loaded {len(test_paths)} test images with ground-truth labels.")
    return train_paths, train_labels, test_paths, test_labels

def build_model(num_classes=4):
    """Constructs a transfer-learning convolutional backbone (MobileNetV3)."""
    # MobileNetV3 is fast, lightweight, and highly effective for edge inference
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    in_features = model.classifier[3].in_features
    
    # Custom classifier head with Dropout for regularization
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 128),
        nn.ReLU(inplace=True),
        nn.Linear(128, num_classes)
    )
    return model

def train_and_evaluate():
    train_paths, train_labels, test_paths, test_labels = load_sctl_data()
    
    # Image Transforms & Augmentation
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    test_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_dataset = BovineTeatDataset(train_paths, train_labels, transform=train_transform)
    test_dataset = BovineTeatDataset(test_paths, test_labels, transform=test_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, drop_last=False)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)
    
    # Class weights to handle imbalance (Score 4 has fewer samples)
    class_counts = [sum(1 for l in train_labels if l == i) for i in range(4)]
    total_samples = len(train_labels)
    class_weights = [total_samples / (4.0 * max(c, 1)) for c in class_counts]
    weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(DEVICE)
    print(f"[+] Computed inverse class weights: {[round(w, 2) for w in class_weights]}")
    
    model = build_model(num_classes=4).to(DEVICE)
    criterion = nn.CrossEntropyLoss(weight=weights_tensor)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=12)
    
    print("\n[*] Training Bovine Teat & Udder Vision Network...")
    epochs = 12
    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for images, labels in train_loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            
        scheduler.step()
        epoch_loss = running_loss / total
        epoch_acc = correct / total * 100.0
        elapsed = time.time() - t0
        print(f"    Epoch {epoch:2d}/{epochs} - Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:5.1f}% ({elapsed:.1f}s)")
        
    # Evaluation on Independent Test Set
    print("\n[*] Evaluating on Independent SCTL Test Set (380 Images)...")
    model.eval()
    all_preds = []
    all_targets = []
    all_probas = []
    
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(DEVICE)
            outputs = model(images)
            probas = torch.softmax(outputs, dim=1).cpu().numpy()
            preds = np.argmax(probas, axis=1)
            
            all_preds.extend(preds)
            all_targets.extend(labels.numpy())
            all_probas.extend(probas)
            
    test_acc = accuracy_score(all_targets, all_preds)
    f1_mac = f1_score(all_targets, all_preds, average="macro")
    print(f"\n=======================================================")
    print(f" TEST SET RESULTS (380 Bovine Images):")
    print(f" - Test Accuracy:   {test_acc * 100:.2f}%")
    print(f" - Macro F1-Score: {f1_mac:.4f}")
    print(f"=======================================================\n")
    
    # Save Model Weights & TorchScript / Metadata
    save_path = MODELS_DIR / "bovine_mastitis_vision_model.pt"
    torch.save(model.state_dict(), save_path)
    print(f"[✓] Vision model weights saved to {save_path}")
    
    vision_meta = {
        "architecture": "MobileNetV3-Small (Transfer Learning)",
        "num_classes": 4,
        "classes": [
            "Score 1: No Risk (Healthy Teat Orifice)",
            "Score 2: Low Risk (Smooth Hyperkeratosis Ring)",
            "Score 3: Moderate Risk (Rough Ring - 7-14d Early Warning)",
            "Score 4: High Risk (Severe Ulcerative/Cracked Orifice)"
        ],
        "test_accuracy": round(float(test_acc), 4),
        "f1_macro": round(float(f1_mac), 4),
        "train_samples": len(train_paths),
        "test_samples": len(test_paths),
        "device": str(DEVICE)
    }
    
    with open(MODELS_DIR / "vision_metadata.json", "w") as f:
        json.dump(vision_meta, f, indent=2)
        
    print(f"[✓] Vision metadata saved to {MODELS_DIR / 'vision_metadata.json'}")
    return model, vision_meta

if __name__ == "__main__":
    train_and_evaluate()
