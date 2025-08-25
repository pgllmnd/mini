import { useState, useRef } from 'react';
import api from '../lib/api';

interface EditProfileModalProps {
  user: {
    username: string;
    bio?: string;
    avatar_url?: string;
  };
  onClose: () => void;
  onUpdate: () => void;
}

export function EditProfileModal({ user, onClose, onUpdate }: EditProfileModalProps) {
  const [bio, setBio] = useState(user.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      setLoading(false);
      return;
    }

    try {
      // 1. If there's a file, upload it first via /avatar endpoint (has multer)
      if (fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append('avatar', fileInputRef.current.files[0]);
        
        await api.post('/api/users/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // 2. Update profile with bio
      await api.patch('/api/users/profile', { bio }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      // Success
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-light dark:bg-background-dark rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-text-primary-light dark:text-text-primary-dark">
          Edit Profile
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-light dark:bg-surface-dark">
                <img
                  src={avatarPreview || '/default-avatar.png'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-md hover:bg-opacity-80"
              >
                Choose Image
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label 
              htmlFor="bio"
              className="block text-text-secondary-light dark:text-text-secondary-dark mb-2"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
