import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DateTime } from "luxon";
import { AppointmentBookingPluginProps, Outlet, OutletRootState, } from "@/types";
import { fetchAllCategoriesAndStaffService } from "@/services";
import { setOutletData, setOutletToken } from "@/slices/outletSlice";
import { setOutletList } from "@/slices/outletListSlice";
import { setServicePayload } from "@/slices/serviceSlice";
import { setTheme } from "@/slices/themeSlice";
import { setIsOrder, goToStep } from "@/slices/breadcrumbSlice";
import { applyTheme } from "@/utils/applyTheme";
import ChooseYourOutlet from "@/components/common/ChooseYourOutlet";
import DefaultAppointment from "@/components/steps";
import type { AppDispatch } from "@/store";

export const BookingPluginContainer: React.FC<AppointmentBookingPluginProps> = ({ bookingCode }) => {
    const dispatch = useDispatch<AppDispatch>();
    const outlets = useSelector((state: any) => state.booking.outletList.outlets);
    const theme = useSelector((state: any) => state.booking.theme);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { id: outletId } = useSelector(
        (state: OutletRootState) => state.booking.outletDetails
    );

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchAllCategoriesAndStaffService(bookingCode);
            if (response?.success) {
                const outletList = response?.data?.data?.outlets || [];
                dispatch(setOutletList(outletList));
                dispatch(setTheme(response?.data?.result));
                if (outletList.length === 1) {
                    handleOutletSelection(outletList[0]);
                }
            } else {
                setError(response?.message || "Failed to fetch data");
            }
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [bookingCode, dispatch]);

    const fetchOutletData = async (tenantId?: string, outletId?: string) => {
        try {
            const response = await fetchAllCategoriesAndStaffService(bookingCode, tenantId, outletId);
            if (!response?.success) {
                setError(response?.message || "Failed to fetch outlet data");
            }
            dispatch(setOutletToken(response?.data?.token));
            dispatch(setIsOrder(response?.data?.data?.outlets[0]?.isService))
            dispatch(setServicePayload({ superCategories: response?.data?.data?.superCategories, staff: response?.data?.data?.staff }));
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleOutletSelection = async (data: Outlet) => {
        if (!data) return;
        await fetchOutletData(String(data?.tenantId), String(data?.id));
        const updatedOutlet = {
            ...data,
            tenantId: data.tenantId ?? "",
            currency: data.currency ?? "",
            outletTimeZoneDate: DateTime.now()
                .setZone(data?.timeZone)
                .toFormat("yyyy-MM-dd"),
            outletTimeZoneYear: DateTime.fromISO(
                data?.createdAt,
                { zone: "utc" }
            ).setZone(data?.timeZone).year,
        };
        dispatch(setOutletData(updatedOutlet));
        dispatch(goToStep(data?.isService ? "services" : "professionals"));
    };

    useEffect(() => {
        if (Array.isArray(outlets) && outlets.length === 0) {
            fetchInitialData();
        }
    }, [outlets?.length, fetchInitialData]);

    useEffect(() => {
        if (theme) {
            applyTheme(theme);
        }
    }, [theme]);


    if (error) {
        return (<div className="aaravpos-error-box">{error}</div>);
    }
    if (!outlets.length && loading) {
        return (
            <div className="aaravpos-loader-wrapper">
                <div className="aaravpos-loader" />
            </div>
        );
    }
    return (
        <div className="aaravpos-overflow-hidden">
            {outlets.length > 1 && !outletId ? (
                <ChooseYourOutlet
                    outlets={outlets}
                    onSelectOutlet={(data: Outlet) => {
                        if (!data?.id) return;
                        handleOutletSelection(data)
                    }}
                />
            ) : (
                <DefaultAppointment />
            )}
        </div>
    );
};