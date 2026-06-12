export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  error?: { message: string };
}

export type SendEmailFn = (opts: SendEmailOptions) => Promise<SendEmailResult>;

interface RequestParams {
  email: string;
  userName: string;
  scheduledDeleteAt: string;
}

const FROM_ADDRESS = 'noreply@album-copa-2026.app';

const SUBJECT = 'Sua conta será excluída em 30 dias — Álbum Copa 2026';

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildEmailHtml(userName: string, scheduledDeleteAt: string): string {
  const formattedDate = formatDate(scheduledDeleteAt);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0A2342;">Confirmação de Exclusão de Conta</h1>
  <p>Olá, <strong>${userName}</strong>!</p>
  <p>Recebemos sua solicitação de exclusão de conta no <strong>Álbum Copa 2026</strong>.</p>
  <p>Sua conta e todos os dados associados serão excluídos permanentemente em <strong>${formattedDate}</strong>.</p>
  <p>Se você não solicitou esta exclusão ou mudou de ideia, cancele imediatamente acessando o aplicativo e tocando em "Cancelar exclusão" no banner vermelho.</p>
  <p>Atenciosamente,<br/>Equipe Álbum Copa 2026</p>
  <hr/>
  <p style="font-size: 12px; color: #888;">Este é um e-mail automático. Não responda a esta mensagem.</p>
</body>
</html>`;
}

export function handleRequest(
  params: RequestParams,
  sendEmail: SendEmailFn,
): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    from: FROM_ADDRESS,
    to: params.email,
    subject: SUBJECT,
    html: buildEmailHtml(params.userName, params.scheduledDeleteAt),
  }).then((result) => {
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true };
  }).catch((err: unknown) => {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  });
}
