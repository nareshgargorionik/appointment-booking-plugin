import { JSX, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MoveLeft, Check, ChevronDown, Plus } from "lucide-react";
import { getAppointmentDetail } from "@/services";
import { persistor } from "@/store";
import { CurrencyIcon } from "@/utils";
import type { RootState } from "@/store";
import { AppointmentDetails } from "@/types";

// -------------------- Component --------------------
export default function SuccessPage(): JSX.Element {
    const dispatch = useDispatch();

    const appointmentId = useSelector(
        (state: RootState) => state.booking.appointment.appointmentId,
    );
    const { tenantId } = useSelector((state: RootState) => state.booking.outletDetails)

    const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllServices, setShowAllServices] = useState<boolean>(false);
    console.log("appointment", appointment)
    useEffect(() => {
        if (!appointmentId) {
            setError("No appointment ID provided");
            setLoading(false);
            return;
        }

        const fetchAppointment = async (): Promise<void> => {
            try {
                const response = await getAppointmentDetail(appointmentId, tenantId);

                if (response.success) {
                    setAppointment(response?.data?.appointment as AppointmentDetails);
                } else {
                    setError("Failed to load appointment details");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching appointment details");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [appointmentId]);

    const handleBookAnother = (): void => {
        persistor.purge();
        dispatch({ type: "RESET_ALL" });
    };

    if (loading) {
        return (
            <div className="aaravpos-loading-container">
                <p className="aaravpos-loading-text">Loading appointment details...</p>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="aaravpos-error-container">
                <p className="aaravpos-error-text">
                    {error || "Appointment not found"}
                </p>
                <button
                    onClick={handleBookAnother}
                    className="aaravpos-book-btn"  >
                    <MoveLeft />
                    Book Another Appointment
                </button>
            </div>
        );
    }

    const { staff, outlet, services } = appointment;

    const totalBasePrice: number = services?.reduce(
        (acc: number, s: any) => acc + Number(s.price || s.min_price || 0),
        0,
    );

    const tipAmt: number = (appointment.tipsCents || 0) / 100;
    const taxAmt = (appointment.taxCents || 0) / 100;
    const totalAmt = (appointment.totalCents || 0) / 100;
    console.log("taxAmt", taxAmt)

    const totalWithTax =
        totalAmt > 0
            ? totalAmt.toFixed(2)
            : (totalBasePrice + tipAmt + taxAmt).toFixed(2);

    const visibleServices = showAllServices
        ? services
        : services.slice(0, 5);

    const remainingCount = services.length - 5;

    return (
        <div className="aaravpos-success-wrapper">
            <div className="aaravpos-success-motion">
                <div className="aaravpos-success-icon success-pulse">
                    <Check />
                </div>
                <h1 className="aaravpos-success-title">
                    You're Booked!
                </h1>
                <p className="aaravpos-success-description">
                    Your appointment has been confirmed.
                    <br />
                    A confirmation has been sent to your email.
                </p>
                <div className="aaravpos-success-content">
                    <div className="aaravpos-success-card">
                        <div className="aaravpos-success-row aaravpos-success-row-first">
                            <span className="aaravpos-label">
                                Outlet Name
                            </span>
                            <span className="aaravpos-value">
                                {outlet?.outletName || "-"}
                            </span>
                        </div>
                        <div className="aaravpos-success-row">
                            <span className="aaravpos-label">
                                Professional
                            </span>
                            <span className="aaravpos-value">
                                {staff
                                    ? `${staff?.firstName} ${staff?.lastName}`
                                    : "-"}
                            </span>
                        </div>
                        <div className="aaravpos-success-row aaravpos-services-header">
                            <span className="aaravpos-services-label">
                                Services ({services.length})
                            </span>
                            {services.length > 5 && (
                                <button
                                    onClick={() =>
                                        setShowAllServices((prev) => !prev)
                                    }
                                    className="aaravpos-show-btn"
                                >
                                    {showAllServices ? (
                                        "Hide"
                                    ) : (
                                        <span className="aaravpos-show-btn-inner">
                                            Show
                                            <ChevronDown size={16} />
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="aaravpos-services-list">
                            {visibleServices?.map((s) => (
                                <div
                                    key={s.id}
                                    className="aaravpos-service-row"
                                >
                                    <span className="aaravpos-service-name">
                                        {s.serviceName}
                                    </span>

                                    <span className="aaravpos-price">
                                        <CurrencyIcon size={14} />
                                        {Number(s.price).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            {!showAllServices && remainingCount > 0 && (
                                <div className="aaravpos-more-services">
                                    <Plus size={14} />
                                    {remainingCount} more services
                                </div>
                            )}
                        </div>
                        <div className="aaravpos-success-row">
                            <span className="aaravpos-label">
                                Date & Time
                            </span>

                            <span className="aaravpos-value">
                                {appointment.appointmentDate} at{" "}
                                {appointment.start_time_12h}
                            </span>
                        </div>
                        <div className="aaravpos-success-row">
                            <span className="aaravpos-label">
                                Tip
                            </span>

                            <span className="aaravpos-price">
                                <CurrencyIcon size={14} />
                                {tipAmt.toFixed(2)}
                            </span>
                        </div>
                        <div className="aaravpos-success-row">
                            <span className="aaravpos-label">
                                Tax
                            </span>

                            <span className="aaravpos-price">
                                <CurrencyIcon size={14} />
                                {taxAmt.toFixed(2)}
                            </span>
                        </div>
                        <div className="aaravpos-total-row">
                            <span className="aaravpos-label">
                                Total Amount
                            </span>

                            <span className="aaravpos-total-price">
                                <CurrencyIcon size={14} />
                                {totalWithTax}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleBookAnother}
                        className="aaravpos-book-btn"
                    >
                        <MoveLeft />
                        Book Another Appointment
                    </button>
                </div>
            </div>
        </div>
    );
}