import { useState, useEffect, useMemo, useRef, JSX, useCallback } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { DateTime } from "luxon";
import { useSelector, useDispatch } from "react-redux";
import { Check, CalendarDays, CreditCard, Store } from "lucide-react";
import { debounce } from "lodash";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import type { CountryCode } from "libphonenumber-js";
import { createAppointment } from "@/slices/appointmentSlice";
import { payCustomerDirect, finalizeInvoice } from "@/services";
import OrderSidebar from "@/components/sidebar/OrderSidebar";
import PaymentModal from "@/components/modals/PaymentModal";
import ConsentModal from "@/components/modals/ConsentModal";
import {
  isConsentRequiredService,
  getOnlineBookingRuleMethod,
  getConsentFrequency,
  checkConsentRequirement,
  submitFinalConsent,
} from "@/services";
import { getUserName, CurrencyIcon } from "@/utils";
import MainLayout from "@/components/common/MainLayout";
import Breadcrumb from "@/components/common/Breadcrumb";
import { nextStep } from "@/slices/breadcrumbSlice";
import { setAppointmentId, setTips } from "@/slices/appointmentSlice";
import { calculateServiceTax } from "@/utils";
import type { RootState, AppDispatch } from "@/store";
import {
  PaymentMeta,
  Service,
  OutletRootState,
  EnforcementType,
  ConsentCheckStatus,
  EnrichedService,
  Slot,
  PaymentPayload,
  ConfirmDateType,
  ConsentDraftEntry,
  ConsentDraftMap,
  CardType,
  CardData,
  ConsentModalPayload,
  SignatureType,
  AppointmentPayload,
  SubmitFinalConsentPayload,
  FormValues,
  FetchCustomerResponse,
} from "@/types";
import {
  setUserDetails,
  clearUserDetails,
  setPayType,
} from "@/slices/appointmentSlice";
import { fetchCustomer } from "@/services";
import { setSidebarOpen } from "@/slices/themeSlice";

const allowedCountries: CountryCode[] = [
  "IN",
  "US",
  "CA",
  "PH",
  "NZ",
  "AU",
  "CN",
] as const;
const MONTH_NAMES: string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CONSENT_DRAFT_KEY = "consentDraftByService";
const SLOT_INTERVAL = 15;

const expiryToNumber = (exp: string): number => {
  const [mm, yy] = exp.split("/");
  return Number(`${mm}${yy}`);
};

