import { useSelector } from "react-redux";
import { DollarSign, IndianRupee, Euro, PoundSterling } from "lucide-react";
import { RootState } from "@/store";

type Currency = "USD" | "INR" | "EUR" | "GBP";

const currencyIcons: Record<Currency, React.ElementType> = {
  USD: DollarSign,
  INR: IndianRupee,
  EUR: Euro,
  GBP: PoundSterling,
};

type Props = {
  size?: number;
  className?: string;
};
type TaxType = "FIXED" | "PERCENTAGE";

type TaxRow = {
  isActive?: boolean;
  taxType?: TaxType;
  taxRate?: number | undefined;
};

type Service = {
  price?: number | string | null;
  min_price?: number | string | null;
  qty?: number;
  taxRows?: TaxRow[];
};

type CalculateServiceTaxOptions = {
  perUnit?: boolean;
};

export const CurrencyIcon = ({ size = 20, className }: Props) => {
  const currency = useSelector(
    (state: RootState) => state.booking.outletDetails?.currency
  ) as Currency | undefined;

  const Icon = currency
    ? currencyIcons[currency]
    : DollarSign;

  return <Icon size={size} className={`aaravpos-currency-icon ${className || ""}`.trim()} />;
};


export const getUserName = (name: string = ""): string => {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "";

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";

  return (first + last).toUpperCase();
};

export const getServiceBasePrice = (svc: Service): number => {
  return Number(svc.price || svc.min_price || 0);
};

export const calculateServiceTax = (
  svc: Service,
  { perUnit = false }: CalculateServiceTaxOptions = {}
): number => {
  const basePrice = getServiceBasePrice(svc);
  const qty = perUnit ? 1 : svc.qty || 1;

  if (!svc.taxRows || !svc.taxRows.length) {
    return 0;
  }

  return svc.taxRows.reduce((total: number, tax: TaxRow) => {
    if (!tax.isActive) {
      return total;
    }

    if (tax.taxType === "FIXED") {
      return total + (tax.taxRate || 0) * qty;
    }

    if (tax.taxType === "PERCENTAGE") {
      return total + (basePrice * qty * (tax.taxRate || 0)) / 100;
    }

    return total;
  }, 0);
};

export const getPublicIP = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Failed to fetch public IP:", error);
    return null;
  }
};