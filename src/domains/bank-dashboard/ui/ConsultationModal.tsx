'use client';

import { useState } from 'react';
import { X, Send, Building2, User, Phone, Mail, Globe, FileText, MessageSquare, Loader2 } from 'lucide-react';

interface ConsultationModalProps { isOpen: boolean; onClose: () => void; bankCode?: string; }

const INTEGRATION_OPTIONS = ['API','Wordpress','Tilda','1С-Битрикс','Битрикс24','Webasyst','Opencart','MODx','Joomla','UMI.CMS','Drupal','Insales','Ссылки из ЛК','Другое'];
const CLOUD_OPTIONS = [{ value: 'Да', label: 'Да' }, { value: 'Нет', label: 'Нет' }, { value: 'Требуется консультация', label: 'Требуется консультация' }];

export function ConsultationModal({ isOpen, onClose, bankCode }: ConsultationModalProps) {
  const [formData, setFormData] = useState({ companyName: '', inn: '', contactName: '', phone: '', email: '', website: '', integration: '', needCloudTerminal: '', comment: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.companyName.trim()) e.companyName = 'Укажите название организации';
    if (!formData.inn.trim()) e.inn = 'Укажите ИНН'; else if (!/^\d{10,12}$/.test(formData.inn)) e.inn = 'ИНН 10-12 цифр';
    if (!formData.contactName.trim()) e.contactName = 'Укажите ФИО';
    if (!formData.phone.trim()) e.phone = 'Укажите телефон';
    if (!formData.email.trim()) e.email = 'Укажите email'; else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Некорректный email';
    if (!formData.website.trim()) e.website = 'Укажите сайт';
    if (!formData.integration) e.integration = 'Выберите способ интеграции';
    if (!formData.needCloudTerminal) e.needCloudTerminal = 'Выберите необходимость облачной кассы';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/consultation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, bankCode }) });
      if (res.ok) { setSuccess(true); setTimeout(() => { setSuccess(false); onClose(); setFormData({ companyName: '', inn: '', contactName: '', phone: '', email: '', website: '', integration: '', needCloudTerminal: '', comment: '' }); }, 3000); }
      else { const d = await res.json(); alert(d.error || 'Ошибка отправки'); }
    } catch { alert('Ошибка сети'); } finally { setLoading(false); }
  };

  const ic = (f: string) => `w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition ${errors[f] ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-border focus:border-[#f10d30] focus:ring-2 focus:ring-[#f10d30]/10'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl m-4">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition" type="button"><X className="h-5 w-5" /></button>
        <div className="mb-6 pr-8">
          <h2 className="text-xl font-semibold text-foreground">Заявка на консультацию</h2>
          <p className="mt-1 text-sm text-muted-foreground">Заполните форму — мы свяжемся с вами</p>
          {bankCode && <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#10385c]/10 px-3 py-1 text-xs font-medium text-[#10385c]"><Building2 className="h-3 w-3" />Банк: {bankCode.toUpperCase()}</div>}
        </div>

        {success ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/30 dark:bg-green-950/20">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">✓</div>
            <div className="text-lg font-semibold text-green-800 dark:text-green-400">Заявка отправлена</div>
            <p className="mt-1 text-sm text-green-600 dark:text-green-300">Сделка создана в Битрикс24</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><Building2 className="h-4 w-4 text-muted-foreground" />Название организации <span className="text-red-500">*</span></label><input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className={ic('companyName')} placeholder="ООО Рога и Копыта" />{errors.companyName && <p className="mt-1.5 text-xs text-red-500">{errors.companyName}</p>}</div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-muted-foreground" />ИНН <span className="text-red-500">*</span></label><input type="text" inputMode="numeric" value={formData.inn} onChange={(e) => setFormData({ ...formData, inn: e.target.value.replace(/\D/g, '') })} className={ic('inn')} placeholder="7804023410" maxLength={12} />{errors.inn && <p className="mt-1.5 text-xs text-red-500">{errors.inn}</p>}</div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><User className="h-4 w-4 text-muted-foreground" />Контактное лицо <span className="text-red-500">*</span></label><input type="text" value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} className={ic('contactName')} placeholder="Иванов Иван Иванович" />{errors.contactName && <p className="mt-1.5 text-xs text-red-500">{errors.contactName}</p>}</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><Phone className="h-4 w-4 text-muted-foreground" />Телефон <span className="text-red-500">*</span></label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={ic('phone')} placeholder="+7 (999) 249-98-42" />{errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}</div>
              <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-muted-foreground" />Email <span className="text-red-500">*</span></label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={ic('email')} placeholder="ivan@example.com" />{errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}</div>
            </div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4 text-muted-foreground" />Сайт <span className="text-red-500">*</span></label><input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={ic('website')} placeholder="example.com" />{errors.website && <p className="mt-1.5 text-xs text-red-500">{errors.website}</p>}</div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-muted-foreground" />Способ интеграции <span className="text-red-500">*</span></label><select value={formData.integration} onChange={(e) => setFormData({ ...formData, integration: e.target.value })} className={ic('integration') + ' cursor-pointer'}><option value="">Выберите способ интеграции</option>{INTEGRATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>{errors.integration && <p className="mt-1.5 text-xs text-red-500">{errors.integration}</p>}</div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-muted-foreground" />Облачная касса <span className="text-red-500">*</span></label><select value={formData.needCloudTerminal} onChange={(e) => setFormData({ ...formData, needCloudTerminal: e.target.value })} className={ic('needCloudTerminal') + ' cursor-pointer'}><option value="">Выберите</option>{CLOUD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{errors.needCloudTerminal && <p className="mt-1.5 text-xs text-red-500">{errors.needCloudTerminal}</p>}</div>
            <div><label className="mb-2 flex items-center gap-2 text-sm font-medium"><MessageSquare className="h-4 w-4 text-muted-foreground" />Комментарий</label><textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} className={ic('comment')} rows={3} placeholder="Дополнительная информация..." /></div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f10d30] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#d10a28] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Отправка...</> : <><Send className="h-4 w-4" />Отправить заявку</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}