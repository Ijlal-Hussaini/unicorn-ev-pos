import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Check,
  ShoppingCart,
  Package,
  BarChart3,
  Clock,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import NavigationPanel from '../../components/NavigationPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { usersAPI } from '../../services/api';

const Users = () => {
  const { toast } = useToast();
  const { user: currentUser } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    cnic: '',
    role: 'sales',
  });
  const [editUserData, setEditUserData] = useState({
    username: '',
    email: '',
    phone: '',
    cnic: '',
    role: 'sales',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';

      const response = await usersAPI.getAll(params);
      setUsers(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Prevent deleting current user
    if (userId === currentUser?._id) {
      toast({
        title: 'Action Not Allowed',
        description: 'You cannot delete your own account',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersAPI.delete(userId);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
        variant: 'success',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleAddUser = async () => {
    // Validation
    if (!newUserData.username.trim()) {
      toast({
        title: 'Error',
        description: 'Username is required',
        variant: 'destructive',
      });
      return;
    }

    if (!newUserData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    if (!newUserData.password || newUserData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await usersAPI.register(newUserData);
      toast({
        title: 'Success',
        description: 'User created successfully',
        variant: 'success',
      });
      setIsAddDialogOpen(false);
      setNewUserData({
        username: '',
        email: '',
        password: '',
        phone: '',
        cnic: '',
        role: 'sales',
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      cnic: user.cnic || '',
      role: user.role,
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    // Validation
    if (!editUserData.username.trim()) {
      toast({
        title: 'Error',
        description: 'Username is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editUserData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUserData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await usersAPI.update(selectedUser._id, editUserData);
      toast({
        title: 'Success',
        description: 'User updated successfully',
        variant: 'success',
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewActivity = async (user) => {
    setSelectedUser(user);
    setIsActivityDialogOpen(true);
    
    // Mock activity data - replace with actual API call when available
    const mockActivity = [
      {
        id: 1,
        action: 'Login',
        description: 'User logged into the system',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'auth',
      },
      {
        id: 2,
        action: 'Created Sale',
        description: 'Created sale record #INV-2024-001',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        type: 'sale',
      },
      {
        id: 3,
        action: 'Updated Product',
        description: 'Updated inventory for Thunder X Pro',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'inventory',
      },
      {
        id: 4,
        action: 'Added Customer',
        description: 'Added new customer John Doe',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'customer',
      },
      {
        id: 5,
        action: 'Generated Report',
        description: 'Generated monthly sales report',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        type: 'report',
      },
    ];
    
    setUserActivity(mockActivity);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'auth':
        return <Shield className="w-4 h-4" />;
      case 'sale':
        return <ShoppingCart className="w-4 h-4" />;
      case 'inventory':
        return <Package className="w-4 h-4" />;
      case 'customer':
        return <UsersIcon className="w-4 h-4" />;
      case 'report':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'auth':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'sale':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'inventory':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'customer':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'report':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <ShieldAlert className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
      sales: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };
    return styles[role] || styles.sales;
  };

  const getUserInitials = (username) => {
    const names = username?.split(' ') || [];
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return username?.[0]?.toUpperCase() || 'U';
  };

  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: UsersIcon,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      label: 'Active Users',
      value: users.filter((u) => u.isActive).length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Admins',
      value: users.filter((u) => u.role === 'admin').length,
      icon: ShieldCheck,
      color: 'from-purple-500 to-pink-600',
    },
    {
      label: 'Inactive',
      value: users.filter((u) => !u.isActive).length,
      icon: XCircle,
      color: 'from-orange-500 to-red-600',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navbar />
        <NavigationPanel />
        <div className="flex items-center justify-center h-[calc(100vh-140px)] pt-32">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />
      <NavigationPanel />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-44 sm:pt-40">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage system users, roles, and permissions
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account. Fields marked with * are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-base font-semibold">
                        Username <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="username"
                          placeholder="Enter username"
                          value={newUserData.username}
                          onChange={(e) =>
                            setNewUserData({ ...newUserData, username: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-semibold">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={newUserData.email}
                          onChange={(e) =>
                            setNewUserData({ ...newUserData, email: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base font-semibold">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={newUserData.phone}
                          onChange={(e) =>
                            setNewUserData({ ...newUserData, phone: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnic" className="text-base font-semibold">
                        CNIC
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="cnic"
                          placeholder="XXXXX-XXXXXXX-X"
                          value={newUserData.cnic}
                          onChange={(e) =>
                            setNewUserData({ ...newUserData, cnic: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base font-semibold">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password (min 6 characters)"
                        value={newUserData.password}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, password: e.target.value })
                        }
                        className="pl-10 h-11 border-2 focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-base font-semibold">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="role"
                      value={newUserData.role}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, role: e.target.value })
                      }
                      className="w-full h-11 px-3 border-2 border-border rounded-lg bg-white dark:bg-slate-900 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="sales">Sales</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddUser}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information. Fields marked with * are required.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-username" className="text-base font-semibold">
                        Username <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="edit-username"
                          placeholder="Enter username"
                          value={editUserData.username}
                          onChange={(e) =>
                            setEditUserData({ ...editUserData, username: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-base font-semibold">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="edit-email"
                          type="email"
                          placeholder="Enter email address"
                          value={editUserData.email}
                          onChange={(e) =>
                            setEditUserData({ ...editUserData, email: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="text-base font-semibold">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="edit-phone"
                          type="tel"
                          placeholder="Enter phone number"
                          value={editUserData.phone}
                          onChange={(e) =>
                            setEditUserData({ ...editUserData, phone: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cnic" className="text-base font-semibold">
                        CNIC
                      </Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="edit-cnic"
                          placeholder="XXXXX-XXXXXXX-X"
                          value={editUserData.cnic}
                          onChange={(e) =>
                            setEditUserData({ ...editUserData, cnic: e.target.value })
                          }
                          className="pl-10 h-11 border-2 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-role" className="text-base font-semibold">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="edit-role"
                        value={editUserData.role}
                        onChange={(e) =>
                          setEditUserData({ ...editUserData, role: e.target.value })
                        }
                        className="w-full h-11 px-3 border-2 border-border rounded-lg bg-white dark:bg-slate-900 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="sales">Sales</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-status" className="text-base font-semibold">
                        Status <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="edit-status"
                        value={editUserData.isActive ? 'active' : 'inactive'}
                        onChange={(e) =>
                          setEditUserData({ ...editUserData, isActive: e.target.value === 'active' })
                        }
                        className="w-full h-11 px-3 border-2 border-border rounded-lg bg-white dark:bg-slate-900 focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateUser}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Update User
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* User Activity Dialog */}
            <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
              <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6 text-cyan-500" />
                    User Activity
                  </DialogTitle>
                  <DialogDescription>
                    Activity log for {selectedUser?.username}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  {/* Activity Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="border-2 border-border">
                      <CardContent className="p-4 text-center">
                        <ShoppingCart className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-xs text-muted-foreground">Sales</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-border">
                      <CardContent className="p-4 text-center">
                        <Package className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-xs text-muted-foreground">Products</p>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-border">
                      <CardContent className="p-4 text-center">
                        <Clock className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">2h</p>
                        <p className="text-xs text-muted-foreground">Last Active</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                    {userActivity.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userActivity.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-4 rounded-lg border-2 border-border bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:border-cyan-500/50 transition-all"
                          >
                            <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-sm">{activity.action}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {activity.description}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatTimeAgo(activity.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsActivityDialogOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="border-2 border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-2 focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 h-12 border-2 border-border rounded-lg bg-white dark:bg-slate-900 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="sales">Sales</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 h-12 border-2 border-border rounded-lg bg-white dark:bg-slate-900 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card className="border-2 border-border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first user'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const isCurrentUser = user._id === currentUser?._id;
              
              return (
                <Card
                  key={user._id}
                  className={`border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all group ${
                    isCurrentUser 
                      ? 'border-cyan-500 ring-2 ring-cyan-500/20' 
                      : 'border-border hover:border-cyan-500/50'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-14 h-14 border-2 border-cyan-500">
                            {user.profilePhoto ? (
                              <AvatarImage src={user.profilePhoto} alt={user.username} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">
                                {getUserInitials(user.username)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {isCurrentUser && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{user.username}</h3>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-500 rounded-full font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="capitalize">{user.role}</span>
                          </div>
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewActivity(user)}>
                              <Activity className="w-4 h-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.cnic && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                          <span>{user.cnic}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Users;
