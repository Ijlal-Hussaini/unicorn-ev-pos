import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  User,
  Mail,
  Camera,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Phone,
  CreditCard,
  Shield,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import EmailVerificationModal from '../../components/EmailVerificationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usersAPI, uploadAPI } from '../../services/api';
import { setUser } from '../../store/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    cnic: '',
    photo: '',
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        cnic: user.cnic || '',
        photo: user.profilePhoto || '',
      });
      setPreviewImage(user.profilePhoto || null);
    }
  }, [user]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploading(true);
    try {
      const response = await uploadAPI.uploadProfilePhoto(file);
      
      console.log('Upload response:', response);
      
      // Extract photo URL from response
      // Backend returns: { success: true, data: { profilePhoto: "url", user: {...} } }
      let photoUrl = response.data?.profilePhoto || response.profilePhoto || response.data?.url || response.url;
      
      // Ensure photoUrl is a string
      if (typeof photoUrl === 'object') {
        photoUrl = photoUrl.url || photoUrl.secure_url || '';
      }
      
      if (!photoUrl || typeof photoUrl !== 'string') {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid photo URL received from upload');
      }
      
      console.log('Photo URL:', photoUrl);
      
      // Update local state
      setProfileData({ ...profileData, photo: photoUrl });
      
      // The backend already updated the user's profilePhoto, so we can use the user from response
      const updatedUserFromBackend = response.data?.user;
      
      if (updatedUserFromBackend && updatedUserFromBackend._id) {
        // Use the complete user object from backend
        const updatedUser = {
          _id: updatedUserFromBackend._id,
          username: updatedUserFromBackend.username,
          email: updatedUserFromBackend.email,
          role: updatedUserFromBackend.role,
          isActive: updatedUserFromBackend.isActive,
          phone: updatedUserFromBackend.phone || '',
          cnic: updatedUserFromBackend.cnic || '',
          profilePhoto: updatedUserFromBackend.profilePhoto,
          createdAt: updatedUserFromBackend.createdAt,
          updatedAt: updatedUserFromBackend.updatedAt,
        };
        
        console.log('Updated user object:', updatedUser);
        
        // Update Redux store
        dispatch(setUser(updatedUser));

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        // Fallback: manually update just the photo
        const updatedUser = {
          ...user,
          profilePhoto: photoUrl,
        };
        
        dispatch(setUser(updatedUser));
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      toast({
        title: 'Success',
        description: 'Profile photo updated successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
      // Reset preview on error
      setPreviewImage(user?.profilePhoto || null);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    // Check if user exists
    if (!user || !user._id) {
      toast({
        title: 'Error',
        description: 'User session not found. Please login again.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (!profileData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!profileData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    // Check if email has changed
    const emailChanged = user.email !== profileData.email;

    if (emailChanged) {
      // Request email change with OTP verification
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/users/request-email-change`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newEmail: profileData.email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send verification code');
        }

        setPendingEmail(profileData.email);
        setShowEmailVerification(true);
        
        toast({
          title: 'Verification Required',
          description: 'Please check your new email for the verification code.',
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to request email change',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Update other profile fields (no email change)
    setLoading(true);
    try {
      const response = await usersAPI.update(user._id, {
        username: profileData.name,
        phone: profileData.phone,
        cnic: profileData.cnic,
        profilePhoto: profileData.photo,
      });

      // Update Redux store with new user data
      dispatch(setUser(response.data || response));

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerificationSuccess = (updatedUser) => {
    // Update Redux store with new user data
    dispatch(setUser(updatedUser));
    
    // Update local state
    setProfileData({
      ...profileData,
      email: updatedUser.email,
    });
    
    // Update localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedUser }));
  };

  const handleRemovePhoto = async () => {
    setLoading(true);
    try {
      // Update backend to remove photo
      await usersAPI.update(user._id, {
        profilePhoto: '',
      });

      // Update local state
      setProfileData({ ...profileData, photo: '' });
      setPreviewImage(null);

      // Update Redux store immediately
      const updatedUser = { ...user, profilePhoto: '' };
      dispatch(setUser(updatedUser));

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast({
        title: 'Success',
        description: 'Profile photo removed successfully',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove photo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground">
      <Navbar />
      <NavigationPanel />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-44 sm:pt-40">
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
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-muted-foreground mt-1">
                Update your personal information and profile photo
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="border-2 border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-border bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Profile Information</CardTitle>
                <CardDescription>Update your account details and profile picture</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Profile Photo Section */}
              <div className="flex flex-col items-center gap-6 pb-8 border-b border-border">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500 shadow-lg">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 flex items-center justify-center">
                        <User className="w-16 h-16 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full cursor-pointer hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Click the camera icon to upload a new photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                  {previewImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="mt-3"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold">
                    Full Name
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="pl-12 h-12 text-base border-2 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                    Email Address
                    {user?.email !== profileData.email && (
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-600 dark:text-amber-400">
                        <Shield className="w-3 h-3" />
                        Requires verification
                      </span>
                    )}
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      className="pl-12 h-12 text-base border-2 focus:border-cyan-500"
                    />
                  </div>
                  {user?.email !== profileData.email && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll need to verify your new email with an OTP
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-semibold">
                    Phone Number
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="pl-12 h-12 text-base border-2 focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cnic" className="text-base font-semibold">
                    CNIC
                  </Label>
                  <div className="relative mt-2">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="cnic"
                      type="text"
                      placeholder="XXXXX-XXXXXXX-X"
                      value={profileData.cnic}
                      onChange={(e) =>
                        setProfileData({ ...profileData, cnic: e.target.value })
                      }
                      className="pl-12 h-12 text-base border-2 focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProfileData({
                      name: user.username || '',
                      email: user.email || '',
                      phone: user.phone || '',
                      cnic: user.cnic || '',
                      photo: user.profilePhoto || '',
                    });
                    setPreviewImage(user.profilePhoto || null);
                  }}
                  className="h-11 px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading || uploading}
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
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Verification Modal */}
        <EmailVerificationModal
          isOpen={showEmailVerification}
          onClose={() => setShowEmailVerification(false)}
          newEmail={pendingEmail}
          onSuccess={handleEmailVerificationSuccess}
        />
      </main>
    </div>
  );
};

export default Profile;
