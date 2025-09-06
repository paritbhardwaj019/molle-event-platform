export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  birthday: Date | null;
  gender: string | null;
  identity: string | null;
  photos: string[];
  role: string;
  status: string;
  walletBalance: number;
  adminWallet: number;
  referralCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  // KYC Status
  kycStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  datingKycStatus: "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED" | null;
  // Subscription Status
  activePackageId: string | null;
  subscriptionEndDate: Date | null;
  activePackage?: {
    id: string;
    name: string;
    price: number;
    dailySwipeLimit: number;
    allowBadge: boolean;
  } | null;
}

export async function getUserProfile(): Promise<{
  success: boolean;
  data?: UserProfileData;
  error?: string;
}> {
  try {
    const response = await fetch("/api/user/profile", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to fetch profile",
      };
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function updateUserProfile(data: {
  name?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  birthday?: Date;
  identity?: string;
  gender?: string;
  photos?: string[];
}): Promise<{
  success: boolean;
  data?: UserProfileData;
  error?: string;
}> {
  try {
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to update profile",
      };
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
