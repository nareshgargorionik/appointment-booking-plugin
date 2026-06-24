import { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { RotateCw, Check, X } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { ConsentPayload, ConsentModalProps, ConsentFormData } from "@/types";


const ConsentModal = ({
    onClose,
    onConfirm,
    enforcement,
    heading,
    consent,
}: ConsentModalProps) => {
    const sigCanvasRef = useRef<SignatureCanvas | null>(null);
    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ConsentFormData>({
        defaultValues: {
            accepted: false,
            typedName: "",
            signatureDataUrl: "",
            emailMe: false,
        },
        mode: "onChange",
    });

    const accepted = watch("accepted");
    const typedName = watch("typedName");
    const signatureDataUrl = watch("signatureDataUrl");

    const resetForm = () => {
        reset();
        if (enforcement === "DRAW_SIGNATURE") {
            sigCanvasRef.current?.clear();
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleClearSignature = () => {
        sigCanvasRef.current?.clear();
        setValue("signatureDataUrl", "");
    };

    const onSubmit = (data: ConsentFormData) => {
        let finalSignatureDataUrl = "";
        if (enforcement === "DRAW_SIGNATURE") {
            const canvas = sigCanvasRef.current;
            if (canvas && !canvas.isEmpty()) {
                finalSignatureDataUrl = canvas
                    .getCanvas()
                    .toDataURL("image/png");
            } else {
                return;
            }
        }

        const payload: ConsentPayload = {
            accepted: enforcement === "CHECKBOX_ONLY"
                ? data.accepted
                : false,
            typedName: enforcement === "TYPED_NAME"
                ? data.typedName.trim()
                : "",
            signatureDataUrl: finalSignatureDataUrl,
            emailMe: data.emailMe,
        };

        onConfirm(payload);
        resetForm();
        onClose();
    };

    const canSubmit = !isSubmitting && (enforcement === "CHECKBOX_ONLY" ? accepted
        : enforcement === "TYPED_NAME" ? typedName?.trim().length > 2
            : enforcement === "DRAW_SIGNATURE" ? !!signatureDataUrl : false);

    return (
        <div className="aaravpos-consent-overlay">
            <div className="aaravpos-consent-backdrop" />
            <div className="aaravpos-consent-modal">
                {/* Header */}
                <div className="aaravpos-consent-header">
                    <h3 className="aaravpos-consent-title">
                        {heading || "Consent Form"}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="aaravpos-consent-close-btn"
                    >
                        <X />
                    </button>
                </div>
                <div className="aaravpos-consent-content-wrapper">
                    <div className="aaravpos-consent-content-box">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: consent,
                            }}
                            className="aaravpos-consent-content"
                        />
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {enforcement === "CHECKBOX_ONLY" && (
                        <label className="aaravpos-consent-checkbox-label" htmlFor="accepted">
                            <input
                                type="checkbox"
                                {...register("accepted", {
                                    required:
                                        "You must accept terms",
                                })}
                                id="accepted"
                                className="aaravpos-consent-checkbox"
                            />
                            <span className="aaravpos-consent-checkbox-text">
                                I have read and agree to the terms above
                            </span>
                        </label>
                    )}
                    {enforcement === "TYPED_NAME" && (
                        <div className="aaravpos-consent-typed-wrapper">
                            <label className="aaravpos-consent-input-label" htmlFor="typedName">
                                Full Name
                                <span className="aaravpos-consent-required">
                                    *
                                </span>
                            </label>
                            <input
                                {...register("typedName", {
                                    required:
                                        "Name is required",
                                    validate: (v) =>
                                        v.trim().length > 2 ||
                                        "Enter full name",
                                })}
                                id="typedName"
                                placeholder="Type your full name"
                                className={`aaravpos-consent-input ${errors.typedName
                                    ? "aaravpos-consent-input-error"
                                    : "aaravpos-consent-input-normal"
                                    }`}
                            />
                            <p className="aaravpos-consent-helper-text">
                                By typing your name, you agree to the consent above
                            </p>
                            {errors.typedName && (
                                <p className="aaravpos-consent-error">
                                    {errors.typedName.message}
                                </p>
                            )}
                        </div>
                    )}
                    {enforcement === "DRAW_SIGNATURE" && (
                        <Controller
                            control={control}
                            name="signatureDataUrl"
                            rules={{
                                validate: () =>
                                    sigCanvasRef.current &&
                                        !sigCanvasRef.current.isEmpty()
                                        ? true
                                        : "Signature required",
                            }}
                            render={({ field }) => (
                                <div className="aaravpos-consent-signature-wrapper">
                                    <SignatureCanvas
                                        ref={sigCanvasRef}
                                        canvasProps={{
                                            className:
                                                "aaravpos-consent-signature-canvas",
                                        }}
                                        onEnd={() => {
                                            const canvas =
                                                sigCanvasRef.current;

                                            if (!canvas) return;

                                            const dataUrl =
                                                canvas
                                                    .getCanvas()
                                                    .toDataURL(
                                                        "image/png"
                                                    );

                                            field.onChange(dataUrl);
                                        }}
                                    />
                                    {errors.signatureDataUrl && (
                                        <p className="aaravpos-consent-error aaravpos-consent-error-signature">
                                            {errors.signatureDataUrl.message}
                                        </p>
                                    )}
                                    <div className="aaravpos-consent-signature-actions">
                                        <button
                                            type="button"
                                            onClick={
                                                handleClearSignature
                                            }
                                            className="aaravpos-consent-clear-btn"
                                        >
                                            <RotateCw size={14} />
                                            Clear
                                        </button>
                                        <label
                                            className="aaravpos-consent-email-label"
                                            htmlFor="emailme"
                                        >
                                            <input
                                                type="checkbox"
                                                {...register(
                                                    "emailMe"
                                                )}
                                                id="emailme"
                                                className="aaravpos-consent-email-checkbox"
                                            />
                                            <span className="aaravpos-consent-email-text">
                                                Email me
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        />
                    )}
                    <div className="aaravpos-consent-footer">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="aaravpos-consent-cancel-btn"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`aaravpos-consent-submit-btn ${!canSubmit
                                ? "aaravpos-consent-submit-disabled"
                                : "aaravpos-consent-submit-active"
                                }`}
                        >
                            <Check />
                            {enforcement ===
                                "DRAW_SIGNATURE" ||
                                enforcement === "TYPED_NAME"
                                ? "Sign & Continue"
                                : "I Agree"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConsentModal;