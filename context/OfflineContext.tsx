import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { initDatabase } from '../lib/database';
import { saveInvoiceLocally, updateInvoiceLocally, getAllInvoicesLocal } from '../lib/localServices';

interface OfflineContextType {
    isOffline: boolean;
    saveInvoice: typeof saveInvoiceLocally;
    updateInvoice: typeof updateInvoiceLocally;
    getInvoices: typeof getAllInvoicesLocal;
}

const OfflineContext = createContext<OfflineContextType>({
    isOffline: false,
    saveInvoice: async () => '',
    updateInvoice: async () => { },
    getInvoices: async () => [],
});

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // 1. Initialize Database on App Mount
        const setup = async () => {
            try {
                await initDatabase();
                console.log('Offline Database Ready');
            } catch (e) {
                console.error('Failed to init offline database', e);
            }
        };
        setup();

        // 2. Listen to Network Status
        const unsubscribe = NetInfo.addEventListener(state => {
            // If isConnected is false, we are definitely offline. 
            // If null, it's undetermined, usually consider online or wait.
            const offline = state.isConnected === false;
            setIsOffline(offline);
        });

        return () => unsubscribe();
    }, []);

    return (
        <OfflineContext.Provider value={{
            isOffline,
            saveInvoice: saveInvoiceLocally,
            updateInvoice: updateInvoiceLocally,
            getInvoices: getAllInvoicesLocal
        }}>
            {children}
        </OfflineContext.Provider>
    );
};

export const useOffline = () => useContext(OfflineContext);
