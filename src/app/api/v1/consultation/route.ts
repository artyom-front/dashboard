import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/domains/shared/config/env';
import { z } from 'zod';

const consultationSchema = z.object({
  companyName: z.string().min(1), inn: z.string().min(10).max(12),
  contactName: z.string().min(1), phone: z.string().min(1),
  email: z.string().email(), website: z.string().min(1),
  integration: z.string().min(1), needCloudTerminal: z.string().min(1),
  comment: z.string().optional().default(''), bankCode: z.string().optional().default(''),
});

const ASSIGNED_BY_ID = '6593';
const STAGE_ID = 'C26:NEW';
const CATEGORY_ID = 26;
const BANK_SOURCE_MAP: Record<string, string> = { bspb: 'bspb', sber: 'sber', vtb: 'vtb', alfa: 'alfa', tinkoff: 'tinkoff', raiff: 'raiff', otkritie: 'otkritie', psb: 'psb' };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = consultationSchema.parse(body);
    const contactResult = await createContact(data);
    if (!contactResult.result) throw new Error('Failed to create contact: ' + JSON.stringify(contactResult));
    const contactId = contactResult.result;
    const dealResult = await createDeal(data, contactId);
    if (!dealResult.result) throw new Error('Failed to create deal: ' + JSON.stringify(dealResult));
    return NextResponse.json({ success: true, dealId: dealResult.result, contactId });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    console.error('Consultation error:', error);
    return NextResponse.json({ error: 'Failed to process consultation request' }, { status: 500 });
  }
}

async function createContact(data: z.infer<typeof consultationSchema>) {
  const nameParts = data.contactName.trim().split(/\s+/);
  const lastName = nameParts[0] || ''; const firstName = nameParts[1] || ''; const secondName = nameParts[2] || '';
  return (await fetch(`${env.bitrixWebhook}crm.contact.add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { NAME: firstName, LAST_NAME: lastName, SECOND_NAME: secondName, PHONE: [{ VALUE: data.phone, VALUE_TYPE: 'WORK' }], EMAIL: [{ VALUE: data.email, VALUE_TYPE: 'WORK' }], SOURCE_ID: 'WEB_FORM', SOURCE_DESCRIPTION: 'Форма заявки на консультацию (дашборд)' } }) })).json();
}

async function createDeal(data: z.infer<typeof consultationSchema>, contactId: number) {
  const sourceId = data.bankCode ? (BANK_SOURCE_MAP[data.bankCode.toLowerCase()] || 'WEB_FORM') : 'WEB_FORM';
  const comments = ['Заявка на консультацию через форму дашборда', '', `Организация: ${data.companyName}`, `ИНН: ${data.inn}`, `Контакт: ${data.contactName}`, `Телефон: ${data.phone}`, `Email: ${data.email}`, `Сайт: ${data.website}`, `Интеграция: ${data.integration}`, `Облачная касса: ${data.needCloudTerminal}`, ...(data.comment ? ['', 'Комментарий:', data.comment] : []), '', '— Автоматически —'].join('\n');
  return (await fetch(`${env.bitrixWebhook}crm.deal.add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { TITLE: `Консультация: ${data.companyName}`, COMPANY_TITLE: data.companyName, STAGE_ID, CATEGORY_ID, ASSIGNED_BY_ID, CONTACT_ID: contactId, SOURCE_ID: sourceId, SOURCE_DESCRIPTION: 'Форма заявки на консультацию (дашборд)', COMMENTS: comments, UF_CRM_1605269817: data.inn, UF_CRM_1696587488771: data.website, UF_CRM_1696587549662: data.integration } }) })).json();
}