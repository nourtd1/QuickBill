
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_2FA;

async function testEmailJS() {
    console.log('Testing EmailJS with:');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('Template ID:', EMAILJS_TEMPLATE_ID);

    if (!EMAILJS_SERVICE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_TEMPLATE_ID) {
        console.error('Missing EmailJS configuration in .env');
        return;
    }

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: {
                    to_email: 'test@example.com',
                    email: 'test@example.com',
                    passcode: '123456',
                    verification_code: '123456'
                }
            })
        });

        console.log('Response Status:', response.status);
        const data = await response.text();
        console.log('Response Data:', data);
    } catch (error: any) {
        console.error('Error sending email:', error.message);
    }
}

testEmailJS();
