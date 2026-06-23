import { DateObjectUnits } from "luxon";
import { ComponentType, ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────
 * COMMON TYPES
 * ───────────────────────────────────────────────────────────── */
export interface StepItem {
  label: ReactNode;
  page: string;
  icon?: ReactNode;
}
export type StepKey =
  | "services"
  | "professionals"
  | "time"
  // | "details"
  | "confirm"
  | "success";

export type Step =
  | "services"
  | "professionals"
  | "time"
  // | "details"
  | "confirm"
  | "success";

export interface BreadcrumbState {
  currentStep: Step;
  completedSteps: string[];
  isOrder: boolean;
}

export type PageMap = Record<StepKey, ComponentType>;

export type BookingMode = "booking";

export type PayType = "person" | "card";

export type CardType = "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER" | "UNKNOWN";

export type SignatureType =
  | "CHECKBOX_ONLY"
  | "SIGNATURE_IMAGE"
  | "DRAW_SIGNATURE"
  | "TYPED_NAME";

export interface StaffMember {
  id: string;
  name: string;
  firstname?: string;
  lastname?: string;
  imageUrl?: string;
  color?: string;
}

export interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
/* ─────────────────────────────────────────────────────────────
 * THEME
 * ───────────────────────────────────────────────────────────── */

export interface ThemeSettings {
  button: {
    bg: string;
    text: string;
    bgHover: string;
    textHover: string;
  };
  colors: {
    bg: string;
    link: string;
    text: string;
    bgHover: string;
    textHover: string;
  };
  isOpenSidebar: boolean
}

/* ─────────────────────────────────────────────────────────────
 * LAYOUT
 * ───────────────────────────────────────────────────────────── */

export interface MainLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  renderButton?: ReactNode;
}

/* ─────────────────────────────────────────────────────────────
 * OUTLET
 * ───────────────────────────────────────────────────────────── */

export interface Outlet {
  id: string;
  outletName: string;
  timeZone: string;
  image: string;
  tenantId: string;
  address: string;
  outletTimeZoneDate: string;
  outletTimeZoneYear: number;
  createdAt: string;
  currency: string;
  isService: boolean;
  currencyName: string | null;
  currencySymbol: string | null;
  isOpen: boolean;
  token: string;
}

/* ─────────────────────────────────────────────────────────────
 * TAX
 * ───────────────────────────────────────────────────────────── */

export interface TaxRow {
  isActive: boolean;
}

/* ─────────────────────────────────────────────────────────────
 * SERVICE
 * ───────────────────────────────────────────────────────────── */
export interface ServiceState {
  // standaloneCategories: Category[];
  superCategories: Category[];
  staff: Staff[]; // or StaffMember[] but be consistent
  selectedCategory: Category | null;
  selectedServices: ServiceItem[];
  selectedProfessional: Staff | null;
}

export interface Service {
  id: string;
  name: string;
  description?: string;

  price: number;
  min_price?: number | string | null;
  max_price?: number | string | null;

  online_price?: string | null;
  online_min_price?: string | null;
  online_max_price?: string | null;

  price_mode?: "FIXED" | "RANGE";
  online_price_mode?: "FIXED" | "RANGE" | null;

  estimated_time?: number | null;
  min_time?: number | null;
  max_time?: number | null;

  time_mode?: "FIXED" | "RANGE";

  qty?: number;

  taxes?: string[];
  taxRows?: TaxRow[];

  tenant_id?: string;
  outlet_id?: string | null;
  category_id?: string;

  available_online?: boolean;

  requires_consent?: boolean;
  enforcementMode?: string | null;
  consent_rule?: {
    enforcementMode?: string | null;

    frequency?: "EVERY_X_DAYS" | "ONCE_PER_CUSTOMER" | "EVERY_VISIT";
  } | null;

  consent_template?: {
    heading?: string;
    consent?: string;
  } | null;
  consentTemplate?: {
    heading?: string;
    consent?: string;
  } | null;
  consent_form_id?: string | null;

