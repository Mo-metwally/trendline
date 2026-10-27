'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getApiHost } from '@/src/utils/apiConfig';
import {
  AdminSidebar,
  AdminHeader,
  AdminModal,
  useToast,
} from '@/src/components/adminComponents';
import './CmsManagement.scss';

export default function AdminCmsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const [adminUser, setAdminUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [lang, setLang] = useState('ar');

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/admin/login');
    } else if (session?.user) {
      setAdminUser(session.user);
    }
  }, [status, router, session]);

  // Fetch CMS settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/v1/cms/settings`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSettings(json.data || {});
        else toast.error(json.message || 'Failed to load settings');
      } else {
        toast.error('Failed to load CMS settings');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error loading CMS settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openEdit = (key, value) => {
    setEditingKey(key);
    setEditingValue(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const apiHost = getApiHost();
      const token = localStorage.getItem('trendline_admin_token') || '';
      const payload = {
        settings: [{ setting_key: editingKey, setting_value_common: editingValue }],
      };
      const res = await fetch(`${apiHost}/api/v1/cms/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Setting saved');
        setIsModalOpen(false);
        fetchSettings();
      } else {
        toast.error(json.message || 'Failed to save setting');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving setting');
    }
  };

  return (
    <div className="cms-admin-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <AdminSidebar lang={lang} />
      <div className="main-content">
        <AdminHeader
          user={adminUser}
          onLogout={() => {
            localStorage.removeItem('trendline_admin_token');
            router.push('/admin/login');
          }}
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        />
        <div className="content-body">
          <h1 className="page-title">{lang === 'ar' ? 'إدارة إعدادات CMS' : 'CMS Settings Management'}</h1>
          {loading ? (
            <p>{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : (
            <table className="settings-table">
              <thead>
                <tr>
                  <th>{lang === 'ar' ? 'المفتاح' : 'Key'}</th>
                  <th>{lang === 'ar' ? 'القيمة' : 'Value'}</th>
                  <th>{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(settings).map(([key, val]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td className="value-cell">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                    <td>
                      <button className="btn-edit" onClick={() => openEdit(key, val)}>{lang === 'ar' ? 'تعديل' : 'Edit'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isModalOpen && (
        <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg" title={lang === 'ar' ? 'تحرير الإعداد' : 'Edit Setting'}>
          <form className="edit-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>{lang === 'ar' ? 'المفتاح' : 'Key'}</label>
              <input type="text" value={editingKey} readOnly className="field-input" />
            </div>
            <div className="form-group">
              <label>{lang === 'ar' ? 'القيمة' : 'Value'}</label>
              <textarea
                rows={6}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="field-input"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save">{lang === 'ar' ? 'حفظ' : 'Save'}</button>
              <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
