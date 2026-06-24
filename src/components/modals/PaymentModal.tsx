import { useSelector } from "react-redux";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { DateTime } from "luxon";
import { CurrencyIcon } from "@/utils";
import { OutletRootState, } from "@/types";

type PaymentFormValues = {
    name: string;
    number: string;
    expiry: string;
    cvv: string;
};

type PaymentPayload = PaymentFormValues;

type PaymentModalProps = {
    onClose: () => void;
    onPay: (payload: PaymentPayload) => Promise<boolean>;
    amount?: number;
};

export const formatCardNumber = (value: string): string => {
    return value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(.{4})/g, "$1 ")
        .trim();
};

export const formatExpiry = (value: string): string => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);

    if (cleaned.length >= 3) {
        return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }

    return cleaned;
};

export const formatCVV = (value: string): string => {
    return value.replace(/\D/g, "").slice(0, 3);
};

export default function PaymentModal({
    onClose,
    onPay,
    amount,
}: PaymentModalProps) {
    const { timeZone } = useSelector(
        (state: OutletRootState) => state.booking?.outletDetails
    );

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PaymentFormValues>({
        defaultValues: {
            name: "",
            number: "",
            expiry: "",
            cvv: "",
        },
    });

    const onSubmit: SubmitHandler<PaymentFormValues> = async (data) => {
        const normalized: PaymentPayload = {
            name: data.name.trim(),
            number: data.number.trim(),
            expiry: data.expiry,
            cvv: data.cvv,
        };
        const success = await onPay({
            ...normalized,
        });
        if (success) onClose();
    };

    return (
        <div className="aaravpos-payment-overlay">
            <form onSubmit={handleSubmit(onSubmit)} className="aaravpos-payment-form">
                <div className="aaravpos-modal">
                    <div className="aaravpos-payment-header">
                        <h2 className="aaravpos-payment-title">Make a payment</h2>
                        <span className="aaravpos-payment-amount"><CurrencyIcon size={14} />{amount?.toFixed(2)}</span>
                    </div>
                    <div className="aaravpos-payment-fields">
                        <div className="aaravpos-form-control">
                            <label htmlFor="name" className="aaravpos-payment-label">
                                Card Holder Name <span className="aaravpos-payment-required">*</span>
                            </label>
                            <Controller
                                name="name"
                                control={control}
                                rules={{
                                    required: "Name required",
                                    pattern: {
                                        value: /^[A-Za-z ]+$/,
                                        message: "Only letters allowed",
                                    },
                                }}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="name"
                                        autoComplete="cc-name"
                                        placeholder="Card Holder Name"
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.replace(
                                                    /[^A-Za-z ]/g,
                                                    ""
                                                );

                                            field.onChange(value);
                                        }}
                                        className="aaravpos-custom-input"
                                    />
                                )}
                            />
                            {errors.name && (
                                <p className="aaravpos-payment-error">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="aaravpos-form-control">
                            <label htmlFor="number" className="aaravpos-payment-label">
                                Card Number <span className="aaravpos-payment-required">*</span>
                            </label>
                            <Controller
                                name="number"
                                control={control}
                                rules={{
                                    required: "Card number required",
                                    validate: (value) =>
                                        value.replace(/\s/g, "")
                                            .length === 16 ||
                                        "Must be 16 digits",
                                }}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id="number"
                                        placeholder="4242 4242 4242 4242"
                                        onChange={(e) => {
                                            field.onChange(
                                                formatCardNumber(
                                                    e.target.value
                                                )
                                            );
                                        }}
                                        className="aaravpos-custom-input"
                                    />
                                )}
                            />
                            {errors.number && (
                                <p className="aaravpos-payment-error">
                                    {errors.number.message}
                                </p>
                            )}
                        </div>
                        <div className="aaravpos-payment-grid">
                            <div className="aaravpos-form-control">
                                <label htmlFor="expiry" className="aaravpos-payment-label">
                                    Expiry Date <span className="aaravpos-payment-required">*</span>
                                </label>
                                <Controller
                                    name="expiry"
                                    control={control}
                                    rules={{
                                        required: "Expiry required",
                                        validate: (value) => {
                                            if (!/^\d{2}\/\d{2}$/.test(value)) {
                                                return "Invalid format";
                                            }
                                            const [month, year] = value.split("/").map(Number);
                                            if (month < 1 || month > 12) {
                                                return "Invalid month";
                                            }
                                            const dt = DateTime.now().setZone(timeZone);
                                            const currentYear = dt.year % 100;
                                            const currentMonth = dt.month;
                                            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                                                return "Card expired";
                                            }
                                            return true;
                                        },
                                    }}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="expiry"
                                            placeholder="MM/YY"
                                            onChange={(e) => {
                                                field.onChange(
                                                    formatExpiry(
                                                        e.target.value
                                                    )
                                                );
                                            }}
                                            className="aaravpos-custom-input"
                                        />
                                    )}
                                />
                                {errors.expiry && (
                                    <p className="aaravpos-payment-error">
                                        {errors.expiry.message}
                                    </p>
                                )}
                            </div>
                            <div className="aaravpos-form-control">
                                <label htmlFor="cvv" className="aaravpos-payment-label">
                                    CVV <span className="aaravpos-payment-required">*</span>
                                </label>
                                <Controller
                                    name="cvv"
                                    control={control}
                                    rules={{
                                        required: "CVV required",
                                        minLength: {
                                            value: 3,
                                            message:
                                                "3 digits required",
                                        },
                                    }}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="cvv"
                                            placeholder="CVV"
                                            onChange={(e) => {
                                                field.onChange(
                                                    formatCVV(
                                                        e.target.value
                                                    )
                                                );
                                            }}
                                            className="aaravpos-custom-input"
                                        />
                                    )}
                                />
                                {errors.cvv && (
                                    <p className="aaravpos-payment-error">
                                        {errors.cvv.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="aaravpos-payment-btn-grid">
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                            className="aaravpos-payment-cancel-btn"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="aaravpos-payment-submit-btn"
                        >
                            {isSubmitting
                                ? "Processing..."
                                : "Proceed"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}