  duration?: number;
}

export interface EnrichedService extends Service {
  duration: number;
  tax: number;
  unitTax: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  qty: number;
  duration?: number;
  price?: number | null;
  min_price: number | null;
  tax?: number;
  unitTax?: number;
  estimated_time: number | null;
  min_time: number | null;
  requires_consent?: boolean;
  consent_rule?: {
    enforcementMode?: string | null;
  };
  categoryId?: string;
  assignedts?: string;
  assigned_at?: string;
  assigned_via?: string;
}

/* ─────────────────────────────────────────────────────────────
 * CATEGORY
 * ───────────────────────────────────────────────────────────── */

export interface Category {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
  outlet_id: string;
  created_at: string;
  updated_at: string;
  sortOrder: number;
  is_available_online_category: boolean;
  super_category_id: string | null;
  services: Service[];
}

export interface StaffServiceAssignment {
  id: string;
  staffName: string;
  name: string;
  categoryId: string;
  price: number;
  min_price: number;
  qty: number;
  duration: number; // duration in minutes
  assigned_at: string; // ISO date string
  assigned_via: string;
  assigned: boolean;
  tax?: number;
}

export interface FilteredCategory {
  id: string;
  name: string;
  services: Service[];
}
/* ─────────────────────────────────────────────────────────────
 * STAFF
 * ───────────────────────────────────────────────────────────── */

export interface StaffAssignment {
  id: string;
  categoryId?: string;
  price?: number;
  duration?: number;
  qty?: number;
  assigned_at?: string;
  assigned_via?: string;
  assigned?: boolean;
  assignedts?: string;
}

export interface StaffLeaveDate {
  status?: string;
  leaveType?: string;
  leavePeriod?: {
    date?: string;
  };
  returnDate?: {
    date?: string;
  };
}

export interface StaffDateOverride {
  date: string;
  type: "CLOSED" | "TIME";
}

export interface WeeklyDayConfig {
  isClosed?: boolean;
}

export interface WeeklyHours {
  weeklyJson?: Record<string, WeeklyDayConfig>;
}

export interface Staff {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  staff_type?: string;
  imageUrl?: string;
  color?: string;
  assignments?: StaffAssignment[];
  futureLeaveDates?: StaffLeaveDate[];
  dateOverrides?: StaffDateOverride[];
  weeklyHours?: WeeklyHours;
}

/* ─────────────────────────────────────────────────────────────
 * SLOT
 * ───────────────────────────────────────────────────────────── */
export type SlotStatus = "AVAILABLE" | "BOOKED";

export interface Slot {
  id: string;
  staffId: string;
  date: string;
  day: string;
  start_time: string;
  end_time: string;
  startUtc: string;
  endUtc: string;
  isBooked: boolean;
  disabled: boolean;
  source: "WEEKLY" | "CUSTOM" | string;
  createdAt: string;
  updatedAt: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | string;
}

export interface SlotGroups {
  morning: Slot[];
  afternoon: Slot[];
  evening: Slot[];
}

export interface SlotsState {
  selectedSlotIndexes: number[];
  selectedSlotIds: string[];
  selectedDate: SelectedDateType | null;
  selectedTime: string | null;

  slots: {
    morning: Slot[];
    afternoon: Slot[];
    evening: Slot[];
  };

  loading: boolean;
}

export interface GetStaffSlotsArgs {
  tenantId?: string;
  staffId?: string;
  date: string; // e.g. "2026-05-11"
  outletId?: string;
}

export interface StaffSlotsResponse {
  data: {
    groups: {
      morning: Slot[];
      afternoon: Slot[];
      evening: Slot[];
    };
    // optional metadata (if backend sends it)
    staffId?: string;
    tenantId?: string;
    date?: string;
  };
}
/* ─────────────────────────────────────────────────────────────
 * USER
 * ───────────────────────────────────────────────────────────── */

