"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
// import { ImageUpload } from "@/lib/components/image-upload";
import { getHostProfile, updateHostProfile } from "@/lib/actions/host";
import { User, Camera } from "lucide-react";

interface HostProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getHostProfile();
        if (result.success && result.data) {
          const profileData = result.data as HostProfile;
          setProfile(profileData);
          setFormData({
            name: profileData.name,
            bio: profileData.bio || "",
            avatar: profileData.avatar || "",
          });
        } else {
          toast.error("Failed to load profile", {
            description: result.error || "Please try again",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateHostProfile({
        name: formData.name.trim(),
        bio: formData.bio.trim() || undefined,
        avatar: formData.avatar || undefined,
      });

      if (result.success && result.data) {
        setProfile(result.data as HostProfile);
        toast.success("Profile updated successfully", {
          description: "Your profile information has been saved!",
        });
      } else {
        toast.error("Failed to update profile", {
          description: result.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 p-8">
        <PageHeader
          title="Profile Settings"
          subtitle="Manage your host profile information"
        />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your host profile information"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your name, bio, and profile picture. This information will
              be visible to users on your public profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="space-y-3">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.avatar} />
                    <AvatarFallback className="text-lg">
                      {formData.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // For now, we'll use a placeholder URL
                          // In a real implementation, you'd upload to Cloudinary or similar
                          const url = URL.createObjectURL(file);
                          handleInputChange("avatar", url);
                        }
                      }}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          {formData.avatar
                            ? "Change Picture"
                            : "Upload Picture"}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell users about yourself and your events..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-sm text-gray-500">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Preview</CardTitle>
            <CardDescription>
              This is how your profile will appear to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={formData.avatar} />
                  <AvatarFallback className="text-lg">
                    {formData.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {formData.name || "Your Name"}
                  </h3>
                  <p className="text-sm text-gray-500">Event Host</p>
                </div>
              </div>

              {formData.bio && (
                <div>
                  <h4 className="font-medium mb-2">About</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {formData.bio}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Profile Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Events</p>
                    <p className="font-semibold">-</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reviews</p>
                    <p className="font-semibold">-</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Stats will be updated based on your actual events and reviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
