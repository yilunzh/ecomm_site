"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: "",
  });
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user) {
      setUserData({
        name: session.user.name || "",
        email: session.user.email || "",
        avatar: session.user.image || "",
      });
    }
  }, [status, session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setUpdateSuccess(false);
    setUpdateError("");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUpdateSuccess(false);
    setUpdateError("");

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error updating profile");
      }

      setUpdateSuccess(true);
    } catch (error: any) {
      setUpdateError(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-10 text-center">
        <Avatar className="h-24 w-24 mx-auto mb-4">
          <AvatarImage src={userData.avatar} alt={userData.name} />
          <AvatarFallback className="text-lg">{getInitials(userData.name)}</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">{userData.name}</h1>
        <p className="text-muted-foreground">{userData.email}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full mb-8">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
          <TabsTrigger value="addresses" className="flex-1">Addresses</TabsTrigger>
          <TabsTrigger value="security" className="flex-1">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                {updateSuccess && (
                  <div className="p-4 bg-green-100 border border-green-200 rounded-md text-green-700 text-sm">
                    Your profile has been updated successfully.
                  </div>
                )}
                
                {updateError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    {updateError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    value={userData.email}
                    disabled={true}
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email addresses cannot be changed
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View and track your orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/products")}>
                  Browse Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Addresses</CardTitle>
              <CardDescription>Manage your shipping addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">You haven't added any addresses yet.</p>
                <Button variant="outline" className="mt-4">
                  Add New Address
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Change Password</h3>
                <p className="text-muted-foreground mb-4">Update your password to secure your account</p>
                <Button variant="outline">Change Password</Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
                <p className="text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 