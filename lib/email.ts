const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '';

const TEMPLATES = {
    WELCOME: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_WELCOME || '',
    CODE: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_2FA || '',
    RESET: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_RESET_PW || '',
};

const isValidKey = (val: string) => !!val && !val.startsWith('ton_') && !val.startsWith('id_');

async function emailjsSend(serviceId: string, templateId: string, params: Record<string, string>): Promise<boolean> {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: params,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`EmailJS error ${response.status}: ${text}`);
    }

    return true;
}

export const sendWelcomeEmail = async (email: string, name: string) => {
    try {
        await emailjsSend(EMAILJS_SERVICE_ID, TEMPLATES.WELCOME, {
            email,
            to_email: email,
            to_name: name,
            message: 'Bienvenue sur QuickBill ! Votre espace Premium est prêt. Commencez à facturer comme un pro.',
        });
        console.log('Welcome email sent!');
        return true;
    } catch (err) {
        console.error('Failed to send welcome email', err);
        return false;
    }
};

export const send2FACode = async (email: string, code: string) => {
    if (!isValidKey(EMAILJS_PUBLIC_KEY) || !isValidKey(EMAILJS_SERVICE_ID) || !isValidKey(TEMPLATES.CODE)) {
        console.error('❌ EmailJS is not configured. Missing or invalid environment variables.');
        return false;
    }

    try {
        await emailjsSend(EMAILJS_SERVICE_ID, TEMPLATES.CODE, {
            email,
            to_email: email,
            passcode: code,
            verification_code: code,
        });
        console.log('2FA code email sent!');
        return true;
    } catch (err) {
        console.error('Failed to send 2FA email', err);
        return false;
    }
};

export const sendResetPasswordEmail = async (email: string, resetLink: string) => {
    try {
        await emailjsSend(EMAILJS_SERVICE_ID, TEMPLATES.RESET || TEMPLATES.CODE, {
            email,
            to_email: email,
            to_name: 'Utilisateur',
            message: `Suite à votre demande, voici votre lien pour configurer un nouveau mot de passe : ${resetLink}`,
        });
        console.log('Reset Password email sent!');
        return true;
    } catch (err) {
        console.error('Failed to send Reset Password email', err);
        return false;
    }
};

export const sendEmailChangeVerification = async (newEmail: string, code: string) => {
    try {
        await emailjsSend(EMAILJS_SERVICE_ID, TEMPLATES.CODE, {
            email: newEmail,
            to_email: newEmail,
            passcode: code,
            verification_code: code,
        });
        console.log('Email Change Verification sent!');
        return true;
    } catch (err) {
        console.error('Failed to send Email Change Verification', err);
        return false;
    }
};
