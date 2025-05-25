import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/components/Login";
import UploadForm from "@/components/UploadForm";
import VideoResults from "@/pages/VideoResults"; // ✅ new
import { Routes, Route, Navigate } from "react-router-dom";

const App: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div>
        <Login />
      </div>
    );
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<UploadForm />} />
        <Route path="/results/:id" element={<VideoResults />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
