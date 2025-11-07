from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_bcrypt import Bcrypt
import os, re, base64, cv2, numpy as np, tensorflow as tf, json, mediapipe as mp
from googletrans import Translator
from utils import preprocess_for_model

# ==========================
# APP SETUP
# ==========================
app = Flask(__name__)
app.secret_key = 'your_secret_key'
bcrypt = Bcrypt(app)

# Paths
SIGN_FOLDER = 'static/videos'
MODEL_PATH = 'saved_model/best_model.h5'
LABELS_PATH = 'saved_model/labels.json'

# ==========================
# LOAD MODEL (Sign → Text)
# ==========================
try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    with open(LABELS_PATH, 'r') as f:
        class_indices = json.load(f)
    labels = {v: k for k, v in class_indices.items()}
    print("[INFO] Model and labels loaded successfully.")
except Exception as e:
    print("[ERROR] Failed to load model or labels:", e)
    model = None
    labels = {}

# MediaPipe setup
mp_hands = mp.solutions.hands
hands_detector = mp_hands.Hands(static_image_mode=False, max_num_hands=2,
                                min_detection_confidence=0.5, min_tracking_confidence=0.5)

# ==========================
# ROUTES
# ==========================

# Landing Page
@app.route('/')
def home():
    return render_template('landing.html')

# Login & Signup Pages
@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

# Mode Selection
@app.route('/mode')
def mode():
    return render_template('mode.html')

# Logout (handled by Firebase frontend)
@app.route('/logout')
def logout():
    return redirect(url_for('home'))

# ==========================
# TEXT → SIGN
# ==========================
@app.route('/textToSign')
def text_to_sign():
    return render_template('textToSign.html')

@app.route('/convert', methods=['POST'])
def convert():
    data = request.get_json()
    input_text = data.get('text', '')

    # Translate text to English
    translator = Translator()
    translated = translator.translate(input_text, dest='en')
    english_text = translated.text
    print(f"[INFO] Translated to English: {english_text}")

    words = preprocess_text(english_text)
    available_signs = {f.replace(".mp4", "").lower(): f for f in os.listdir(SIGN_FOLDER)}
    results = []

    for word in words:
        word_lower = word.lower()
        if word_lower in available_signs:
            video_url = url_for('static', filename=f'videos/{available_signs[word_lower]}')
            results.append({"word": word_lower, "path": video_url})
        else:
            # Spell word letter by letter if not found
            for char in word_lower:
                if char.isalpha() and char in available_signs:
                    letter_url = url_for('static', filename=f'videos/{available_signs[char]}')
                    results.append({"word": char, "path": letter_url})

    return jsonify({"results": results})

# Helper function for text cleanup
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    stopwords = {"a", "an", "the", "is", "am", "are", "to", "and", "of", "in"}
    words = text.split()
    return [word for word in words if word not in stopwords]

# ==========================
# SIGN → TEXT
# ==========================
@app.route('/signToText')
def sign_to_text():
    return render_template('signToText.html')

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'success': False, 'message': 'model_not_loaded'})

    data = request.json.get('image')
    if not data:
        print("[WARN] No image data received.")
        return jsonify({'success': False, 'message': 'no_data'})

    try:
        # Decode base64 image
        header, encoded = data.split(',', 1)
        img_bytes = base64.b64decode(encoded)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({'success': False, 'message': 'decode_failed'})

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, _ = frame.shape

        # Detect hands
        result = hands_detector.process(frame_rgb)
        hand_rois = []
        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:
                x_coords = [lm.x for lm in hand_landmarks.landmark]
                y_coords = [lm.y for lm in hand_landmarks.landmark]
                x_min = max(0, int(min(x_coords) * w) - 20)
                x_max = min(w, int(max(x_coords) * w) + 20)
                y_min = max(0, int(min(y_coords) * h) - 20)
                y_max = min(h, int(max(y_coords) * h) + 20)

                roi = frame[y_min:y_max, x_min:x_max]
                if roi is not None and roi.size > 0:
                    hand_rois.append(roi)

        if not hand_rois:
            return jsonify({'success': False, 'message': 'no_hand'})

        # Combine both hands if detected
        if len(hand_rois) == 1:
            combined = hand_rois[0]
        else:
            h1, w1 = hand_rois[0].shape[:2]
            h2, w2 = hand_rois[1].shape[:2]
            max_h = max(h1, h2)
            combined = np.zeros((max_h, w1 + w2, 3), dtype=np.uint8)
            combined[:h1, :w1] = hand_rois[0]
            combined[:h2, w1:w1 + w2] = hand_rois[1]

        # Preprocess and predict
        x = preprocess_for_model(combined, target_size=224)
        x = np.expand_dims(x, axis=0)
        preds = model.predict(x)
        idx = int(np.argmax(preds, axis=1)[0])
        label = labels.get(idx, 'unknown')
        confidence = float(np.max(preds))

        print(f"[PRED] {label} ({confidence:.3f})")
        return jsonify({'success': True, 'label': label, 'confidence': round(confidence, 3)})

    except Exception as e:
        print("[ERROR] Prediction exception:", e)
        return jsonify({'success': False, 'message': 'error_processing'})

# ==========================
# MAIN
# ==========================
if __name__ == '__main__':
    print("[INFO] Starting Unified Flask App...")
    app.run(host='0.0.0.0', port=5000, debug=True)
