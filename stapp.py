import streamlit as st
import joblib
import numpy as np

st.title("Stress Detection System")

# Input fields for features
heart_rate = st.number_input("Heart Rate", min_value=40, max_value=120, value=70)
skin_conductivity = st.number_input("Skin Conductivity", min_value=2.0, max_value=8.0, value=5.0)
hours_worked = st.slider("Hours Worked", 1, 14, 8)
emails_sent = st.slider("Emails Sent", 10, 50, 30)
meetings_attended = st.slider("Meetings Attended", 0, 10, 3)

# Load model and predict
model = joblib.load(r'C:\Healthrig\ml\stress_model.pkl')
features = np.array([[heart_rate, skin_conductivity, hours_worked, emails_sent, meetings_attended]])
stress_level = model.predict(features)[0]

# Display predicted stress level
st.write(f"Predicted Stress Level: {stress_level:.2f}")

# Classification based on stress level ranges
if stress_level <= 17.46:
    classification = "Very Low"
elif 17.46 < stress_level <= 20.00:
    classification = "Low"
elif 20.00 < stress_level <= 25.00:
    classification = "Moderate"
elif 25.00 < stress_level <= 28.00:
    classification = "High"
elif stress_level > 28.00:
    classification = "Very High"
else:
    classification = "Unknown"

# Display classification
st.write(f"Stress Level Classification: {classification}")
