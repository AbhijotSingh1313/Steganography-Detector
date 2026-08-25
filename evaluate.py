import os
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix


# ============================================================
# SETTINGS
# ============================================================

DATASET_PATH = r"C:\Users\lenovo\Desktop\archive"

TEST_DIR = os.path.join(
    DATASET_PATH,
    "test",
    "test"
)

MODEL_PATH = "models/stego_detector.pth"

IMAGE_SIZE = 224
BATCH_SIZE = 64

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", DEVICE)


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# LOAD TEST DATASET
# ============================================================

full_test_dataset = datasets.ImageFolder(
    TEST_DIR,
    transform=transform
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
    transform=transform
)


test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    num_workers=0
)


print("Test images:", len(test_dataset))


# ============================================================
# LOAD RESNET18
# ============================================================

print("\nLoading ResNet18...")

model = models.resnet18(weights=None)

number_of_features = model.fc.in_features

model.fc = nn.Linear(
    number_of_features,
    2
)

model = model.to(DEVICE)


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

print("\nLoading trained model...")

model.load_state_dict(
    torch.load(
        MODEL_PATH,
        map_location=DEVICE
    )
)

model.eval()

print("Model loaded successfully.")


# ============================================================
# EVALUATION
# ============================================================

all_labels = []
all_predictions = []

correct = 0
total = 0

print("\nRunning evaluation...")

with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        outputs = model(images)

        _, predictions = torch.max(
            outputs,
            1
        )

        total += labels.size(0)

        correct += (
            predictions == labels
        ).sum().item()

        all_labels.extend(
            labels.cpu().numpy()
        )

        all_predictions.extend(
            predictions.cpu().numpy()
        )


accuracy = 100 * correct / total


# ============================================================
# RESULTS
# ============================================================

print("\n===================================")
print("FINAL MODEL RESULTS")
print("===================================")

print(
    f"\nTest Accuracy: {accuracy:.2f}%"
)

print("\nClassification Report:\n")

print(
    classification_report(
        all_labels,
        all_predictions,
        target_names=["clean", "stego"]
    )
)

print("\nConfusion Matrix:\n")

print(
    confusion_matrix(
        all_labels,
        all_predictions
    )
)

print("\nEvaluation completed.")