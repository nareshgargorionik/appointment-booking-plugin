import React from "react";
import { BookingPluginProvider } from "@/providers/BookingPluginProvider";
import { BookingPluginContainer } from "./BookingPluginContainer";
import { AppointmentBookingPluginProps, } from "@/types";

export const AppointmentBookingPlugin: React.FC<AppointmentBookingPluginProps> = ({
    ...props
}) => {
    return (
        <BookingPluginProvider>
            <BookingPluginContainer {...props} />
        </BookingPluginProvider>
    );
};