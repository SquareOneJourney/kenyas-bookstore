import React, { useState, FormEvent } from 'react';
import { MOCK_ORDERS } from '../lib/mockData';
import { OrderWithItems } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import { formatMoneyFromCents } from '../lib/money';

const AccountTabs: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ activeTab, setActiveTab }) => {
  const tabs = ['My Orders', 'Wishlist', 'Settings'];
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${activeTab === tab
                ? 'border-forest text-forest'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};

const WishlistPanel: React.FC = () => {
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 mb-4">Your wishlist is currently empty.</p>
        <Button variant="outline" onClick={() => window.location.href = '/catalog'}>Browse Books</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {wishlist.map(book => <BookCard key={book.id} book={book} />)}
    </div>
  );
};

const OrdersPanel: React.FC = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-4">Your Past Orders</h2>
    <div className="space-y-6">
      {MOCK_ORDERS.map((order: OrderWithItems) => (
        <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="font-bold">Order ID: {order.id}</p>
              <p className="text-sm text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {order.status}
            </span>
          </div>
          <div>
            {order.items.map(item => (
              <div key={item.id} className="text-sm flex justify-between py-1">
                <span>{item.title} (x{item.quantity})</span>
                <span>{formatMoneyFromCents(item.unit_price_cents * item.quantity, order.currency || 'USD')}</span>
              </div>
            ))}
          </div>
          <div className="text-right font-bold mt-2 pt-2 border-t">
            Total: {formatMoneyFromCents(order.total_cents ?? 0, order.currency || 'USD')}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettingsPanel: React.FC<{ userEmail?: string; userName?: string }> = ({ userEmail, userName }) => {
  const { signOut } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateSettings = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    // TODO: Implement update user profile
    setTimeout(() => {
      setIsUpdating(false);
      alert('Settings updated successfully!');
    }, 1000);
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);
    // TODO: Implement change password
    setTimeout(() => {
      setIsChangingPassword(false);
      alert('Password changed successfully!');
    }, 1000);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <form onSubmit={handleUpdateSettings} className="space-y-4">
          <Input
            label="Email Address"
            id="email"
            type="email"
            defaultValue={userEmail || ''}
            disabled
          />
          <Input
            label="Full Name"
            id="name"
            defaultValue={userName || ''}
          />
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Settings'}
          </Button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4 mt-6">
        <h3 className="text-xl font-semibold">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Current Password" id="current-pw" type="password" required />
          <Input label="New Password" id="new-pw" type="password" required minLength={6} />
          <Button type="submit" variant="outline" disabled={isChangingPassword}>
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4 mt-6">
        <h3 className="text-xl font-semibold">Sign Out</h3>
        <p className="text-sm text-gray-600 mb-4">Sign out of your account</p>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

const LoginForm: React.FC<{ onSwitchToSignUp: () => void }> = ({ onSwitchToSignUp }) => {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();

    if (googleError) {
      setError(googleError.message || 'Failed to sign in with Google.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="font-serif text-3xl font-bold mb-2 text-center text-deep-blue">Welcome Back</h1>
      <p className="text-center text-gray-600 mb-6">Sign in to your account</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting || loading}
        />
        <Input
          label="Password"
          id="login-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isSubmitting || loading}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full mt-4 flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-forest hover:text-forest/80 font-medium"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

const SignUpForm: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const { signUp, signInWithGoogle, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    const { error: signUpError } = await signUp(email, password, fullName);

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message || 'Failed to create account. Please try again.');
    } else {
      setSuccess('Account created successfully! Please check your email to verify your account.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();

    if (googleError) {
      setError(googleError.message || 'Failed to sign up with Google.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h1 className="font-serif text-3xl font-bold mb-2 text-center text-deep-blue">Create Account</h1>
      <p className="text-center text-gray-600 mb-6">Sign up to get started</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          id="signup-name"
          type="text"
          placeholder="Jane Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={isSubmitting || loading}
        />
        <Input
          label="Email"
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting || loading}
        />
        <Input
          label="Password"
          id="signup-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={isSubmitting || loading}
        />
        <Input
          label="Confirm Password"
          id="signup-confirm-pw"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={isSubmitting || loading}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full mt-4 flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-forest hover:text-forest/80 font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

const AccountPage: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('My Orders');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-forest"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        {authMode === 'login' ? (
          <LoginForm onSwitchToSignUp={() => setAuthMode('signup')} />
        ) : (
          <SignUpForm onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-serif text-4xl font-bold text-deep-blue">My Account</h1>
        <div className="text-sm text-gray-600">
          Signed in as <span className="font-medium">{userEmail}</span>
        </div>
      </div>
      <AccountTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <div>
        {activeTab === 'My Orders' && <OrdersPanel />}
        {activeTab === 'Wishlist' && <WishlistPanel />}
        {activeTab === 'Settings' && <SettingsPanel userEmail={userEmail} userName={userName} />}
      </div>
    </div>
  );
};

export default AccountPage;
