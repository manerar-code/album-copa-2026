import {
  handleRequest,
  type SendEmailOptions,
} from '../../../supabase/functions/send-deletion-confirmation/handler';

describe('send-deletion-confirmation', () => {
  const validParams = {
    email: 'user@test.com',
    userName: 'Test User',
    scheduledDeleteAt: '2026-07-10T10:00:00.000Z',
  };

  it('calls sendEmail with correct to, subject, and non-empty html', async () => {
    const sendEmail = jest.fn<ReturnType<typeof jest.fn>, [SendEmailOptions]>();
    sendEmail.mockResolvedValue({ error: undefined });

    const result = await handleRequest(validParams, sendEmail);

    expect(result.ok).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const callArg = sendEmail.mock.calls[0][0];
    expect(callArg.to).toBe('user@test.com');
    expect(callArg.subject).toBe('Sua conta será excluída em 30 dias — Álbum Copa 2026');
    expect(callArg.html).toContain('Test User');
    expect(callArg.html).toContain('10 de julho de 2026');
    expect(callArg.html).toContain('Confirmação de Exclusão');
    expect(callArg.from).toBe('noreply@album-copa-2026.app');
  });

  it('returns ok:false when sendEmail returns an error', async () => {
    const sendEmail = jest.fn<ReturnType<typeof jest.fn>, [SendEmailOptions]>();
    sendEmail.mockResolvedValue({ error: { message: 'Resend API error' } });

    const result = await handleRequest(validParams, sendEmail);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Resend API error');
  });

  it('returns ok:false when sendEmail throws', async () => {
    const sendEmail = jest.fn<ReturnType<typeof jest.fn>, [SendEmailOptions]>();
    sendEmail.mockRejectedValue(new Error('Network failure'));

    const result = await handleRequest(validParams, sendEmail);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network failure');
  });

  it('returns ok:false with string error when sendEmail throws non-Error', async () => {
    const sendEmail = jest.fn<ReturnType<typeof jest.fn>, [SendEmailOptions]>();
    sendEmail.mockRejectedValue('string error');

    const result = await handleRequest(validParams, sendEmail);

    expect(result.ok).toBe(false);
    expect(result.error).toBe('string error');
  });
});
