import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

mp_hands = mp.solutions.hands

hand_detector = mp_hands.Hands(static_image_mode=False,
                                max_num_hands=1,
                                min_detection_confidence=0.5,
                                min_tracking_confidence=0.5)

def extract_hand_roi_boundingbox(frame, pad=20):
    """Detect single hand and return cropped square image (or None).
    Returns: cropped_rgb (H,W,3) or None
    """
    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hand_detector.process(image_rgb)
    if not results.multi_hand_landmarks:
        return None
    h, w, _ = frame.shape
    # compute bbox from landmarks
    x_coords = []
    y_coords = []
    for lm in results.multi_hand_landmarks[0].landmark:
        x_coords.append(int(lm.x * w))
        y_coords.append(int(lm.y * h))
    x_min = max(min(x_coords) - pad, 0)
    x_max = min(max(x_coords) + pad, w)
    y_min = max(min(y_coords) - pad, 0)
    y_max = min(max(y_coords) + pad, h)
    crop = frame[y_min:y_max, x_min:x_max]
    # make square
    h_c, w_c = crop.shape[:2]
    if h_c == 0 or w_c == 0:
        return None
    size = max(h_c, w_c)
    sq = np.zeros((size, size, 3), dtype=crop.dtype)
    # place crop centered
    y_off = (size - h_c) // 2
    x_off = (size - w_c) // 2
    sq[y_off:y_off+h_c, x_off:x_off+w_c] = crop
    return sq

def preprocess_for_model(img, target_size=224):
    # Convert BGR → RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    # Resize to model input
    img_resized = cv2.resize(img_rgb, (target_size, target_size))
    # Convert to float32 & preprocess for MobileNetV2
    arr = np.array(img_resized, dtype=np.float32)
    arr = preprocess_input(arr)
    return arr
