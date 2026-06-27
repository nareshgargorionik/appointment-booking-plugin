import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import { SocketProvider } from "@/context/SocketContext";

type Props = {
    children: React.ReactNode;
};

export function BookingPluginProvider({ children }: Props) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <SocketProvider>
                    {children}
                </SocketProvider>
            </PersistGate>
        </Provider>
    );
}