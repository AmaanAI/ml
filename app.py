import streamlit as st
from flask import Flask, request, jsonify
from threading import Thread
import pytesseract
from PIL import Image
import io
import json  # Added import for JSON parsing

from flask_cors import CORS

# Initialize your Flask app
flask_app = Flask(__name__)
CORS(flask_app)  # Enable CORS for all routes

@flask_app.route('/ocr', methods=['POST'])
def ocr():
    if 'image' not in request.files or 'selection' not in request.form:
        return jsonify({'success': False, 'error': 'Image or selection data not provided.'}), 400

    file = request.files['image']
    selection_data = request.form['selection']
    try:
        # Read the uploaded image from the file stream
        image = Image.open(file.stream).convert('RGB')

        # Parse selection data
        selection = json.loads(selection_data)
        left = selection['left']
        top = selection['top']
        width = selection['width']
        height = selection['height']

        # Crop the image using the selection coordinates
        right = left + width
        bottom = top + height
        cropped_image = image.crop((left, top, right, bottom))

        # Perform OCR using pytesseract on the cropped image
        text = pytesseract.image_to_string(cropped_image)

        # Return the extracted text
        return jsonify({'success': True, 'extracted_text': text.strip()}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@flask_app.route('/answer', methods=['POST'])
def answer():
    data = request.get_json()
    question = data.get('question', '')
    if not question:
        return jsonify({'success': False, 'error': 'No question provided.'}), 400

    try:
        # Use your Q&A model or service to generate an answer
        # For example, using an AI model or API
        # Here we'll use a placeholder response
        answer = generate_answer(question)  # Implement this function
        return jsonify({'success': True, 'answer': answer}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_answer(question):
    # Implement your Q&A logic here
    # For demonstration, we'll return a placeholder answer
    return "This is a placeholder answer to your question."

def run_flask():
    flask_app.run(host='0.0.0.0', port=5001)

flask_thread = Thread(target=run_flask)
flask_thread.daemon = True
flask_thread.start()

# Streamlit app
st.title("AI-Powered Q&A Bot with OCR")

st.write("The Streamlit app is running alongside a Flask API for OCR and Q&A requests.")

# Optional: File uploader for testing OCR locally
uploaded_file = st.file_uploader("Upload an image for OCR (optional):", type=["png", "jpg", "jpeg"])

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert('RGB')
    st.image(image, caption='Uploaded Image', use_column_width=True)
    text = pytesseract.image_to_string(image)
    st.write("Extracted Text:")
    st.write(text)

    # Optional: Test the Q&A functionality
    st.write("Generated Answer:")
    answer = generate_answer(text)
    st.write(answer)
