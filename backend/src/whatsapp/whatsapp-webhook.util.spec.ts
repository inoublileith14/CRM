import { parseWhatsAppWebhookPayload } from './whatsapp-webhook.util';

describe('parseWhatsAppWebhookPayload', () => {
  it('extracts inbound text messages', () => {
    const messages = parseWhatsAppWebhookPayload({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                messages: [
                  {
                    from: '34612226593',
                    id: 'wamid.test',
                    timestamp: '1710000000',
                    type: 'text',
                    text: { body: 'Hola' },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(messages).toEqual([
      {
        from: '34612226593',
        messageId: 'wamid.test',
        timestamp: '1710000000',
        type: 'text',
        text: 'Hola',
      },
    ]);
  });

  it('returns empty array for non-whatsapp payloads', () => {
    expect(parseWhatsAppWebhookPayload({ object: 'page' })).toEqual([]);
  });
});
