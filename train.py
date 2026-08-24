import os
import torch
import torch.nn as nn
import torch.optim as optim

from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
from tqdm import tqdm


# ============================================================
# SETTINGS
# ============================================================

DATASET_PATH = r"C:\Users\lenovo\Desktop\archive"

TRAIN_DIR = os.path.join(DATASET_PATH, "train", "train")
VAL_DIR = os.path.join(DATASET_PATH, "val", "val")
TEST_DIR = os.path.join(DATASET_PATH, "test", "test")

IMAGE_SIZE = 224
BATCH_SIZE = 64
EPOCHS = 5
LEARNING_RATE = 0.0001

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", DEVICE)


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

train_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

val_test_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# ============================================================
# LOAD DATASET
# ============================================================

train_dataset = datasets.ImageFolder(
    TRAIN_DIR,
    transform=train_transforms
)

val_dataset = datasets.ImageFolder(
    VAL_DIR,
    transform=val_test_transforms
)

# Test folder contains:
# clean
# stego
# stego_b64
# stego_zip
#
# We only want clean + stego.

full_test_dataset = datasets.ImageFolder(
    TEST_DIR,
    transform=val_test_transforms
)

allowed_classes = ["clean", "stego"]

test_samples = []

for path, class_index in full_test_dataset.samples:

    class_name = full_test_dataset.classes[class_index]

    if class_name in allowed_classes:

        new_label = allowed_classes.index(class_name)

        test_samples.append(
            (path, new_label)
        )


class SimpleTestDataset(torch.utils.data.Dataset):

    def __init__(self, samples, transform=None):

        self.samples = samples
        self.transform = transform

    def __len__(self):

        return len(self.samples)

    def __getitem__(self, index):

        path, label = self.samples[index]

        image = datasets.folder.default_loader(path)

        if self.transform:
            image = self.transform(image)

        return image, label


test_dataset = SimpleTestDataset(
    test_samples,
    transform=val_test_transforms
)


# ============================================================
# SHOW DATASET INFORMATION
# ============================================================

print("\nClasses found in training dataset:")
print(train_dataset.classes)

print("\nTraining images:", len(train_dataset))
print("Validation images:", len(val_dataset))
print("Testing images:", len(test_dataset))


# ============================================================
# DATA LOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    num_workers=0
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)
# ============================================================
# LOAD RESNET18
# ============================================================
print("\nLoading ResNet18...")

model = models.resnet18(
    weights=models.ResNet18_Weights.DEFAULT
)

# Get number of inputs to final layer
number_of_features = model.fc.in_features

# Replace final layer with 2-class classifier
model.fc = nn.Linear(
    number_of_features,
    2
)

model = model.to(DEVICE)


# ============================================================
# LOAD PREVIOUSLY TRAINED MODEL
# ============================================================

MODEL_PATH = "models/stego_detector.pth"

if os.path.exists(MODEL_PATH):

    print("\nPrevious trained model found!")
    print("Loading:", MODEL_PATH)

    model.load_state_dict(
        torch.load(
            MODEL_PATH,
            map_location=DEVICE
        )
    )

    print("Epoch 1 model loaded successfully.")

else:

    print("\nNo previous model found.")
    print("Starting from pretrained ResNet18.")

# ============================================================
# LOSS FUNCTION
# ============================================================

class_counts = torch.bincount(
    torch.tensor(train_dataset.targets)
)

print("\nClass counts:")

for class_name, count in zip(
    train_dataset.classes,
    class_counts
):
    print(f"{class_name}: {count.item()}")


class_weights = 1.0 / class_counts.float()

class_weights = (
    class_weights /
    class_weights.sum() * 2
)

class_weights = class_weights.to(DEVICE)

criterion = nn.CrossEntropyLoss(
    weight=class_weights
)


# ============================================================
# OPTIMIZER
# ============================================================

optimizer = optim.Adam(
    model.parameters(),
    lr=LEARNING_RATE
)


