"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import {
  getUserProfile,
  updateUserProfile,
  type UserProfileData,
} from "@/lib/actions/user";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";
import { ProfilePhotosUpload } from "@/components/profile/profile-photos-upload";
import { StatusBadges } from "@/components/profile/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Wallet,
  Crown,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Save,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const router = useRouter();
  const { user: loggedInUser, isLoading: authLoading } = useLoggedInUser();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
    phone: "",
    birthday: "",
    gender: "",
    photos: [] as string[],
  });

  useEffect(() => {
    if (authLoading) return;

    if (!loggedInUser) {
      router.push("/login?redirectTo=/profile");
      return;
    }

    fetchProfile();
  }, [loggedInUser, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const result = await getUserProfile();
      if (result.success && result.data) {
        setProfile(result.data);
        setFormData({
          name: result.data.name,
          avatar: result.data.avatar || "",
          phone: result.data.phone || "",
          birthday: result.data.birthday
            ? format(new Date(result.data.birthday), "yyyy-MM-dd")
            : "",
          gender: result.data.gender || "",
          photos: result.data.photos || [],
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

  const handleInputChange = (field: string, value: string | string[]) => {
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
      const updateData: any = {
        name: formData.name.trim(),
        avatar: formData.avatar || undefined,
        phone: formData.phone.trim() || undefined,
        gender: formData.gender.trim() || undefined,
        photos: formData.photos.length > 0 ? formData.photos : undefined,
      };

      if (formData.birthday) {
        updateData.birthday = new Date(formData.birthday);
      }

      const result = await updateUserProfile(updateData);

      if (result.success && result.data) {
        setProfile(result.data);
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
          <Button onClick={fetchProfile} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const hasActiveSubscription =
    profile.activePackageId &&
    profile.subscriptionEndDate &&
    new Date(profile.subscriptionEndDate) > new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your profile information and view your account status
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="space-y-3">
                    <Label>Profile Picture</Label>
                    <ProfileImageUpload
                      currentImage={formData.avatar}
                      onImageChange={(url) => handleInputChange("avatar", url)}
                      userName={formData.name}
                      disabled={isSaving}
                    />
                  </div>

                  {/* Profile Photos */}
                  <div className="space-y-3">
                    <Label>Profile Photos</Label>
                    <ProfilePhotosUpload
                      currentPhotos={formData.photos}
                      onPhotosChange={(photos) =>
                        handleInputChange("photos", photos)
                      }
                      disabled={isSaving}
                      maxPhotos={6}
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Email address cannot be changed
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Birthday */}
                  <div className="space-y-2">
                    <Label htmlFor="birthday">Date of Birth</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={formData.birthday}
                      onChange={(e) =>
                        handleInputChange("birthday", e.target.value)
                      }
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="NON_BINARY">Non-binary</option>
                      <option value="PREFER_NOT_TO_SAY">
                        Prefer not to say
                      </option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (profile?.id) {
                          window.open(`/profile/${profile.id}`, "_blank");
                        }
                      }}
                      disabled={!profile?.id}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Profile Preview & Status */}
            <div className="space-y-6">
              {/* Profile Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Preview</CardTitle>
                  <CardDescription>
                    This is how your profile appears to others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={formData.avatar || undefined} />
                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-[#cc18d9] to-[#e316cd] text-white">
                          {formData.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formData.name || "Your Name"}
                        </h3>
                        <StatusBadges
                          kycStatus={profile.kycStatus}
                          datingKycStatus={profile.datingKycStatus}
                          hasActiveSubscription={hasActiveSubscription}
                          subscriptionEndDate={profile.subscriptionEndDate}
                          subscriptionName={profile.activePackage?.name}
                        />
                      </div>
                    </div>

                    {/* Bio section removed */}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Member Since</p>
                        <p className="font-semibold">
                          {format(new Date(profile.createdAt), "MMM yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Account Status</p>
                        <Badge
                          variant={
                            profile.status === "ACTIVE"
                              ? "default"
                              : "secondary"
                          }
                          className="mt-1"
                        >
                          {profile.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
