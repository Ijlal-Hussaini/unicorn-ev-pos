import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Lock,
  Bell,
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  Settings as SettingsIcon,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { usersAPI } from '../../services/api';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    salesAlerts: true,
    lowStockAlerts: true,
    newCustomerAlerts: false,
    systemUpdates: true,
  });

  const tabs = [
    { id: 'security', label: 'Security', icon: Lock, description: 'Password and authentication' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts and preferences' },
  ];

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notificationSettings');
    
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications));
    }
  }, []);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await usersAPI.changePassword(
        user._id,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Success',
        description: 'Password changed successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    toast({
      title: 'Success',
      description: 'Notification preferences saved',
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground">
      <Navbar />
      <NavigationPanel />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-44 sm:pt-40">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/dashboard')}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account and application preferences
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Horizontal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 shadow-lg shadow-cyan-500/20'
                    : 'border-border bg-white/50 dark:bg-slate-900/50 hover:border-cyan-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isActive 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg mb-1 ${
                      isActive ? 'text-cyan-700 dark:text-cyan-400' : 'text-foreground'
                    }`}>
                      {tab.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tab.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute top-4 right-4">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card className="border-2 border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-border bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Change Password</CardTitle>
                    <CardDescription>Update your account password to keep it secure</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Password Requirements Info */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2">
                      Password Requirements
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        At least 6 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Mix of letters and numbers recommended
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="currentPassword" className="text-base font-semibold">
                        Current Password
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          placeholder="Enter your current password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          className="pl-12 pr-12 h-12 text-base border-2 focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword" className="text-base font-semibold">
                        New Password
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          placeholder="Enter your new password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          className="pl-12 pr-12 h-12 text-base border-2 focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <Label htmlFor="confirmPassword" className="text-base font-semibold">
                        Confirm New Password
                      </Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          className="pl-12 pr-12 h-12 text-base border-2 focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })}
                      className="h-11 px-6"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}



          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card className="border-2 border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-border bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Notification Preferences</CardTitle>
                    <CardDescription>Choose what notifications you want to receive</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[
                      {
                        key: 'emailNotifications',
                        label: 'Email Notifications',
                        description: 'Receive email updates about your account activity',
                        icon: '📧',
                      },
                      {
                        key: 'salesAlerts',
                        label: 'Sales Alerts',
                        description: 'Get notified immediately when a new sale is made',
                        icon: '💰',
                      },
                      {
                        key: 'lowStockAlerts',
                        label: 'Low Stock Alerts',
                        description: 'Receive alerts when product inventory is running low',
                        icon: '📦',
                      },
                      {
                        key: 'newCustomerAlerts',
                        label: 'New Customer Alerts',
                        description: 'Get notified when a new customer registers in the system',
                        icon: '👤',
                      },
                      {
                        key: 'systemUpdates',
                        label: 'System Updates',
                        description: 'Receive notifications about system updates and maintenance',
                        icon: '🔔',
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-5 rounded-xl border-2 border-border bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="text-3xl mt-1">{item.icon}</div>
                          <div className="flex-1">
                            <Label className="text-base font-semibold cursor-pointer">
                              {item.label}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <Checkbox
                          checked={notificationSettings[item.key]}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: checked,
                            })
                          }
                          className="h-6 w-6 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const saved = localStorage.getItem('notificationSettings');
                        if (saved) setNotificationSettings(JSON.parse(saved));
                      }}
                      className="h-11 px-6"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={handleNotificationSave}
                      className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </main>
    </div>
  );
};

export default Settings;
