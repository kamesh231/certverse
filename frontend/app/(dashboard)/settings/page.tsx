"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getUserStats, getUserSubscription, createCheckoutUrl, getCustomerPortalUrl, type Subscription } from "@/lib/api"
import {
  User,
  Settings,
  CreditCard,
  Upload,
  Bell,
  Clock,
  Moon,
  Sun,
  Monitor,
  Trophy,
  Target,
  Flame,
  Award,
  CheckCircle2,
  Crown,
  Loader2,
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useUser()
  const [theme, setTheme] = useState("system")
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [studyReminders, setStudyReminders] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return

      try {
        const [statsData, subscriptionData] = await Promise.all([
          getUserStats(user.id),
          getUserSubscription(user.id)
        ])
        setStats(statsData)
        setSubscription(subscriptionData)
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const handleUpgrade = async () => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      alert('Please sign in first')
      return
    }

    setIsUpgrading(true)
    try {
      const checkoutUrl = await createCheckoutUrl(
        user.id,
        user.primaryEmailAddress.emailAddress
      )
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setIsUpgrading(false)
    }
  }

  const achievements = [
    {
      id: 1,
      name: "First Steps",
      description: "Complete your first practice test",
      icon: Trophy,
      earned: (stats?.totalAnswered || 0) > 0,
      date: "2024-01-15",
    },
    {
      id: 2,
      name: "Week Warrior",
      description: "Maintain a 7-day study streak",
      icon: Flame,
      earned: false,
      date: null,
    },
    {
      id: 3,
      name: "Domain Master",
      description: "Score 90%+ in all 5 domains",
      icon: Target,
      earned: false
    },
    {
      id: 4,
      name: "Perfectionist",
      description: "Get 100% on any practice test",
      icon: Award,
      earned: false,
      date: null,
    },
    {
      id: 5,
      name: "Marathon Runner",
      description: "Answer 1,000+ questions",
      icon: CheckCircle2,
      earned: (stats?.totalAnswered || 0) >= 1000
    },
  ]

  const userName = user?.fullName || "User"
  const userEmail = user?.emailAddresses[0]?.emailAddress || ""
  const userInitials = user?.firstName?.[0] + (user?.lastName?.[0] || "") || "U"
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Recently"

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-balance">Settings</h1>
          <p className="mt-2 text-lg text-muted-foreground">Manage your account preferences and profile</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={userName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={userEmail}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joined">Member Since</Label>
                    <Input id="joined" defaultValue={joinedDate} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="est">
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="est">Eastern Time (ET)</SelectItem>
                        <SelectItem value="cst">Central Time (CT)</SelectItem>
                        <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                        <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Certverse looks on your device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Select your preferred color scheme</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Receive email updates about your progress</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    disabled
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="study-reminders">Study Reminders</Label>
                      <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Get daily reminders to maintain your streak</p>
                  </div>
                  <Switch id="study-reminders" checked={studyReminders} disabled />
                </div>

                <div className="flex justify-end">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold">
                            {subscription?.plan_type === 'paid' ? 'Premium Plan' : 'Free Plan'}
                          </h3>
                          <Badge className={subscription?.is_paid ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""}>
                            {subscription?.status === 'trialing' ? 'Trial' :
                             subscription?.status === 'canceled' ? 'Canceling' :
                             subscription?.status === 'active' ? 'Active' :
                             subscription?.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {subscription?.plan_type === 'paid' ? '$29.00 / month' : '$0.00 / month'}
                        </p>

                        {/* Show trial end date */}
                        {subscription?.status === 'trialing' && subscription?.current_period_end && (
                          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                            Trial ends on {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}

                        {/* Show renewal date for active paid */}
                        {subscription?.is_paid && subscription?.status === 'active' && subscription?.current_period_end && (
                          <p className="text-sm text-muted-foreground">
                            Renews on {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}

                        {/* Show cancellation info */}
                        {subscription?.status === 'canceled' && subscription?.cancel_at && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                            Access until {new Date(subscription.cancel_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {!subscription?.is_paid && (
                        <Button onClick={handleUpgrade} disabled={isUpgrading}>
                          {isUpgrading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Upgrade to Premium'
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="mt-6 space-y-3 rounded-lg border bg-muted/50 p-4">
                      <h4 className="font-semibold">
                        {subscription?.plan_type === 'paid' ? 'Premium Features:' : 'Free Plan Features:'}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {subscription?.plan_type === 'paid' ? (
                          <>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Unlimited questions per day
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Detailed explanations for every answer
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Advanced dashboard & analytics
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Priority support
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              2 questions per day
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Basic stats tracking
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Streak tracking
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    {subscription?.is_paid && subscription?.polar_customer_id && (
                      <div className="mt-6 flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={async () => {
                            try {
                              if (!user?.id) return;
                              const portalUrl = await getCustomerPortalUrl(user.id);
                              window.open(portalUrl, '_blank');
                            } catch (error) {
                              console.error('Failed to get portal URL:', error);
                              alert('Unable to open customer portal. Please try again later.');
                            }
                          }}
                        >
                          View Customer Portal
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {!subscription?.is_paid && (
              <Card>
                <CardHeader>
                  <CardTitle>Upgrade to Premium</CardTitle>
                  <CardDescription>Unlock unlimited access and detailed explanations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border-2 border-primary p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold">Premium Plan</h3>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">$29</p>
                      <p className="text-sm text-muted-foreground">per month</p>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Unlimited questions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Detailed explanations
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Advanced analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Priority support
                      </li>
                    </ul>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Upgrade Now'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
