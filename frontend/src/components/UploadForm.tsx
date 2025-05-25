import React, { useState, useRef } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

const UploadForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string>("Select a video to upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!videoFile) return;

    const token = await user?.getIdToken();
    const formData = new FormData();
    formData.append("file", videoFile);

    setUploading(true);
    setStatus("📤 Uploading video...");

    try {
      const res = await axios.post(
        "http://localhost:3000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percent);
          },
        }
      );

      setStatus("🧠 Transcribing and generating MCQs...");
      const videoId = res.data.videoId;

      setTimeout(() => {
        setStatus("✅ Completed!");
        navigate(`/results/${videoId}`);
      }, 1000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("❌ Upload or transcription failed.");
      setStatus("❌ Error occurred");
    } finally {
      setUploading(false);
      setProgress(0);
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem("firebase_token");
  };

  return (
    <div
      className="min-h-screen w-screen flex flex-col"
      style={{
        backgroundImage: 'url("/image.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* 🔷 Overlay for blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />

      {/* 🔷 Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/30 backdrop-blur-md shadow-md border-b border-white/30">
        <h1 className="text-xl font-semibold text-white tracking-wide">
          🎓 EduTranscribe
        </h1>
        <Button variant="destructive" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </nav>

      {/* 🔷 Upload Section */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-lg shadow-xl rounded-2xl backdrop-blur-md bg-white/80 border border-gray-300">
          <CardContent className="p-6 flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              📁 Upload Lecture Video
            </h2>

            <Input
              ref={fileInputRef}
              type="file"
              accept="video/mp4"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
                  Uploading...
                </>
              ) : (
                "Upload Video"
              )}
            </Button>

            {uploading && (
              <Progress
                value={progress}
                className="h-2 rounded-full bg-muted"
              />
            )}

            <p className="text-sm text-gray-600 italic">{status}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadForm;
