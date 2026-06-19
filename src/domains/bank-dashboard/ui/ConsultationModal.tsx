'use client';

import { useState } from 'react';
import { X, Send, Building2, User, Phone, Mail, Globe, FileText, MessageSquare, Loader2 } from 'lucide-react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankCode?: string;
}

const INTEGRATION_OPTIONS = [
  'API', 'Wordpress', 'Tilda', '1С-Битрикс', 'Битрикс24',
  'Webasyst', 'Opencart', 'MODx', 'Joomla', 'UMI.CMS',
  'Drupal', 'Insales', 'Ссылки из ЛК', 'Другое',
];

const CLOUD_OPTIONS = [
  { value: 'Да', label: 'Да' },
  { value: 'Нет', label: 'Нет' },
  { value: 'Требуется консультация', label: 'Консультация' },
];

export function ConsultationModal({ isOpen, onClose, bankCode }: ConsultationModalProps) {
  const [formData, setFormData] = useState({
    companyName: '',
    inn: '',
    contactName: '',
    phone: '',
    email: '',
    website: '',
    integration: '',
    needCloudTerminal: '',
    comment: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) newErrors.companyName = 'Укажите название';
    if (!formData.inn.trim()) newErrors.inn = 'Укажите ИНН';
    else if (!/^\d{10,12}$/.test(formData.inn)) newErrors.inn = '10-12 цифр';
    if (!formData.contactName.trim()) newErrors.contactName = 'Укажите ФИО';
    if (!formData.phone.trim()) newErrors.phone = 'Укажите телефон';
    if (!formData.integration) newErrors.integration = 'Выберите';
    if (!formData.needCloudTerminal) newErrors.needCloudTerminal = 'Выберите';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, bankCode }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          setFormData({
            companyName: '', inn: '', contactName: '', phone: '',
            email: '', website: '', integration: '', needCloudTerminal: '', comment: '',
          });
        }, 2500);
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка отправки');
      }
    } catch {
      alert('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const ic = (field: string) => `
    w-full rounded-lg border bg-background px-3 py-2 text-[13px] outline-none transition
    ${errors[field] 
      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
      : 'border-border focus:border-[#f10d30] focus:ring-1 focus:ring-[#f10d30]/10'
    }
  `;

  const lbl = "mb-1 flex items-center gap-1.5 text-[12px] font-medium text-foreground";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl m-4 max-h-[95vh] overflow-y-auto">
        {/* Close */}
        <button 
          onClick={onClose} 
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition" 
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-4 pr-6">
          <h2 className="text-lg font-semibold text-foreground">Заявка на консультацию</h2>
           
        </div>

        {success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-900/30 dark:bg-green-950/20">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 text-lg">✓</div>
            <div className="text-base font-semibold text-green-800 dark:text-green-400">Отправлено!</div>
            <p className="text-xs text-green-600 dark:text-green-300 mt-1">Сделка создана в Битрикс24</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Org + INN */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}><Building2 className="h-3.5 w-3.5 text-muted-foreground" />Организация *</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className={ic('companyName')} placeholder="ООО Ромашка" />
                {errors.companyName && <p className="mt-0.5 text-[10px] text-red-500">{errors.companyName}</p>}
              </div>
              <div>
                <label className={lbl}><FileText className="h-3.5 w-3.5 text-muted-foreground" />ИНН *</label>
                <input type="text" inputMode="numeric" value={formData.inn} onChange={(e) => setFormData({ ...formData, inn: e.target.value.replace(/\D/g, '') })} className={ic('inn')} placeholder="7804023410" maxLength={12} />
                {errors.inn && <p className="mt-0.5 text-[10px] text-red-500">{errors.inn}</p>}
              </div>
            </div>

            {/* Row 2: Contact */}
            <div>
              <label className={lbl}><User className="h-3.5 w-3.5 text-muted-foreground" />Контактное лицо *</label>
              <input type="text" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className={ic('contactName')} placeholder="Иванов И.И." />
              {errors.contactName && <p className="mt-0.5 text-[10px] text-red-500">{errors.contactName}</p>}
            </div>

            {/* Row 3: Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}><Phone className="h-3.5 w-3.5 text-muted-foreground" />Телефон *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={ic('phone')} placeholder="+7 999 249-98-42" />
                {errors.phone && <p className="mt-0.5 text-[10px] text-red-500">{errors.phone}</p>}
              </div>
              <div>
                <label className={lbl}><Mail className="h-3.5 w-3.5 text-muted-foreground" />Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={ic('email')} placeholder="ivan@mail.ru" />
              </div>
            </div>

            {/* Row 4: Website + Integration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}><Globe className="h-3.5 w-3.5 text-muted-foreground" />Сайт</label>
                <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={ic('website')} placeholder="example.com" />
              </div>
              <div>
                <label className={lbl}><FileText className="h-3.5 w-3.5 text-muted-foreground" />Интеграция *</label>
                <select value={formData.integration} onChange={(e) => setFormData({ ...formData, integration: e.target.value })} className={ic('integration') + ' cursor-pointer'}>
                  <option value="">Выбрать...</option>
                  {INTEGRATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.integration && <p className="mt-0.5 text-[10px] text-red-500">{errors.integration}</p>}
              </div>
            </div>

            {/* Row 5: Cloud */}
            <div>
              <label className={lbl}><FileText className="h-3.5 w-3.5 text-muted-foreground" />Облачная касса *</label>
              <select value={formData.needCloudTerminal} onChange={(e) => setFormData({ ...formData, needCloudTerminal: e.target.value })} className={ic('needCloudTerminal') + ' cursor-pointer'}>
                <option value="">Выберите...</option>
                {CLOUD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.needCloudTerminal && <p className="mt-0.5 text-[10px] text-red-500">{errors.needCloudTerminal}</p>}
            </div>

            {/* Row 6: Comment */}
            <div>
              <label className={lbl}><MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />Комментарий</label>
              <textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} className={ic('comment')} rows={2} placeholder="Доп. информация..." />
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading} 
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f10d30] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#d10a28] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Отправка...</> : <><Send className="h-4 w-4" />Отправить заявку</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}