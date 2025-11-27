from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import numpy as np

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

app = Flask(__name__)
CORS(app)

# ------------------------------------
# Serve images from /images folder
# ------------------------------------
@app.route('/image/<item_id>')
def serve_image(item_id):
    return send_from_directory("images", f"{item_id}.jpg", mimetype='image/jpeg')

# ------------------------------------
# Load dataset
# ------------------------------------
data = pd.read_csv("data/styles.csv", on_bad_lines="skip")

# Keep required columns
data = data[['id','productDisplayName','masterCategory','articleType',
             'baseColour','gender','season','year','usage']]
data = data.dropna()

# ------------------------------------
# Preprocessing + Model
# ------------------------------------
features = ["masterCategory", "articleType", "baseColour", "gender", "season", "year"]

preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"),
     ["masterCategory", "articleType", "baseColour", "gender", "season"]),
    ("num", StandardScaler(), ["year"])
])

pipeline = Pipeline([
    ("prep", preprocessor),
    ("kmeans", KMeans(n_clusters=12, random_state=42))
])

pipeline.fit(data[features])
data["cluster"] = pipeline.predict(data[features])

# ------------------------------------
# Helper functions
# ------------------------------------
def add_image_url(df):
    """Attach image URL to each item."""
    df = df.copy()
    df["image"] = df["id"].apply(lambda x: f"http://127.0.0.1:5000/image/{x}")
    return df

def search_items(query):
    result = data[data["productDisplayName"].str.contains(query, case=False, na=False)]
    return add_image_url(result)

def recommend_items(item_id, n=8):
    if item_id not in data["id"].values:
        return pd.DataFrame()

    item = data[data["id"] == item_id].iloc[0]
    cluster_items = data[data["cluster"] == item["cluster"]]
    cluster_items = cluster_items[cluster_items["id"] != item_id]

    if len(cluster_items) == 0:
        return pd.DataFrame()

    result = cluster_items.sample(min(n, len(cluster_items)))
    return add_image_url(result)

# ------------------------------------
# API Endpoints
# ------------------------------------
@app.route("/search", methods=["GET"])
def search_api():
    query = request.args.get("q", "")
    results = search_items(query)
    return jsonify(results.to_dict(orient="records"))

@app.route("/recommend", methods=["GET"])
def recommend_api():
    item_id = int(request.args.get("id"))
    results = recommend_items(item_id)
    return jsonify(results.to_dict(orient="records"))

@app.route("/")
def home():
    return {"message": "Clothing Recommendation API running!"}

# ------------------------------------
# Run server
# ------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
