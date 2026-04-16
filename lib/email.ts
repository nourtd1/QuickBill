import emailjs from '@emailjs/browser';

// Constants for EmailJS - Using Expo environment variables
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '';

// Template IDs
const TEMPLATES = {
    WELCOME: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_WELCOME || '', // Pour bienvenue
    CODE: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_2FA || '', // Pour OTP / Récupération
    RESET: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_RESET_PW || '', // Spécifique Reset si dispo
};

// Only init if we have keys
if (EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
} else {
    if (__DEV__) console.warn("⚠️ EmailJS n'est pas configuré. Ajoutez vos clés dans .env");
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
            TEMPLATES.WELCOME, // Using the Welcome template
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
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !TEMPLATES.CODE) {
        console.error('❌ EmailJS is not configured. Missing environment variables.');
        return false;
    }

    try {
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            TEMPLATES.CODE, // Using the Code template
            { 
                email: email, 
                to_email: email, 
                passcode: code, // Matches EmailJS default template
                verification_code: code // Kept for backward compatibility
            }
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
            TEMPLATES.RESET || TEMPLATES.CODE, // Using Reset template or falling back to Code
            { email: email, to_email: email, to_name: 'Utilisateur', message: `Suite à votre demande, voici votre lien pour configurer un nouveau mot de passe : ${resetLink}` }
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
            { 
                email: newEmail, 
                to_email: newEmail, 
                passcode: code, 
                verification_code: code 
            }
        );
        console.log('Email Change Verification sent!', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send Email Change Verification', err);
        return false;
    }
};
