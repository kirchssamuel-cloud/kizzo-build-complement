const COLOR_PRIMARY = '#4C6971';
const COLOR_INK = '#0F1432';
const COLOR_MUTED = '#6B7180';

const layout = (title: string, bodyHtml: string) => `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#F5F4F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:520px;margin:32px auto;padding:32px;background:#ffffff;border-radius:16px;border:1px solid #E5E6F0;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;font-weight:800;font-size:24px;color:${COLOR_PRIMARY};letter-spacing:-0.5px;">Kizzo</div>
      </div>
      ${bodyHtml}
      <hr style="margin-top:32px;border:none;border-top:1px solid #E5E6F0;" />
      <p style="margin-top:24px;text-align:center;font-size:12px;color:${COLOR_MUTED};">
        © Appstronaute · Contrôle parental éducatif
      </p>
    </div>
  </body>
</html>
`;

const codeBlock = (code: string) => `
<div style="margin:24px 0;padding:20px;background:#F5F4F0;border-radius:12px;text-align:center;">
  <div style="font-size:32px;letter-spacing:6px;font-weight:700;color:${COLOR_INK};">${code}</div>
</div>
`;

export const getSignupVerificationEmail = (code: string) => ({
  subject: 'Bienvenue sur Kizzo — vérifie ton email',
  text: `Bienvenue sur Kizzo.\n\nVoici ton code de vérification : ${code}\n\nCe code expire dans 1 heure.`,
  html: layout(
    'Vérification email — Kizzo',
    `
    <h1 style="margin:0;font-size:22px;color:${COLOR_INK};">Bienvenue sur Kizzo 👋</h1>
    <p style="margin-top:12px;color:${COLOR_MUTED};line-height:22px;">
      Pour activer ton compte parent, saisis ce code à 6 chiffres dans l'application :
    </p>
    ${codeBlock(code)}
    <p style="color:${COLOR_MUTED};font-size:13px;">Ce code expire dans 1 heure.</p>
    `,
  ),
});

export const getPasswordResetEmail = (code: string) => ({
  subject: 'Kizzo — réinitialisation de ton mot de passe',
  text: `Voici ton code de réinitialisation : ${code}\n\nCe code expire dans 15 minutes.`,
  html: layout(
    'Réinitialisation mot de passe — Kizzo',
    `
    <h1 style="margin:0;font-size:22px;color:${COLOR_INK};">Réinitialisation du mot de passe</h1>
    <p style="margin-top:12px;color:${COLOR_MUTED};line-height:22px;">
      Saisis ce code pour définir un nouveau mot de passe :
    </p>
    ${codeBlock(code)}
    <p style="color:${COLOR_MUTED};font-size:13px;">
      Ce code expire dans 15 minutes. Si tu n'as pas demandé cette réinitialisation, ignore cet email.
    </p>
    `,
  ),
});

export const getDevicePairingEmail = (childName: string, code: string) => ({
  subject: `Kizzo — code d'appairage pour ${childName}`,
  text: `Code d'appairage pour ${childName} : ${code}\n\nCe code expire dans 15 minutes.`,
  html: layout(
    "Code d'appairage — Kizzo",
    `
    <h1 style="margin:0;font-size:22px;color:${COLOR_INK};">Connecte l'appareil de ${childName}</h1>
    <p style="margin-top:12px;color:${COLOR_MUTED};line-height:22px;">
      Saisis ce code dans l'application Kizzo Enfant sur l'appareil à appairer :
    </p>
    ${codeBlock(code)}
    <p style="color:${COLOR_MUTED};font-size:13px;">Ce code expire dans 15 minutes.</p>
    `,
  ),
});
