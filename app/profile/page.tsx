"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    email: "johnruth02@gmail.com",
    phone: "+91 5416481318154",
    firstName: "John",
    lastName: "Ruth",
    birthday: "1990-01-15",
    identity: "Man",
    pincode: "654984",
    addressLine: "Brown's street 45",
    landmark: "Stile Tower",
    town: "Berlin",
    state: "Germany",
  })

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Account Details Header */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 mb-8 text-white">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" />
                <AvatarFallback className="text-2xl">JR</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">Account Details</h1>
                <p className="text-white/80">Manage your personal information</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-card rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Account Information</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <Label className="text-white">Email:</Label>
                  <p className="text-muted-foreground">{profileData.email}</p>
                </div>
                <Button variant="ghost" className="text-primary hover:text-primary/80">
                  Edit
                </Button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div>
                  <Label className="text-white">Number:</Label>
                  <p className="text-muted-foreground">{profileData.phone}</p>
                </div>
                <Button variant="ghost" className="text-primary hover:text-primary/80">
                  Edit
                </Button>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-card rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Personal Details</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName" className="text-white">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  className="bg-muted border-white/20 text-white mt-1"
                  placeholder="Enter First Name Here"
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-white">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  className="bg-muted border-white/20 text-white mt-1"
                  placeholder="Enter Last Name Here"
                />
              </div>

              <div>
                <Label htmlFor="birthday" className="text-white">
                  Birthday
                </Label>
                <Input
                  id="birthday"
                  type="date"
                  value={profileData.birthday}
                  onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                  className="bg-muted border-white/20 text-white mt-1"
                />
              </div>

              <div>
                <Label htmlFor="identity" className="text-white">
                  Identity
                </Label>
                <div className="flex space-x-2 mt-1">
                  <Button
                    variant={profileData.identity === "Woman" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setProfileData({ ...profileData, identity: "Woman" })}
                  >
                    Woman
                  </Button>
                  <Button
                    variant={profileData.identity === "Man" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setProfileData({ ...profileData, identity: "Man" })}
                  >
                    Man
                  </Button>
                  <Button
                    variant={profileData.identity === "Other" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setProfileData({ ...profileData, identity: "Other" })}
                  >
                    Other
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="bg-card rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Address Details (Optional)</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="pincode" className="text-white">
                  Area Pincode
                </Label>
                <Input
                  id="pincode"
                  value={profileData.pincode}
                  onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                  className="bg-muted border-white/20 text-white mt-1"
                  placeholder="Eg. 654984"
                />
              </div>

              <div>
                <Label htmlFor="addressLine" className="text-white">
                  Address Line
                </Label>
                <Input
                  id="addressLine"
                  value={profileData.addressLine}
                  onChange={(e) => setProfileData({ ...profileData, addressLine: e.target.value })}
                  className="bg-muted border-white/20 text-white mt-1"
                  placeholder="Eg. Brown's street 45"
                />
              </div>

              <div>
                <Label htmlFor="landmark" className="text-white">
                  Landmark
                </Label>
                <Input
                  id="landmark"
                  value={profileData.landmark}
                  onChange={(e) => setProfileData({ ...profileData, landmark: e.target.value })}
                  className="bg-muted border-white/20 text-white mt-1"
                  placeholder="Eg. Stile Tower"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="town" className="text-white">
                    Town & State
                  </Label>
                  <Input
                    id="town"
                    value={profileData.town}
                    onChange={(e) => setProfileData({ ...profileData, town: e.target.value })}
                    className="bg-muted border-white/20 text-white mt-1"
                    placeholder="Eg. Berlin"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-white sr-only">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    className="bg-muted border-white/20 text-white mt-6"
                    placeholder="Eg. Germany"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Save */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-6">I agree to Terms & Conditions and Privacy Policy</p>
            <Button className="btn-primary px-12">Save Changes</Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
