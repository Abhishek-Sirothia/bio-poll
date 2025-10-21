import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, CheckCircle, Loader2 } from "lucide-react";

const FaceRegistration = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("face_registered")
        .eq("id", session.user.id)
        .single();

      if (profile?.face_registered) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Failed to access camera. Please allow camera permissions.");
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setImageData(dataUrl);
        setCaptured(true);
      }
    }
  };

  const retake = () => {
    setCaptured(false);
    setImageData("");
  };

  const registerFace = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      // In a real implementation, this would send the image to a facial recognition API
      // For this demo, we'll just store a placeholder
      const { error: faceError } = await supabase
        .from("face_data")
        .insert({
          user_id: session.user.id,
          face_encoding: imageData.substring(0, 500), // Store limited data for demo
        });

      if (faceError) throw faceError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          face_registered: true,
          avatar_url: imageData.substring(0, 500),
        })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      toast.success("Face registered successfully!");
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-success/10 p-3 rounded-full">
              <Camera className="h-10 w-10 text-success" />
            </div>
          </div>
          <CardTitle className="text-2xl">Face Registration</CardTitle>
          <CardDescription>
            Register your face for secure voting verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="mb-2">📸 <strong>Important:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Ensure good lighting</li>
              <li>Look directly at the camera</li>
              <li>Remove glasses if possible</li>
              <li>Keep a neutral expression</li>
            </ul>
          </div>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {!stream ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button onClick={startCamera} size="lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Camera
                </Button>
              </div>
            ) : captured ? (
              <canvas ref={canvasRef} className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex gap-3">
            {stream && !captured && (
              <Button onClick={captureImage} className="flex-1" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Capture Photo
              </Button>
            )}
            {captured && (
              <>
                <Button onClick={retake} variant="outline" className="flex-1" size="lg">
                  Retake
                </Button>
                <Button onClick={registerFace} disabled={loading} className="flex-1" size="lg">
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-5 w-5" />
                  )}
                  Register Face
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FaceRegistration;