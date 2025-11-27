import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const API = "http://127.0.0.1:5000";

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/search?q=${query}`);
      setResults(res.data);
      setRecommendations([]); // clear old recommendations
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/recommend?id=${id}`);
      setRecommendations(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header-section">
        <h1 className="app-title">✨ Clothing Recommender</h1>
        <p className="app-subtitle">Discover your perfect style match</p>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <input
            className="search-input"
            placeholder="Search for clothing items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />

          <button
            onClick={handleSearch}
            className={`search-button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="results-section">
          <div className="section-header">
            <h2 className="section-title">🔍 Search Results</h2>
            <span className="result-count">{results.length} items found</span>
          </div>

          <div className="grid-container">
            {results.map((item) => (
              <div
                key={item.id}
                className="product-card clickable"
                onClick={() => handleRecommend(item.id)}
              >
                {/* ===== REAL IMAGE ===== */}
                <img
                  src={item.image}
                  alt={item.productDisplayName}
                  className="product-img"
                  onError={(e) => (e.target.src = "/fallback.jpg")}
                />

                <h3 className="product-title">{item.productDisplayName}</h3>
                <p className="product-meta">{item.masterCategory}</p>
                <p className="product-color">Color: {item.baseColour}</p>
                <div className="product-action">👇 Get Recommendations</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <div className="section-header">
            <h2 className="section-title">⭐ Recommended For You</h2>
            <span className="result-count">
              {recommendations.length} suggestions
            </span>
          </div>

          <div className="grid-container">
            {recommendations.map((item, idx) => (
              <div
                key={item.id}
                className="product-card recommended"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="badge">#{idx + 1}</div>

                {/* ===== REAL IMAGE ===== */}
                <img
                  src={item.image}
                  alt={item.productDisplayName}
                  className="product-img"
                  onError={(e) => (e.target.src = "/fallback.jpg")}
                />

                <h3 className="product-title">{item.productDisplayName}</h3>
                <p className="product-meta">{item.masterCategory}</p>
                <p className="product-color">Color: {item.baseColour}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
