import {
  Check,
  Clock,
  CloudUpload,
  Copy,
  ExternalLink,
  Eye,
  FileImage,
  ImageIcon,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Empty, Spinner } from "./ui";
import { useAuth } from "../lib/auth";
import {
  CLOUDINARY_CONFIG,
  deleteUserImage,
  fetchUserData,
  fetchUserImages,
  uploadImageToCloudinary,
  type CloudinaryImageData,
  type FirebaseUserData,
} from "../lib/firebase";

export default function CloudinaryMediaManager() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<CloudinaryImageData[]>([]);
  const [firebaseProfile, setFirebaseProfile] = useState<FirebaseUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // Load user data and scoped images from Firebase for this logged-in user
  const loadUserContent = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch user profile from Firebase
      const profile = await fetchUserData(user.id);
      setFirebaseProfile(profile);

      // 2. Fetch images belonging only to this logged-in user
      const userImgs = await fetchUserImages(user.id);
      setImages(userImgs);
    } catch (err: any) {
      console.error("Firebase fetch error:", err);
      setError(err?.message || "Failed to load data from Firebase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserContent();
  }, [user]);

  const handleFileUpload = async (file?: File) => {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WEBP, SVG, GIF).");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress("Uploading image to Cloudinary (Preset: dream guard 2)...");

    try {
      // Upload to Cloudinary, then store metadata & URL in Firebase
      const uploaded = await uploadImageToCloudinary(file, {
        uid: user.id,
        email: user.email,
        username: user.username,
      });

      setUploadProgress("Saving Cloudinary URL in Firebase Firestore...");
      // Add newly stored image to UI gallery
      setImages((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      setError(err?.message || "Upload failed. Please check network connection.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await deleteUserImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      setError("Failed to delete image from Firebase.");
    }
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ================= USER DATA FROM FIREBASE ================= */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#1D5FA7]" />
            <span>Logged-in User (Firebase Profile)</span>
          </div>
        }
        subtitle="Fetched directly from Firebase Firestore 'users' collection for the active session"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2 bg-[#F4F8FD] rounded-xl border border-[#DCE5F0] text-xs">
          <div>
            <span className="text-[#64748B] block font-medium uppercase text-[10px] tracking-wider">
              Firebase User ID (UID)
            </span>
            <span className="font-mono text-[#172B45] font-bold break-all">
              {firebaseProfile?.uid || user?.id || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium uppercase text-[10px] tracking-wider">
              Username
            </span>
            <span className="text-[#172B45] font-bold">
              {firebaseProfile?.username || user?.username || "Demo User"}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium uppercase text-[10px] tracking-wider">
              Email
            </span>
            <span className="text-[#172B45] font-semibold break-all">
              {firebaseProfile?.email || user?.email || "demo@dreamguard.local"}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block font-medium uppercase text-[10px] tracking-wider">
              Role & Permissions
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge tone="cyan">{user?.role?.toUpperCase() || "ADMIN"}</Badge>
              <span className="text-[#64748B] text-[11px]">Scoped Access</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ================= CLOUDINARY UPLOAD CARD ================= */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-[#1D5FA7]" />
              <span>Cloudinary Image Uploader</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="cyan">Cloud: {CLOUDINARY_CONFIG.cloudName}</Badge>
              <Badge tone="green">Preset: {CLOUDINARY_CONFIG.uploadPreset}</Badge>
            </div>
          </div>
        }
        subtitle="Upload images to Cloudinary. The secure URL is automatically persisted in Firebase Firestore and rendered below."
      >
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-[#1D5FA7]/40 hover:border-[#1D5FA7] rounded-2xl p-8 text-center bg-[#F8FAFD] hover:bg-[#EAF2FB]/50 transition-all cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <div className="mx-auto w-12 h-12 rounded-full bg-[#1D5FA7]/10 flex items-center justify-center text-[#1D5FA7] mb-3">
            <FileImage className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-[#172B45]">
            Drag & drop an image here, or <span className="text-[#1D5FA7] underline">browse</span>
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Supports PNG, JPG, JPEG, WEBP, SVG, GIF (Uploaded via unsigned preset "{CLOUDINARY_CONFIG.uploadPreset}")
          </p>

          {uploading && (
            <div className="mt-4 max-w-sm mx-auto space-y-2">
              <div className="h-1.5 w-full bg-[#DCE5F0] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1D5FA7] to-teal-500 animate-pulse w-full" />
              </div>
              <p className="text-xs font-semibold text-[#1D5FA7]">{uploadProgress}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </Card>

      {/* ================= USER IMAGES GALLERY (SCOPED TO LOGGED-IN USER) ================= */}
      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#1D5FA7]" />
              <span>User Images Gallery ({images.length})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Filtered for {user?.username} only</span>
            </div>
          </div>
        }
        subtitle="Images fetched live from Firebase Firestore belonging to your authenticated User ID"
      >
        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner label="Loading images from Firebase..." />
          </div>
        ) : images.length === 0 ? (
          <Empty icon={<ImageIcon className="h-8 w-8 text-[#1D5FA7]" />} title="No images stored yet">
            Upload an image using the Cloudinary uploader above. The returned image URL will be stored in Firebase and displayed here.
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-xl border border-[#DCE5F0] bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* Image Preview */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedPreview(img.imageUrl)}>
                  <img
                    src={img.imageUrl}
                    alt={img.fileName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreview(img.imageUrl);
                      }}
                      className="p-1.5 rounded-full bg-white/90 text-[#172B45] hover:bg-white"
                      title="View preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a
                      href={img.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-white/90 text-[#172B45] hover:bg-white"
                      title="Open full size"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#172B45] truncate" title={img.fileName}>
                      {img.fileName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="uppercase font-mono">{img.format}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#EEF3F9]">
                    <button
                      type="button"
                      onClick={() => copyUrl(img.imageUrl, img.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D5FA7] hover:text-[#123B67] transition-colors"
                    >
                      {copiedId === img.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(img.id)}
                      className="p-1 rounded text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete from Firebase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lightbox Modal */}
      {selectedPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadein"
          onClick={() => setSelectedPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPreview}
              alt="Full Preview"
              className="max-h-[80vh] w-auto max-w-full object-contain mx-auto rounded-lg"
            />
            <div className="p-3 flex items-center justify-between text-xs">
              <span className="font-mono text-[#64748B] truncate max-w-md">{selectedPreview}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPreview);
                    alert("Cloudinary URL copied to clipboard!");
                  }}
                >
                  Copy URL
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedPreview(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
