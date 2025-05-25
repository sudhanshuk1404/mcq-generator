import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Login: React.FC = () => {
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken(true);
      localStorage.setItem("firebase_token", token);
      console.log("✅ Login successful, token saved");
    } catch (error) {
      console.error("❌ Login failed:", error);
      alert("Login failed");
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background image layer */}
      <div
        className="min-h-screen absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("/image.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/30 backdrop-blur-md shadow-md border-b border-white/30">
        <h1 className="text-xl font-semibold text-white tracking-wide">
          🎓 EduTranscribe
        </h1>
      </nav>
      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <Card className="shadow-2xl w-[360px] backdrop-blur-md bg-white/80 border border-gray-300">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Authorization
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button onClick={handleLogin} className="w-full">
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