export default function ConfirmPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const {
    tenantId,
    id: outletId,
    timeZone,
    image,
    outletName,
    address,
  } = useSelector((state: OutletRootState) => state.booking.outletDetails);
  const { staff, selectedServices, selectedProfessional } = useSelector(
    (state: RootState) => state.booking.service,
  );
  const {
    selectedSlotIds,
    selectedDate,
    selectedTime,
    selectedSlotIndexes,
    slots,
  } = useSelector((state: RootState) => state.booking.slots);
  const { userDetails, bookingMode, tipPct, payType } = useSelector(
    (state: RootState) => state.booking.appointment,
  );
  const consentFlowLockRef = useRef<boolean>(false);
  const lastOpenedConsentServiceRef = useRef<string>("");
  const todayDate = DateTime.now().setZone(timeZone ?? "UTC");
  const services: any[] = Array.isArray(selectedServices)
    ? selectedServices
    : [selectedServices];
  const [loading, setLoading] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMeta, setPaymentMeta] = useState<PaymentMeta | null>(null);
  const [consentOpen, setConsentOpen] = useState<boolean>(false);
  const [consentHeading, setConsentHeading] = useState<string>("");
  const [consentText, setConsentText] = useState<string>("");
  const [consentEnforcement, setConsentEnforcement] =
    useState<EnforcementType | null>(null);
  const [pendingConsentServiceId, setPendingConsentServiceId] = useState<
    string | null
  >(null);
  const [consentAcceptedMap, setConsentAcceptedMap] = useState<
    Record<string, boolean>
  >({});
  const [consentCheckMap, setConsentCheckMap] = useState<
    Record<string, ConsentCheckStatus>
  >({});
  const [checkingConsent, setCheckingConsent] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [loadingField, setLoadingField] = useState<"phone" | "email" | null>(
    null,
  );
  const [isAutoFilled, setIsAutoFilled] = useState<boolean>(false);
  const lastQueryRef = useRef<string>("");

  const debouncedFetchRef = useRef<
    | (((params: { value: string; type: "phone" | "email" }) => void) & {
      cancel?: () => void;
    })
    | null
  >(null);

  const selectedStaffServices: EnrichedService[] = services.map((svc) => {
    const staffMember = staff?.find(
      (s: any) => s.id === selectedProfessional?.id,
    );
    const assignment = staffMember?.assignments?.find((a) => a.id === svc.id);
    const updatedSvc: Service = {
      ...svc,
      price: assignment?.price ?? svc.price ?? svc.min_price ?? 0,
      duration: assignment?.duration ?? svc.estimated_time ?? svc.min_time ?? 0,
    };
    return {
      ...updatedSvc,
      duration: assignment?.duration ?? svc.estimated_time ?? svc.min_time ?? 0,
      tax: calculateServiceTax(updatedSvc),
      unitTax: calculateServiceTax(updatedSvc, { perUnit: true }),
    };
  });

  const allSlots: Slot[] = [
    ...(slots?.morning ?? []),
    ...(slots?.afternoon ?? []),
    ...(slots?.evening ?? []),
  ];

  const totalDuration: number = selectedStaffServices.reduce(
    (sum, s) => sum + Number(s.duration ?? 0),
    0,
  );
  const requiredSlots: number = Math.ceil(totalDuration / SLOT_INTERVAL);
  const formatTimeRange = (startIndex: number): string => {
    if (!allSlots.length) return "";
    const start = allSlots[startIndex]?.start_time_12h;
    const endSlot = allSlots[startIndex + requiredSlots - 1];
    if (!start || !endSlot) return "";
    const end = endSlot.end_time_12h ?? endSlot.start_time_12h;
    return `${start} - ${end}`;
  };

  const safeDate: ConfirmDateType = {
    day: Number(selectedDate?.day ?? todayDate.day),
    month: Number(selectedDate?.month ?? todayDate.month),
    year: Number(selectedDate?.year ?? todayDate.year),
  };

  const selectedStartIndex: number | undefined = selectedSlotIndexes?.[0];
  const timeRange: string | null =
    selectedStartIndex !== undefined
      ? formatTimeRange(selectedStartIndex)
      : null;
  const dateStr: string | null = timeRange
    ? `${MONTH_NAMES[safeDate.month - 1]} ${safeDate.day} at ${timeRange}`
    : null;

  const totalBasePrice: number = selectedStaffServices.reduce(
    (sum, s) => sum + Number(s.price || s.min_price) * (s.qty ?? 1),
    0,
  );
  const taxAmt: number = selectedStaffServices.reduce(
    (sum, s) => sum + s.tax,
    0,
  );
  const taxCents: number = Math.round(taxAmt * 100);
  const tipAmt: number = (totalBasePrice * tipPct) / 100;
  const tipCents: number = Math.round(tipAmt * 100);
  const totalWithTax: number = totalBasePrice + tipAmt + taxAmt;

  const servicesNeedingConsent: Service[] = useMemo(() => {
    return services.filter((s) => {
      if (!isConsentRequiredService(s)) return false;
      const enforcementMode =
        s?.consent_rule?.enforcementMode ?? s?.enforcementMode;
      if (enforcementMode === "FIXED") return false;
      return true;
    });
  }, [services]);

  const consentServiceIds: string[] = useMemo(() => {
    return servicesNeedingConsent.map((s) => String(s.id)).filter(Boolean);
  }, [servicesNeedingConsent]);

  const pickTemplateFromService = (
    svc: Service,
  ): { heading: string; consent: string } => {
    const tpl = svc?.consent_template ?? svc?.consentTemplate ?? null;
    const heading = String(tpl?.heading ?? "").trim();
    const consent = String(tpl?.consent ?? "").trim();
    return { heading, consent };
  };

  const markConsentDone = (serviceId: string): void => {
    setConsentAcceptedMap((prev) => ({ ...prev, [String(serviceId)]: true }));
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    trigger,
    setValue,
    formState: { errors, isSubmitted, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (userDetails && servicesNeedingConsent?.length > 0) {
      runConsentChecks();
    }
  }, [userDetails, servicesNeedingConsent?.length]);

  const runConsentChecks = async (): Promise<void> => {
    const cid = userDetails?.id;
    if (!cid) return;
    setCheckingConsent(true);
    try {
      const nextMap: Record<string, ConsentCheckStatus> = {};
      for (const svc of servicesNeedingConsent) {
        const serviceId = String(svc.id);
        const formId = String(svc.consent_form_id ?? "");
        if (!serviceId || !formId) continue;
        const freq = getConsentFrequency(svc);
        const mustCheck =
          freq === "EVERY_X_DAYS" || freq === "ONCE_PER_CUSTOMER";
        if (!mustCheck) {
          nextMap[serviceId] = {
            data: { checked: true, needsSignature: true },
          };
          continue;
        }
        const res = await checkConsentRequirement(cid, formId, serviceId);
        const needsSignature = Boolean(res?.data?.needsSignature);
        nextMap[serviceId] = { data: { checked: true, needsSignature } };
        if (!needsSignature) markConsentDone(serviceId);
      }
      setConsentCheckMap(nextMap);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingConsent(false);
    }
  };

  const pendingConsentServices: Service[] = useMemo(() => {
    return servicesNeedingConsent.filter((svc) => {
      const sid = String(svc.id);
      if (consentAcceptedMap[sid]) return false;
      const chk = consentCheckMap[sid];
      if (chk?.data?.checked && chk?.data?.needsSignature === false)
        return false;
      return true;
    });
  }, [servicesNeedingConsent, consentAcceptedMap, consentCheckMap]);

  const totalConsentCount: number = consentServiceIds.length;
  const doneConsentCount: number =
    totalConsentCount - pendingConsentServices.length;
  const allConsentsDone: boolean = pendingConsentServices.length === 0;

  const startConsentSigning = async (): Promise<void> => {
    if (consentFlowLockRef.current) return;
    consentFlowLockRef.current = true;
    try {
      const svc = pendingConsentServices[0];
      if (!svc) {
        await proceedWithBooking();
        return;
      }
      const serviceId = String(svc.id);
      if (lastOpenedConsentServiceRef.current === serviceId && consentOpen)
        return;
      lastOpenedConsentServiceRef.current = serviceId;

      const formId = String(svc.consent_form_id ?? "");
      if (!formId) {
        toast.error("Consent form missing.");
        return;
      }
      const method: any = getOnlineBookingRuleMethod(svc);
      if (!method) {
        toast.error("Consent enforcement method not found.");
        return;
      }
      const cid = userDetails?.id;
      const needsCheck = getConsentFrequency(svc) !== "EVERY_VISIT";
      if (needsCheck && cid) {
        const res = await checkConsentRequirement(cid, formId, serviceId);
        const needsSignature = Boolean(res?.data?.needsSignature);
        setConsentCheckMap((prev) => ({
          ...prev,
          [serviceId]: { data: { checked: true, needsSignature } },
        }));
        if (!needsSignature) {
          markConsentDone(serviceId);
          toast.success("Consent already signed for this service.");
          setTimeout(() => startConsentSigning(), 250);
          return;
        }
      } else {
        setConsentCheckMap((prev) => ({
          ...prev,
          [serviceId]: { data: { checked: true, needsSignature: true } },
        }));
      }
      const { heading, consent } = pickTemplateFromService(svc);
      if (!heading || !consent) {
        toast.error("Consent template missing.");
        return;
      }
      setConsentHeading(heading);
      setConsentText(consent);
      setConsentEnforcement(method);
      setPendingConsentServiceId(serviceId);
      setConsentOpen(true);
    } catch (e) {
      console.error(e);
      toast.error((e as Error)?.message ?? "Consent check failed");
    } finally {
      consentFlowLockRef.current = false;
    }
  };

  const saveConsentDraft = (
    serviceId: string,
    data: ConsentDraftEntry,
  ): void => {
    try {
      const raw = localStorage.getItem(CONSENT_DRAFT_KEY);
      const obj: ConsentDraftMap = raw ? JSON.parse(raw) : {};
      obj[String(serviceId)] = data;
      localStorage.setItem(CONSENT_DRAFT_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error("Failed to save consent draft", e);
    }
  };

  const readConsentDraft = (): ConsentDraftMap => {
    try {
      return JSON.parse(
        localStorage.getItem(CONSENT_DRAFT_KEY) ?? "{}",
      ) as ConsentDraftMap;
    } catch {
      return {};
    }
  };

  const onConsentConfirm = (modalPayload: ConsentModalPayload): void => {
    const sid = String(pendingConsentServiceId);
    if (!sid) return;
    const svc = servicesNeedingConsent.find((x) => String(x.id) === sid);
    if (!svc) return;
    const formId = String(svc.consent_form_id ?? "");
    const enforcement = getOnlineBookingRuleMethod(svc);
    if (!formId || !enforcement) {
      toast.error("Consent form/method missing.");
      return;
    }
    let signatureType: SignatureType = "CHECKBOX_ONLY";
    if (enforcement === "TYPED_NAME") signatureType = "TYPED_NAME";
    else if (enforcement === "DRAW_SIGNATURE")
      signatureType = "SIGNATURE_IMAGE";
    saveConsentDraft(sid, {
      serviceId: sid,
      concentFormId: formId,
      signatureType,
      typedName: modalPayload?.typedName,
      isChecked: modalPayload?.accepted,
      signatureDataUrl: modalPayload?.signatureDataUrl,
      emailMe: modalPayload?.emailMe,
    });
    markConsentDone(sid);
    setConsentOpen(false);
    lastOpenedConsentServiceRef.current = "";
    toast.success("Consent captured.");
  };

  const onConsentClose = (): void => {
    setConsentOpen(false);
    setPendingConsentServiceId(null);
  };

  const submitAllConsents = async (
    appointmentId: string,
    customerId: string,
    staffId: string,
  ): Promise<void> => {
    const consentDraft = readConsentDraft();
    const entries = Object.entries(consentDraft)
      .map(([serviceId, cap]) => ({
        serviceId,
        concentFormId: cap.concentFormId,
        captured: cap,
      }))
      .filter((x) => x.serviceId && x.concentFormId);
    for (const item of entries) {
      const { serviceId, concentFormId, captured } = item;
      const signatureType: SignatureType =
        captured.signatureType ||
        (captured.typedName
          ? "TYPED_NAME"
          : captured.signatureDataUrl
            ? "SIGNATURE_IMAGE"
            : "CHECKBOX_ONLY");
      const submitPayload: SubmitFinalConsentPayload = {
        tenantId,
        outletId,
        appointmentId,
        customerId,
        serviceId,
        formId: concentFormId,
        staffId,
        signatureType,
        typedName: captured.typedName,
        imageUrl: captured.signatureDataUrl,
      };
      if (signatureType === "CHECKBOX_ONLY") {
        submitPayload.isChecked = captured.isChecked ?? true;
      }
      await submitFinalConsent(submitPayload);
    }
    localStorage.removeItem(CONSENT_DRAFT_KEY);
  };

  let formattedDate = "";
  if (selectedDate) {
    formattedDate = `${selectedDate?.year}-${String(selectedDate?.month).padStart(2, "0")}-${String(selectedDate?.day).padStart(2, "0")}`;
  }
  const payload: AppointmentPayload = {
    tenantId,
    outletId,
    staffId: selectedProfessional?.id,
    date: formattedDate,
    startTime: selectedTime,
    serviceIds: services.map((s) => s.id),
    slotIds: selectedSlotIds,
    isWalkIn: false,
    requiresConsent: servicesNeedingConsent.length > 0,
    customer: {
      first_name: userDetails?.firstName,
      last_name: userDetails?.lastName,
      email: userDetails?.email,
      phone: userDetails?.phone,
    },
  };

  const proceedWithBooking = async (): Promise<void> => {
    if (servicesNeedingConsent.length && !allConsentsDone) {
      toast.warn("Please complete all consent forms first");
      return;
    }
    try {
      setLoading(true);
      const result = await dispatch(createAppointment(payload)).unwrap();
      const data: any = result?.data ?? result;
      const appointmentId = data.id || "";
      const customerId = data.customerId || data.customer?.id || "";
      const staffId = data.staffId || selectedProfessional?.id || "";
      if (bookingMode === "booking" && doneConsentCount > 0) {
        await submitAllConsents(appointmentId, customerId, staffId);
      }
      if (payType === "card") {
        setPaymentMeta({ appointmentId, customerId });
        setShowPaymentModal(true);
      } else {
        dispatch(setAppointmentId(String(appointmentId)));
        dispatch(nextStep());
      }
    } catch (err: any) {
      const errorMessage =
        err?.payload?.message ||
        err?.data?.message ||
        err?.message ||
        "Staff not working on this day" ||
        "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data): Promise<void> => {
    const payload = {
      ...data,
      phone: data?.phone ?? "",
    };
    dispatch(setUserDetails(payload));
    if (!payType) {
      return void toast.error("Select payment method");
    }
    if (!selectedTime && bookingMode === "booking") {
      return void toast.error("Select time");
    }
    if (!payload?.firstName) {
      return void toast.error("Enter first name");
    }
    if (!payload?.email && !payload?.phone) {
      return void toast.error("Email or phone required");
    }

    if (servicesNeedingConsent.length > 0) {
      if (allConsentsDone) {
        await proceedWithBooking();
      } else {
        await startConsentSigning();
      }
    } else {
      await proceedWithBooking();
    }
  };

  const onFormSubmit: SubmitHandler<FormValues> = async (
    data,
  ): Promise<void> => {
    const payload = {
      ...data,
      phone: data?.phone ?? "",
    };
    dispatch(setUserDetails(payload));
    if (!payType) {
      return void toast.error("Select payment method");
    }
  };

  const getCardType = (number: string): CardType => {
    const num = number.replace(/\s/g, "");
    if (/^4/.test(num)) return "VISA";
    if (/^5[1-5]/.test(num)) return "MASTERCARD";
    if (/^3[47]/.test(num)) return "AMEX";
    if (/^6/.test(num)) return "DISCOVER";
    return "UNKNOWN";
  };

  const handlePayment = async (cardData: CardData): Promise<boolean> => {
    try {
      setLoading(true);
      const appointmentId = paymentMeta?.appointmentId;
      const customerId = String(paymentMeta?.customerId);
      if (!appointmentId || !outletId) {
        toast.error("Something went wrong.");
        return false;
      }
      const detectedCardType = getCardType(cardData.number);
      const paymentPayload: PaymentPayload = {
        appointmentId,
        customerId,
        outletId,
        referenceNo: appointmentId,
        currency: "USD",
        amountCents: Math.round(totalWithTax * 100),
        tipAmountCents: payType === "card" ? tipCents : 0,
        taxAmountCents: payType === "card" ? taxCents : 0,
        transactionBody: {
          transactionOrigin: 3,
          transactionCode: "WEB",
          isDebit: true,
          processMethod: 3,
          channelType: 3,
          tenderInfo: {
            cardHolderName: cardData.name,
            cardNumber: cardData.number.replace(/\s/g, ""),
            cardType: detectedCardType,
            cardExpiry: expiryToNumber(cardData.expiry),
            cvData: cardData.cvv,
          },
          billingContact: {
            name: {
              firstName: userDetails?.firstName ?? "",
              lastName: userDetails?.lastName ?? "",
            },
            email: userDetails?.email ?? "",
          },
        },
      };
      const resp = await payCustomerDirect(paymentPayload);
      const data = resp?.data?.data ?? resp?.data ?? resp ?? {};
      const orderId = data?.orderId;
      const isSuccess =
        String(data?.mappedStatus).toLowerCase() === "succeeded" ||
        String(data?.reasonMessage).toLowerCase() === "success";
      if (isSuccess) {
        toast.success("Payment successful!");
        if (orderId) {
          try {
            await finalizeInvoice(orderId);
          } catch (err) {
            toast.warning(
              err instanceof Error
                ? err.message
                : String(err ?? "Payment done, but finalize failed"),
            );
          }
        }
      } else {
        toast.warning("Payment pending");
      }
      setShowPaymentModal(false);
      dispatch(setAppointmentId(String(paymentMeta?.appointmentId)));
      dispatch(nextStep());
      return true;
    } catch (err) {
      toast.warning(
        err instanceof Error
          ? err.message
          : "Payment failed, but appointment is booked",
      );
      setShowPaymentModal(false);
      dispatch(setAppointmentId(String(paymentMeta?.appointmentId)));
      dispatch(nextStep());
      return true;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = (): void => {
    setShowPaymentModal(false);
    toast.warning("Appointment booked. Payment was cancelled.");
    dispatch(setAppointmentId(String(paymentMeta?.appointmentId)));
    dispatch(nextStep());
  };

  const fetchCustomerData = useCallback(
    async ({
      value,
      type,
    }: {
      value: string;
      type: "phone" | "email";
    }): Promise<void> => {
      if (!value) return;
      let searchKey = "";
      if (type === "phone") {
        if (!isValidPhoneNumber(value)) return;
        searchKey = normalizePhone(value);
      }
      if (type === "email") {
        if (!isValidEmail(value)) return;
        searchKey = value.trim();
      }
      if (!searchKey) return;
      if (lastQueryRef.current === searchKey && isAutoFilled) {
        return;
      }
      lastQueryRef.current = searchKey;
      setFormLoading(true);
      setLoadingField(type);
      try {
        const res: FetchCustomerResponse = await fetchCustomer({
          search: searchKey,
          tenantId,
        });
        const customer = res?.data?.[0];
        if (customer) {
          setValue("firstName", customer.first_name || "", {
            shouldValidate: true,
          });
          setValue("lastName", customer.last_name || "");
          if (customer.phone && isValidPhoneNumber(customer.phone)) {
            setValue("phone", customer.phone);
          }
          if (customer.email) {
            setValue("email", customer.email);
          }
          dispatch(
            setUserDetails({
              email: customer.email,
              firstName: customer.first_name,
              lastName: customer.last_name,
              phone: customer.phone,
            }),
          );
          setIsAutoFilled(true);
        } else {
          setIsAutoFilled(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFormLoading(false);
        setLoadingField(null);
      }
    },
    [dispatch, setValue, isAutoFilled],
  );

  const handleClearCustomer = (): void => {
    reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setIsAutoFilled(false);
    lastQueryRef.current = "";
    dispatch(clearUserDetails());
  };

  useEffect(() => {
    debouncedFetchRef.current = debounce(fetchCustomerData, 800);
    return () => {
      debouncedFetchRef.current?.cancel?.();
    };
  }, [fetchCustomerData]);

  const handleInputChange = (
    value: string,
    onChange: ((value: string) => void) | null,
    type: "phone" | "email",
  ): void => {
    if (onChange) {
      onChange(value);
    }
    if (!value) {
      debouncedFetchRef.current?.cancel?.();
      lastQueryRef.current = "";
      setIsAutoFilled(false);
      setLoadingField(null);
      return;
    }
    setLoadingField(type);
    debouncedFetchRef.current?.({ value, type });
  };

  const phoneValue = watch("phone");
  const emailValue = watch("email");

  useEffect(() => {
    reset(
      { ...userDetails, phone: userDetails?.phone || "" },
      { keepErrors: true, keepDirty: false },
    );
  }, [userDetails, reset]);

  useEffect(() => {
    if (isSubmitted) {
      trigger(["phone", "email"]);
    }
  }, [phoneValue, emailValue, isSubmitted, trigger]);

  const normalizePhone = (phone?: string): string =>
    phone?.replace(/\s+/g, "") || "";

  const isValidEmail = (email: string): boolean => /^\S+@\S+\.\S+$/.test(email);

  return (
    <MainLayout
      sidebar={
        <div className="aaravpos-aside">
          <OrderSidebar
            buttonText="Book Appointment"
            onButtonClick={handleSubmit(onSubmit)}
            showTip={payType === "card"}
            tipPct={tipPct}
            onTipChange={(data: unknown) =>
              dispatch(setTips((data as number) ?? 0))
            }
            consentRequired={servicesNeedingConsent?.length > 0}
            consentCompleted={doneConsentCount}
            totalConsents={totalConsentCount}
            checkingConsent={checkingConsent}
            loading={loading}
          // isBookingDisabled={isBookingDisabled()}
          />
        </div>
      }
    >
      <>
        <Breadcrumb />
        <div className="aaravpos-margin-top-20">
          <h1 className="aaravpos-page-title">Confirm Booking</h1>
          <p className="aaravpos-sub-title">
            Review your appointment details before booking
          </p>
          <div className="aaravpos-booking-wrapper">
            <div className="aaravpos-outlet-info">
              {image && (
                <div className="aaravpos-outlet-logo">
                  <img
                    src={image ?? "/logo.svg"}
                    alt="Logo"
                    className="aaravpos-outlet-logo-img"
                  />
                </div>
              )}
              <div className="aaravpos-outlet-content">
                <p className="aaravpos-outlet-name">{outletName ?? "-"}</p>
                <p className="aaravpos-outlet-address">
                  {address ?? "-"}
                  <br />
                </p>
              </div>
            </div>
            <div className="aaravpos-booking-scroll">
              <div className="aaravpos-booking-grid">
                <div className="aaravpos-booking-column">
                  <SectionLabel>Appointment</SectionLabel>
                  <Card>
                    <div className="aaravpos-appointment-header">
                      <Avatar pro={selectedProfessional} />
                      <div className="aaravpos-appointment-content">
                        <p className="aaravpos-appointment-name">
                          {selectedProfessional?.name}
                        </p>
                        <p className="aaravpos-appointment-services">
                          {services.map((s) => s.name).join(", ")}
                        </p>
                      </div>
                      <span className="aaravpos-appointment-price">
                        <CurrencyIcon size={14} />
                        {totalBasePrice}
                      </span>
                    </div>
                    <div className="aaravpos-appointment-date">
                      <CalendarDays size={18} />
                      <span className="aaravpos-appointment-date-text">
                        {dateStr ?? "No time selected"}
                      </span>
                    </div>
                  </Card>
                </div>
                <div className="aaravpos-booking-column">
                  <SectionLabel>Payment Method</SectionLabel>
                  <PayOption
                    icon={<Store size={18} />}
                    label="Pay in person"
                    selected={payType === "person"}
                    onClick={() => dispatch(setPayType("person"))}
                  />
                  <PayOption
                    icon={<CreditCard size={18} />}
                    label="Pay with card"
                    selected={payType === "card"}
                    onClick={() => dispatch(setPayType("card"))}
                  />
                </div>
              </div>
              {payType && (
                <form className="aaravpos-tp-10">
                  <div className="aaravpos-details-grid">
                    <div className="aaravpos-form-group">
                      <label className="aaravpos-form-label" htmlFor="phone">
                        Phone{" "}
                        {!emailValue && (
                          <span className="aaravpos-required">*</span>
                        )}
                      </label>
                      <Controller
                        control={control}
                        name="phone"
                        rules={{
                          validate: (value) => {
                            const hasPhone = !!normalizePhone(value);
                            const hasEmail = !!emailValue?.trim();
                            if (!hasPhone && !hasEmail) {
                              return "Enter phone or email";
                            }
                            if (hasPhone && !isValidPhoneNumber(value)) {
                              return "Enter valid phone number";
                            }
                            return true;
                          },
                        }}
                        render={({ field }) => (
                          <div className="aaravpos-input-wrapper">
                            <PhoneInput
                              {...field}
                              id="phone"
                              international
                              countries={allowedCountries}
                              defaultCountry="US"
                              value={field.value || ""}
                              onChange={(value) =>
                                handleInputChange(
                                  value ?? "",
                                  field.onChange,
                                  "phone",
                                )
                              }
                              countryCallingCodeEditable={false}
                              className="aaravpos-custom-input"
                            />

                            {formLoading && loadingField === "phone" && (
                              <div className="aaravpos-loader-wrapper">
                                <div className="aaravpos-loader" />
                              </div>
                            )}
                          </div>
                        )}
                      />
                      {errors.phone && (
                        <p className="aaravpos-error-text">
                          {errors.phone.message}
                        </p>
                      )}
                      {isAutoFilled && (
                        <div className="aaravpos-autofill-text">
                          Using existing customer{" "}
                          <span
                            onClick={handleClearCustomer}
                            className="aaravpos-clear-text"
                          >
                            Clear
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="aaravpos-form-group">
                      <label htmlFor="email" className="aaravpos-form-label">
                        Email{" "}
                        {!phoneValue && (
                          <span className="aaravpos-required">*</span>
                        )}
                      </label>
                      <input
                        id="email"
                        {...register("email", {
                          validate: (value) => {
                            const hasEmail = !!value?.trim();
                            const hasPhone = !!normalizePhone(phoneValue);
                            if (!hasEmail && !hasPhone) {
                              return "Enter phone or email";
                            }
                            if (hasEmail && !/^\S+@\S+\.\S+$/.test(value)) {
                              return "Invalid email";
                            }
                            return true;
                          },
                          onChange: (e) => {
                            handleInputChange(e.target.value, null, "email");
                          },
                        })}
                        autoComplete="email"
                        placeholder="Email address"
                        className="aaravpos-custom-input"
                      />
                      {errors.firstName && (
                        <p className="aaravpos-error-text">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="aaravpos-form-group">
                      <label
                        htmlFor="first_name"
                        className="aaravpos-form-label"
                      >
                        First Name <span className="aaravpos-required">*</span>
                      </label>
                      <input
                        id="first_name"
                        {...register("firstName", {
                          required: "First name required",
                          pattern: {
                            value: /^[A-Za-z\s]+$/,
                            message: "Only letters are allowed",
                          },
                        })}
                        autoComplete="given-name"
                        placeholder="First Name"
                        className="aaravpos-custom-input"
                      />
                      {errors.firstName && (
                        <p className="aaravpos-error-text">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="aaravpos-form-group">
                      <label
                        htmlFor="last_name"
                        className="aaravpos-form-label"
                      >
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        autoComplete="family-name"
                        {...register("lastName")}
                        placeholder="Last Name"
                        className="aaravpos-custom-input"
                      />
                    </div>
                  </div>
                  <div className="aaravpos-center-items">
                    <button
                      onClick={() => {
                        handleSubmit(onFormSubmit);
                        dispatch(setSidebarOpen(true));
                      }}
                      disabled={isSubmitting}
                      className="aaravpos-form-btn"
                    >
                      <span className="aaravpos-btn-content">
                        Confirm Details
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </>
      {showPaymentModal && (
        <PaymentModal
          onClose={handlePaymentCancel}
          onPay={handlePayment}
          amount={totalWithTax}
        />
      )}
      {consentOpen && pendingConsentServiceId && (
        <ConsentModal
          key={pendingConsentServiceId ?? "consent"}
          enforcement={consentEnforcement}
          heading={consentHeading}
          consent={consentText}
          onClose={onConsentClose}
          onConfirm={onConsentConfirm}
        />
      )}
    </MainLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
}

function Card({ children }: CardProps): JSX.Element {
  return <div className="aaravpos-card-box">{children}</div>;
}

function Avatar({ pro }: any): JSX.Element {
  return (
    <>
      {pro.imageUrl ? (
        <img
          src={pro.imageUrl}
          alt={pro.name}
          className="aaravpos-profile-image"
        />
      ) : (
        <div
          className="aaravpos-profile-avatar"
          style={{ background: pro.color ?? "#111" }}
        >
          {getUserName(pro.name)}
        </div>
      )}
    </>
  );
}

interface SectionLabelProps {
  children: React.ReactNode;
}

function SectionLabel({ children }: SectionLabelProps): JSX.Element {
  return <p className="aaravpos-section-label">{children}</p>;
}

interface PayOptionProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PayOption({
  icon,
  label,
  selected,
  onClick,
}: PayOptionProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={`aaravpos-select-card ${selected ? "aaravpos-select-card-active" : "aaravpos-select-card-default"}`}
    >
      <div className="aaravpos-center-items">{icon}</div>
      {label}{" "}
      <span className="aaravpos-select-check">
        {selected && <Check size={18} />}
      </span>
    </div>
  );
}