export interface UserDetails {
  id?: string;
  name?: string;

  firstName?: string;
  lastName?: string;

  email?: string;
  phone?: string;
}

export interface Customer {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

/* ─────────────────────────────────────────────────────────────
 * APPOINTMENT
 * ───────────────────────────────────────────────────────────── */

export interface AppointmentResponse {
  id?: string;
  appointmentId?: string;
  customerId?: string;

  customer?: {
    id?: string;
  };

  [key: string]: unknown;
}
export interface AppointmentService {
  id: string;
  serviceId: string;
  price: number;
  duration: number;
  serviceName: string;
  serviceCategory: string;
  service: Service;
}

export interface AppointmentDetails {
  id: string;
  tenantId: string;
  customerId: string;
  staffId: string;
  outletId: string;
  startUtc: string;
  endUtc: string;
  priority: "NORMAL" | string;
  status: "BOOKED" | string;
  isWalkIn: boolean;
  occurrenceNumber: number | null;
  isException: boolean;
  paymentStatus: "PENDING" | "PAID" | string;
  queuePosition: number | null;
  firstName: string;
  lastName: string;
  isCallStatus: boolean;
  requiresConsent: boolean;
  services: AppointmentService[];
  staff: Staff;
  outlet: Outlet;
  customer: Customer;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  startLocal: string;
  endLocal: string;
  currency: string;
  estimatedWaitTime: number;
  tipsCents?: number;
  taxCents?: number;
  totalCents?: number;
}

export interface CustomerInfo {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface AppointmentPayload {
  tenantId: string | null;
  outletId: string | null;
  staffId?: string;

  date: string;
  startTime: string | null;

  serviceIds: string[];
  slotIds: string[];

  isWalkIn: boolean;
  requiresConsent: boolean;

  customer: CustomerInfo;
}

export interface CheckinPayload {
  tenantId: string | null;
  outletId: string | null;

  date: string | null;
  startTime: string | null;

  staffId?: string;

  serviceIds: string[];
  slotIds: string[];

  customer: Customer;
}

/* ─────────────────────────────────────────────────────────────
 * CONSENT
 * ───────────────────────────────────────────────────────────── */
export type EnforcementType =
  | "CHECKBOX_ONLY"
  | "TYPED_NAME"
  | "DRAW_SIGNATURE"
  | null;

export interface ConsentFormData {
  accepted: boolean;
  typedName: string;
  signatureDataUrl: string;
  emailMe: boolean;
}

export interface ConsentPayload {
  accepted: boolean;
  typedName: string;
  signatureDataUrl: string;
  emailMe: boolean;
}

export interface ConsentModalProps {
  onClose: () => void;
  onConfirm: (payload: ConsentPayload) => void;
  enforcement: EnforcementType | string;
  heading?: string;
  consent: string;
}

export interface ConsentModalPayload {
  typedName?: string;
  accepted?: boolean;
  signatureDataUrl?: string;
  emailMe?: boolean;
}

export interface ConsentDraftEntry {
  serviceId: string;
  concentFormId: string;

  signatureType: SignatureType;

  typedName?: string;
  isChecked?: boolean;
  signatureDataUrl?: string;
  emailMe?: boolean;
}

export interface ConsentDraftMap {
  [serviceId: string]: ConsentDraftEntry;
}

export interface ConsentCheckStatus {
  data: {
    checked: boolean;
    needsSignature: boolean;
  };
}

export interface ConsentFormResponse {
  data: unknown;
}

export interface SubmitFinalConsentPayload {
  tenantId: string | null;
  outletId: string | null;
  appointmentId: string;
  customerId: string;
  serviceId: string;
  formId: string;
  staffId?: string;
  signatureType: SignatureType;
  isChecked?: boolean;
  typedName?: string;
  imageUrl?: string;
}

/* ─────────────────────────────────────────────────────────────
 * PAYMENT
 * ───────────────────────────────────────────────────────────── */

export interface PaymentMeta {
  appointmentId: string;
  customerId: string;
}

export interface CardData {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface PaymentPayload {
  appointmentId: string;
  customerId: string;
  outletId: string;
  referenceNo: string;

