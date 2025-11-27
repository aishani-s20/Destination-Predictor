import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import warnings
import numpy as np
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Suppress warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
FILE_PATH = 'Engineered_Features.csv'

# --- GLOBAL VARIABLES TO HOLD MODEL ---
# These will be filled when the app starts
rf_model = None
df = None
trained_columns = None
feature_columns = None

# ==========================================
#  1. CORE ML LOGIC (From model.py)
# ==========================================

def load_and_train_model(csv_path):
    """
    Loads data, trains the model, and stores all necessary components.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Error: '{csv_path}' not found.")
    
    print("--- Loading Data and Training Model ---")
    # Load Data
    data_frame = pd.read_csv(csv_path)
    print(f"Successfully loaded '{csv_path}'. Shape: {data_frame.shape}")

    # Feature Engineering (Encoding)
    target_variable = 'satisfaction_rating'
    features_df = data_frame.drop(target_variable, axis=1)
    feat_cols = features_df.columns
    
    print("Encoding categorical features...")
    X_encoded = pd.get_dummies(features_df, drop_first=True, dtype=int)
    y = data_frame[target_variable]
    train_cols = X_encoded.columns
    print(f"Model will be trained with {len(train_cols)} features.")

    # Model Training
    print("Training Random Forest...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_encoded, y)
    print("Model training complete.")
    
    return model, data_frame, train_cols, feat_cols

def get_recommendations_logic(user_inputs, model, original_df, trained_cols, base_feature_cols):
    """
    Generates top 3 recommendations based on user inputs.
    """
    print(f"\n--- Generating Recommendations for {user_inputs['start_location']} ---")
    
    # 1. Get user's start location
    user_start = user_inputs['start_location']
    
    # 2. Find all candidate trips
    candidate_trips = original_df[original_df['start_location'] == user_start].copy()
    
    if candidate_trips.empty:
        print(f"No trips found starting from '{user_start}'.")
        return pd.DataFrame()
        
    print(f"Found {len(candidate_trips)} candidate trips.")
    
    # 3. Create the "test set" from these candidates
    test_df = candidate_trips.copy()
    
    # 4. Add/Overwrite with the user's *contextual* preferences
    # We remove start_location because we already filtered by it
    broadcast_inputs = user_inputs.copy()
    broadcast_inputs.pop('start_location')
    
    for key, value in broadcast_inputs.items():
        # Only overwrite if the column exists in the features
        # (This handles season, day_type, user_budget etc.)
        test_df[key] = value
            
    # 5. Ensure column order
    test_df_ordered = test_df[base_feature_cols]
    
    # 6. Encode the prediction data
    encoded_test_df = pd.get_dummies(test_df_ordered, drop_first=True, dtype=int)
    
    # 7. Align Columns (Crucial Step)
    final_test_df = encoded_test_df.reindex(columns=trained_cols, fill_value=0)
    
    # 8. Predict Satisfaction
    predictions = model.predict(final_test_df)
    
    # 9. Format and Rank
    results_df = test_df_ordered.copy()
    results_df['predicted_satisfaction'] = predictions
    
    # 10. Select relevant columns for display
    display_cols = [
        'end_location', 
        'destination_type', 
        'transport_mode', 
        'total_cost', 
        'popularity_score',
        'estimated_travel_time_hr',
        'predicted_satisfaction'
    ]
    
    # Ensure columns exist before selecting
    final_display_cols = [col for col in display_cols if col in results_df.columns]
    final_results = results_df[final_display_cols]
    
    # 11. Sort and get top 3 unique destinations
    final_results = final_results.sort_values(by='predicted_satisfaction', ascending=False)
    top_unique_results = final_results.drop_duplicates(subset=['end_location', 'destination_type'], keep='first')
    
    return top_unique_results.head(3)


# ==========================================
#  2. APP STARTUP
# ==========================================
# This block runs ONCE when you start the server
try:
    rf_model, df, trained_columns, feature_columns = load_and_train_model(FILE_PATH)
    print(">>> SYSTEM READY. API is listening...")
except Exception as e:
    print(f"CRITICAL ERROR ON STARTUP: {e}")
    # We don't exit here so the server can start and show the error if accessed,
    # but in production, you might want to exit.


# ==========================================
#  3. API ROUTES
# ==========================================

@app.route("/", methods=["GET"])
def home():
    if rf_model is None:
        return "Server running, but Model failed to load. Check logs.", 500
    return "Travel Recommendation API is Running!"

@app.route("/predict", methods=["POST"])
def predict():
    global rf_model, df, trained_columns, feature_columns
    
    if rf_model is None:
        return jsonify({"error": "Model not loaded. Check server logs."}), 500

    try:
        data = request.get_json()
        
        # Construct the preferences dictionary from JSON data
        # Note: We must cast types (int, float) as JSON comes in as text/mixed
        user_preferences = {
            'start_location': data.get('start_location'),
            'season': data.get('season'),
            'day_type': data.get('day_type'),
            'user_budget': float(data.get('user_budget')),
            'user_time_constraint_hr': float(data.get('user_time_constraint_hr')),
            'preferred_transport_mode': data.get('preferred_transport_mode'),
            'popularity_score': float(data.get('popularity_score'))
        }

        # Get recommendations
        recommendations = get_recommendations_logic(
            user_preferences,
            rf_model,
            df,
            trained_columns,
            feature_columns
        )

        if recommendations.empty:
            return jsonify({"recommendations": []})

        # Convert to dictionary for JSON response
        results = recommendations.to_dict(orient='records')
        return jsonify({"recommendations": results})

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5000)