# ============================================================
# TRAINING FUNCTION
# ============================================================

def train_one_epoch(model, loader):

    model.train()

    running_loss = 0.0
    correct = 0
    total = 0

    progress_bar = tqdm(
        loader,
        desc="Training"
    )

    for images, labels in progress_bar:

        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        optimizer.zero_grad()

        outputs = model(images)

        loss = criterion(
            outputs,
            labels
        )

        loss.backward()

        optimizer.step()

        running_loss += loss.item()

        _, predicted = torch.max(
            outputs,
            1
        )

        total += labels.size(0)

        correct += (
            predicted == labels
        ).sum().item()

        progress_bar.set_postfix(
            loss=loss.item()
        )

    accuracy = 100 * correct / total

    average_loss = (
        running_loss / len(loader)
    )

    return average_loss, accuracy


# ============================================================
# VALIDATION / TEST FUNCTION
# ============================================================

def evaluate(model, loader):

    model.eval()

    running_loss = 0.0

    correct = 0
    total = 0

    all_labels = []
    all_predictions = []

    with torch.no_grad():

        for images, labels in loader:

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            outputs = model(images)

            loss = criterion(
                outputs,
                labels
            )

            running_loss += loss.item()

            _, predicted = torch.max(
                outputs,
                1
            )

            total += labels.size(0)

            correct += (
                predicted == labels
            ).sum().item()

            all_labels.extend(
                labels.cpu().numpy()
            )

            all_predictions.extend(
                predicted.cpu().numpy()
            )

    accuracy = 100 * correct / total

    average_loss = (
        running_loss / len(loader)
    )

    return (
        average_loss,
        accuracy,
        all_labels,
        all_predictions
    )


# ============================================================
# TRAIN
# ============================================================
# ============================================================
# TRAIN
# ============================================================

print("\nContinuing training from Epoch 1...\n")

# Epoch 1 already achieved 74.14% validation accuracy
best_val_accuracy = 74.14

os.makedirs(
    "models",
    exist_ok=True
)

# Epoch 1 is already completed.
# Continue with Epoch 2.
START_EPOCH = 1

for epoch in range(START_EPOCH, EPOCHS):

    print(
        f"\n========== EPOCH {epoch + 1}/{EPOCHS} =========="
    )

    train_loss, train_accuracy = train_one_epoch(
        model,
        train_loader
    )

    val_loss, val_accuracy, _, _ = evaluate(
        model,
        val_loader
    )

    print(
        f"\nTraining Loss: {train_loss:.4f}"
    )

    print(
        f"Training Accuracy: {train_accuracy:.2f}%"
    )

    print(
        f"Validation Loss: {val_loss:.4f}"
    )

    print(
        f"Validation Accuracy: {val_accuracy:.2f}%"
    )

    if val_accuracy > best_val_accuracy:

        best_val_accuracy = val_accuracy

        torch.save(
            model.state_dict(),
            "models/stego_detector.pth"
        )

        print("Best model saved!")
# ============================================================
# LOAD BEST MODEL
# ============================================================

print("\nLoading best model...")

model.load_state_dict(
    torch.load(
        "models/stego_detector.pth",
        map_location=DEVICE
    )
)


# ============================================================
# FINAL TEST
# ============================================================

print("\nRunning final test...")

test_loss, test_accuracy, labels, predictions = evaluate(
    model,
    test_loader
)

print(
    f"\nTest Accuracy: {test_accuracy:.2f}%"
)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report:\n")

print(
    classification_report(
        labels,
        predictions,
        target_names=test_dataset.classes
    )
)


# ============================================================
# CONFUSION MATRIX
# ============================================================

print("\nConfusion Matrix:\n")

print(
    confusion_matrix(
        labels,
        predictions
    )
)

print("\nTraining completed!")

print(
    "\nModel saved at: models/stego_detector.pth"
)