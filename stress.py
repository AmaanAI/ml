import pandas as pd
data = pd.read_csv('stress_detection_IT_professionals_dataset.csv')



from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

X = data[["Heart_Rate", "Skin_Conductivity", "Hours_Worked", "Emails_Sent", "Meetings_Attended"]]
y = data["Stress_Level"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor()
model.fit(X_train, y_train)

import joblib
joblib.dump(model, 'stress_model.pkl')

