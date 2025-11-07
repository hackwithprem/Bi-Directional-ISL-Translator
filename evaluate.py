import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
import json
import os

# ==========================
# CONFIGURATION
# ==========================
MODEL_PATH = "saved_model/best_model.h5"
LABELS_PATH = "saved_model/labels.json"
TEST_DIR = "dataset"   # <-- change this to your test dataset folder path
IMG_SIZE = 224
BATCH_SIZE = 16
# ==========================

# Load model and labels
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
with open(LABELS_PATH, "r") as f:
    class_indices = json.load(f)
idx_to_label = {v: k for k, v in class_indices.items()}

# Create test data generator
datagen = ImageDataGenerator(rescale=1./255)
test_generator = datagen.flow_from_directory(
    TEST_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

# Predict on test set
print("[INFO] Predicting on test data...")
preds = model.predict(test_generator, verbose=1)
y_pred = np.argmax(preds, axis=1)
y_true = test_generator.classes

# ==========================
# METRICS CALCULATION
# ==========================
# Accuracy
accuracy = np.mean(y_pred == y_true)
print(f"\n✅ Model Accuracy: {accuracy * 100:.2f}%\n")

# Detailed classification report
report = classification_report(
    y_true,
    y_pred,
    target_names=list(test_generator.class_indices.keys()),
    digits=3
)
print("=== Classification Report ===")
print(report)

# Confusion matrix
cm = confusion_matrix(y_true, y_pred)
print("\n=== Confusion Matrix ===")
print(cm)

# Optional: Save report
with open("evaluation_report.txt", "w") as f:
    f.write(f"Accuracy: {accuracy * 100:.2f}%\n\n")
    f.write(report)
    f.write("\nConfusion Matrix:\n")
    np.savetxt(f, cm, fmt="%d")
print("\n[INFO] Evaluation report saved as evaluation_report.txt")