  currency: string;

  amountCents: number;
  tipAmountCents: number;
  taxAmountCents: number;

  transactionBody: TransactionBody;
}

export interface TransactionBody {
  transactionOrigin: number;
  transactionCode: string;

  isDebit: boolean;

  processMethod: number;
  channelType: number;

  tenderInfo: TenderInfo;

  billingContact: BillingContact;
}

export interface TenderInfo {
  cardHolderName: string;
  cardNumber: string;
  cardType: CardType;
  cardExpiry: number | string;
  cvData: string;
}

export interface BillingContact {
  name: {
    firstName: string;
    lastName: string;
  };

  email: string;
}

/* ─────────────────────────────────────────────────────────────
 * REDUX STATE
 * ───────────────────────────────────────────────────────────── */

export interface OutletSliceState {
  id: string;
  outletName: string;
  timeZone: string;
  image: string;
  tenantId: string;
  address: string;
  isOpen: false;
  createdAt: string;
  isService: true;
  outletTimeZoneDate: string;
  outletTimeZoneYear: number;
  outletTimeZone: string;
  currency: string;
}

export interface ServiceSliceState {
  categories: Category[];
  staff: Staff[];

  selectedCategory: Category | null;
  selectedServices: Service[];

  selectedProfessional: Staff;

  loading: boolean;
  error: string | null;
}

export interface SlotsSliceState {
  selectedSlotIds: string[];
  selectedDate: DateObjectUnits | null;
  selectedTime: string;

  selectedSlotIndexes: number[];

  slots: SlotGroups;

  loading: boolean;
}
export interface SloteDateType {
  day: string;
  month: string;
  year: string;
}

export interface SelectedDateType {
  year: number;
  month: number;
  day: number;
}

export interface ConfirmDateType {
  day: number;
  month: number;
  year: number;
}

export interface AppointmentSliceState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: AppointmentResponse | null;
  appointmentId: string | null;
  customerId: string | null;
  userDetails: UserDetails | null;
  tipPct: number;
  bookingMode: BookingMode;
  payType: string;
}

export interface OutletRootState {
  booking: {
    outletDetails: OutletSliceState;
    service: ServiceSliceState;
    slots: SlotsSliceState;
    appointment: AppointmentSliceState;
  }
}

/* ─────────────────────────────────────────────────────────────
 * API RESPONSES
 * ───────────────────────────────────────────────────────────── */

export interface ServiceResponse {
  categories: Category[];
  staff: Staff[];
}

export interface FetchCustomerResponse {
  data?: Customer[];
}

export interface FetchServicePayload {
  tenantId: string;
  outletId: string;
}

export interface FetchServiceResponse {
  categories: Category[];
  staff: Staff[];
}

/* ─────────────────────────────────────────────────────────────
 * COMPONENT PROPS
 * ───────────────────────────────────────────────────────────── */

export interface AppointmentBookingPluginProps {
  bookingCode: string;
}

export interface ProfessionalSidebarProps {
  pro: Staff | null;
  goToStep: (step: Step) => void;
}

/* DATE TYPES */
export interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

export interface DateItem {
  day: number;
  month: number;
  year: number;
  fullDate: string | null;
}

/* SLOT TYPES */
export interface SlotItem {
  id: string;
  staffId: string;
  date: string;
  day: string;
  start_time: string;
  start_time_12h: string;
  end_time: string;
  startUtc: string;
  endUtc: string;
  isBooked: boolean;
  disabled: boolean;
  source: "WEEKLY" | "CUSTOM" | string;
  createdAt: string;
  updatedAt: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED" | string;
}

export interface CalendarMonth {
  label: string;
  monthIdx: number;
  year: number;
  startDow: number;
  days: number;
}
