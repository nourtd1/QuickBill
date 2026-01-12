import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useOffline } from '../context/OfflineContext';
import { getPublicInvoiceUrl } from '../lib/env'; // We'll need to assume this helper exists or create it

interface Props {
    invoiceId: string;
    totalAmount: number;
    token?: string | null;
    currency?: string;
    size?: number;
    showLogo?: boolean;
}

const InvoiceQRCode: React.FC<Props> = ({
    invoiceId,
    totalAmount,
    token,
    currency = 'USD',
    size = 180,
    showLogo = true
}) => {
    const { isOffline } = useOffline();

    // 1. Determine QR Content (Logic of Fallback)
    const qrValue = useMemo(() => {
        // If online and token exists -> Web Portal Link
        // Note: In real app, check isOffline context too, but typically if we have a token 
        // it implies it was synced at some point. However, strict offline mode might prefer payload.
        // For now, if token is present, we prioritize the link as it's the "Smart" QuickBill feature.

        if (token) {
            // Construct public link
            // Hardcoding base URL for now or getting from ENV
            const baseUrl = 'https://quickbill.app/public/invoice';
            return `${baseUrl}/${token}`;
        }

        // Fallback: Payment Info String (Mobile Money format standard)
        // Format: "PAY|AMOUNT|CURRENCY|REF"
        return `PAY|${totalAmount}|${currency}|REF:${invoiceId.substring(0, 8).toUpperCase()}`;

    }, [token, invoiceId, totalAmount, currency]);

    return (
        <View style={styles.container}>
            <View style={styles.qrWrapper}>
                <QRCode
                    value={qrValue}
                    size={size}
                    color="black"
                    backgroundColor="white"
                    logo={showLogo ? require('../assets/adaptive-icon.png') : undefined} // Assuming a default logo exists
                    logoSize={size * 0.2}
                    logoBackgroundColor="white"
                    logoBorderRadius={size * 0.05}
                    quietZone={10}
                />
            </View>
            <Text style={styles.label}>
                {token ? 'Scannez pour voir la facture' : 'Scannez pour payer'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    qrWrapper: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        marginTop: 12,
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1
    }
});

export default InvoiceQRCode;
