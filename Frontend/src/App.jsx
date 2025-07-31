// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import AuthForm from "./components/Auth/AuthForm";
import LandingPage from "./pages/LandingPage";
import TutorDashboard from "./pages/TutorDashboard";
import StudentPage from "./pages/StudentPage";
import './App.css'; 

// Simplified UploadPage component (removed from main App component)
function UploadPage({ onLogout }) {
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("video");
  const [videoType, setVideoType] = useState("local");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState(null);
  const [tutorId, setTutorId] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.user_type === 'Tutor' && user.id) {
          setTutorId(user.id);
        }
      } catch (error) {
        console.error("Error parsing stored user data:", error);
      }
    }
  }, []);

  const getYoutubeVideoId = (url) => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setPreviewUrl(null);

    if (!tutorId) {
      return setMessage("❌ Error: Tutor ID not found. Please log in as a tutor.");
    }

    if (contentType !== "text" && !file && videoType === "local") {
      return setMessage("Please select a file to upload.");
    }
    if (contentType === "video" && videoType === "youtube" && !youtubeUrl) {
      return setMessage("Please enter a YouTube URL.");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", about);
    formData.append("category", category);
    formData.append("tutor_id", tutorId);
    formData.append("content_type", contentType);

    if (contentType === "video") {
      formData.append("video_type", videoType);
      if (videoType === "local") {
        formData.append("video_file", file);
      } else {
        formData.append("youtube_url", youtubeUrl);
      }
    } else if (contentType === "text") {
      formData.append("text_file", file);
    } else if (contentType === "audio") {
      formData.append("audio_file", file);
    }

    try {
      const uploadEndpoint = "http://localhost:8000/api/lessons/upload_content";
      const res = await axios.post(uploadEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setMessage("✅ Content uploaded successfully!");
      const lesson = res.data.lesson;

      if (lesson.content_type === "video") {
        if (lesson.video_type === "local") {
          setPreviewUrl(`http://localhost:8000${lesson.content_url}`);
        } else {
          const videoId = getYoutubeVideoId(lesson.content_url);
          if (videoId) {
            setPreviewUrl(`https://www.youtube.com/embed/${videoId}`);
          }
        }
      } else if (lesson.content_type === "text" || lesson.content_type === "audio") {
        setPreviewUrl(`http://localhost:8000${lesson.content_url}`);
      }
      
      // Clear form
      setTitle("");
      setAbout("");
      setCategory("");
      setContentType("video");
      setVideoType("local");
      setYoutubeUrl("");
      setFile(null);

    } catch (err) {
      setMessage("❌ Upload failed: " + (err?.response?.data?.detail || err.message));
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h2>📤 Upload New Lesson</h2>
        <button 
          onClick={onLogout}
          className="logout-btn"
        >
          Logout
        </button>
      </div>
      
      <div className="upload-card">
        <form onSubmit={handleSubmit}>
          <label>Lesson Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            required
          />

          <label>About</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Brief description of the lesson"
            required
          ></textarea>

          <label>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Programming, Math, Science"
            required
          />

          <label>Content Type</label>
          <div className="radio-group content-type-group">
            <label>
              <input
                type="radio"
                value="video"
                checked={contentType === "video"}
                onChange={() => { setContentType("video"); setFile(null); setYoutubeUrl(""); }}
              />
              Video
            </label>
            <label>
              <input
                type="radio"
                value="text"
                checked={contentType === "text"}
                onChange={() => { setContentType("text"); setFile(null); setVideoType("local"); setYoutubeUrl(""); }}
              />
              Text
            </label>
            <label>
              <input
                type="radio"
                value="audio"
                checked={contentType === "audio"}
                onChange={() => { setContentType("audio"); setFile(null); setVideoType("local"); setYoutubeUrl(""); }}
              />
              Audio
            </label>
          </div>

          {contentType === "video" && (
            <>
              <label>Video Source</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="local"
                    checked={videoType === "local"}
                    onChange={() => { setVideoType("local"); setFile(null); }}
                  />
                  Local Upload
                </label>
                <label>
                  <input
                    type="radio"
                    value="youtube"
                    checked={videoType === "youtube"}
                    onChange={() => { setVideoType("youtube"); setFile(null); }}
                  />
                  YouTube Link
                </label>
              </div>

              {videoType === "local" && (
                <>
                  <label>Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    required={videoType === "local" && !file}
                  />
                </>
              )}

              {videoType === "youtube" && (
                <>
                  <label>YouTube URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    required={videoType === "youtube"}
                  />
                </>
              )}
            </>
          )}

          {contentType === "text" && (
            <>
              <label>Text File (.pdf, .txt, .docx)</label>
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={handleFileChange}
                required
              />
            </>
          )}

          {contentType === "audio" && (
            <>
              <label>Audio File (.mp3, .wav, .ogg)</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                required
              />
            </>
          )}

          <button type="submit">Upload</button>
        </form>

        {message && <p className="message">{message}</p>}

        {previewUrl && (
          <div className="video-preview">
            {contentType === "video" && videoType === "youtube" ? (
              <iframe
                width="100%"
                height="315"
                src={previewUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : contentType === "video" ? (
              <video
                controls
                width="100%"
                src={previewUrl}
                onError={() =>
                  alert("⚠️ Failed to load video. Check that it was uploaded and served correctly.")
                }
              />
            ) : contentType === "audio" ? (
              <audio
                controls
                width="100%"
                src={previewUrl}
                onError={() =>
                  alert("⚠️ Failed to load audio. Check that it was uploaded and served correctly.")
                }
              />
            ) : contentType === "text" ? (
              <p>Text file uploaded. <a href={previewUrl} target="_blank" rel="noopener noreferrer">View/Download File</a></p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple LearnerDashboard placeholder
function LearnerDashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Learner Dashboard</h1>
          <button 
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, Learner!</h2>
          <p>Your learning content will appear here.</p>
        </div>
      </div>
    </div>
  );
}

// Main App component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status
  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('user');
    const storedUserType = localStorage.getItem('userType');
    
    console.log('Checking auth status:', { storedUser: !!storedUser, storedUserType });
    
    if (storedUser && storedUserType) {
      try {
        const user = JSON.parse(storedUser);
        console.log('User found in localStorage:', user);
        setIsAuthenticated(true);
        setUserRole(storedUserType);
        return true;
      } catch (error) {
        console.error("Invalid stored user data:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    checkAuthStatus();
    setLoading(false);
  }, []);

  const handleAuthSuccess = (user, role) => {
    console.log('Auth success called:', { user, role });
    
    // Update state immediately
    setIsAuthenticated(true);
    setUserRole(role);
    
    // Ensure localStorage is updated
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userType', role);
    
    console.log('Auth state updated:', { isAuthenticated: true, userRole: role });
  };

  const handleLogout = () => {
    console.log('Logging out...');
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('App render - Auth state:', { isAuthenticated, userRole });

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Login route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate 
                to={userRole === 'Tutor' ? "/tutor-dashboard" : "/learner-dashboard"} 
                replace 
              />
            ) : (
              <AuthForm onAuthSuccess={handleAuthSuccess} />
            )
          }
        />

        {/* Protected Tutor Dashboard Route */}
        <Route
          path="/tutor-dashboard"
          element={
            isAuthenticated && userRole === 'Tutor' ? (
              <TutorDashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Learner Dashboard Route */}
        <Route
          path="/learner-dashboard"
          element={
            isAuthenticated && userRole === 'Learner' ? (
              <StudentPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Upload Page (only for Tutors) */}
        <Route
          path="/upload"
          element={
            isAuthenticated && userRole === 'Tutor' ? (
              <UploadPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback for unmatched routes */}
        <Route
          path="*"
          element={
            <Navigate 
              to={isAuthenticated 
                ? (userRole === 'Tutor' ? "/tutor-dashboard" : "/learner-dashboard")
                : "/login"
              } 
              replace 
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;