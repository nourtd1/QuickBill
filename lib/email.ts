import emailjs from '@emailjs/browser';

// Constants for EmailJS - Using Expo environment variables
// Create a .env file at the root of your project and add these keys
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'service_placeholder';
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || 'public_key_placeholder';

// Template IDs (Reduced to 2 to bypass free tier limits)
// We will reuse these 2 templates for all 4 functions!
const TEMPLATES = {
    NOTIF: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_WELCOME || 'template_welcome', // Will be used for Welcome & Reset
    CODE: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_2FA || 'template_2fa', // Will be used for 2FA & Email Change
};

// Only init if we have a real key (not the placeholder)
if (EMAILJS_PUBLIC_KEY !== 'public_key_placeholder') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
} else {
    console.warn("⚠️ EmailJS n'est pas configuré. Veuillez ajouter vos clés dans le fichier .env");
}

interface EmailParams {
    to_email: string;
    to_name?: string;
    [key: string]: any;
}

export const sendWelcomeEmail = async (email: string, name: string) => {
    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.NOTIF, // Using the Notif template
            { email: email, to_email: email, to_name: name, message: 'Bienvenue sur QuickBill ! Votre espace Premium est prêt. Commencez à facturer comme un pro.' }
        );
        console.log('Welcome email sent!', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send welcome email', err);
        return false;
    }
};

export const send2FACode = async (email: string, code: string) => {
    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.CODE, // Using the Code template
            { email: email, to_email: email, verification_code: code }
        );
        console.log('2FA code email sent!', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send 2FA email', err);
        return false;
    }
};

export const sendResetPasswordEmail = async (email: string, resetLink: string) => {
    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.NOTIF, // Reusing the Notif template
            { email: email, to_email: email, to_name: 'Utilisateur', message: `Suite à votre demande, voici votre lien pour configurer un nouveau mot de passe : \${resetLink}` }
        );
        console.log('Reset Password email sent!', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send Reset Password email', err);
        return false;
    }
};

export const sendEmailChangeVerification = async (newEmail: string, code: string) => {
    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.CODE, // Reusing the Code template
            { email: newEmail, to_email: newEmail, verification_code: code }
        );
        console.log('Email Change Verification sent!', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send Email Change Verification', err);
        return false;
    }
};
