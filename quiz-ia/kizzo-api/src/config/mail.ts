import { Resend } from 'resend';
import { env } from './env';
import { logger } from './logger';

type SendMailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const mail = {
  async sendMail(params: SendMailParams) {
    if (!resend) {
      logger.warn(
        { to: params.to, subject: params.subject },
        '[mail] RESEND_API_KEY non configuré — envoi simulé',
      );
      logger.debug({ html: params.html }, '[mail] contenu simulé');
      return { id: 'simulated' };
    }
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return result;
  },
};
