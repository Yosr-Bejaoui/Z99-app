import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export default function AboutUsPage() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('About Us');
  const [version, setVersion] = useState('1.0.0');
  const [contactEmail, setContactEmail] = useState('support@aimodel.com');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [id, setId] = useState<number | null>(null);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const response = await api.get('/accounts/admin/about/');
      const items = response.data.results || response.data;
      if (items && items.length > 0) {
        const item = items[0];
        setId(item.id);
        setTitle(item.title);
        setContent(item.content);
        setVersion(item.version);
        setContactEmail(item.contact_email);
        setWebsiteUrl(item.website_url || '');
        setIsPublished(item.is_published);
      }
    } catch (error) {
      toast.error('Failed to fetch about us content');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        title,
        content,
        version,
        contact_email: contactEmail,
        website_url: websiteUrl,
        is_published: isPublished
      };

      if (id) {
        await api.patch(`/accounts/admin/about/${id}/`, payload);
        toast.success('About content updated successfully');
      } else {
        const res = await api.post('/accounts/admin/about/', payload);
        setId(res.data.id);
        toast.success('About content created successfully');
      }
    } catch (error) {
      toast.error('Failed to save about content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About Us Admin Controls</h1>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Publish Content'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Visible to Users
          </label>
        </div>

        <div className="mt-6 text-black">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page Content</label>
          <div className="bg-white">
            <ReactQuill 
               theme="snow" 
               value={content} 
               onChange={setContent} 
               style={{ height: '300px', marginBottom: '50px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
