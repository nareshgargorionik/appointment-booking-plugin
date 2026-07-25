import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, X } from "lucide-react";
import {
  selectPrimaryService,
  toggleService
} from "@/slices/serviceSlice";
import Breadcrumb from "@/components/common/Breadcrumb";
import MainLayout from "@/components/common/MainLayout";
import ServiceSkeletonCard from "@/components/common/ServiceSkeleton";
import { isConsentRequiredService } from "@/services";
import { nextStep } from "@/slices/breadcrumbSlice";
import { CurrencyIcon } from "@/utils";
import { OutletRootState, Service, TaxRow } from "@/types";
import ServiceSidebarSkeleton from "../common/ServiceSidebarSkeleton";

export default function ServicesPage() {
  const dispatch = useDispatch();
  const superCategoryScrollRef = useRef<HTMLDivElement | null>(null);
  const subCategoryScrollRef = useRef<HTMLDivElement | null>(null);
  const { superCategories, selectedServices, loading } = useSelector(
    (state: any) => state.booking.service,
  );
  const { outletName } = useSelector(
    (state: OutletRootState) => state.booking?.outletDetails,
  );
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<any>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const servicesToDisplay = useMemo(() => {
    if (!selectedSuperCategory) return [];
    if (!selectedSubCategory) {
      return (
        selectedSuperCategory?.categories?.flatMap(
          (cat: any) => cat.services || [],
        ) || []
      );
    }
    return selectedSubCategory?.services || [];
  }, [selectedSuperCategory, selectedSubCategory]);

  const allServices = useMemo(() => {
    return (
      superCategories?.flatMap((superCat: any) =>
        superCat?.categories?.flatMap((cat: any) => cat.services || []),
      ) || []
    );
  }, [superCategories]);

  const servicesToShow = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      return allServices.filter((svc: any) => {
        return (
          svc.name?.toLowerCase().includes(term) ||
          svc.description?.toLowerCase().includes(term)
        );
      });
    }

    return servicesToDisplay;
  }, [searchTerm, allServices, servicesToDisplay]);

  const hasActiveTax = (svc: Service): boolean => {
    return svc.taxRows?.some((tax: TaxRow) => tax.isActive) || false;
  };

  useEffect(() => {
    if (!superCategories?.length) return;
    const firstSuperCategory = superCategories.find((superCat: any) =>
      superCat?.categories?.some((cat: any) => cat?.services?.length > 0),
    );
    if (firstSuperCategory && !selectedSuperCategory) {
      setSelectedSuperCategory(firstSuperCategory);
      setSelectedSubCategory(null);
    }
  }, [superCategories, selectedSuperCategory]);

  return (
    <MainLayout
      sidebar={
        <ServiceSidebarSkeleton />
        // <ServiceSidebar
        //   selectedServices={selectedServices}
        //   totalPrice={totalPrice}
        //   goToStep={() => dispatch(nextStep())}
        // />
      }
    // renderButton={
    //   servicesToShow?.length > 0 ? (
    //     <button
    //       onClick={() => dispatch(nextStep())}
    //       disabled={!selectedServices.length}
    //       className="aaravpos-btn"
    //     >
    //       <span className="aaravpos-btn-content">
    //         Choose Professional <ChevronRight size={16} />
    //       </span>
    //     </button>
    //   ) : null
    // }
    >
      <Breadcrumb />
      <div className="aaravpos-margin-top-20">
        <div className="aaravpos-navbar-form">
          <div>
            <h1 className="aaravpos-page-title">Book A Service</h1>
            <p className="aaravpos-sub-title">
              Select from{" "}
              <span className="aaravpos-text-bold">{outletName}</span> Outlet's
              available services
            </p>
          </div>
          <div className="aaravpos-search-wrapper">
            <span className="aaravpos-search-icon">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="aaravpos-search-input"
            />
            <div className="aaravpos-search-actions">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="aaravpos-search-clear"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div
          ref={superCategoryScrollRef}
          onWheel={(e) => {
            if (superCategoryScrollRef.current) {
              superCategoryScrollRef.current.scrollLeft += e.deltaY;
            }
          }}
          className="aaravpos-supercategory-wrapper"
        >
          {superCategories
            ?.filter((superCat: any) =>
              superCat?.categories?.some(
                (cat: any) => cat?.services?.length > 0,
              ),
            )
            ?.map((superCat: any) => (
              <button
                key={superCat.id}
                onClick={() => {
                  setSelectedSuperCategory(superCat);
                  setSelectedSubCategory(null);
                }}
                className={`aaravpos-supercategory-btn ${selectedSuperCategory?.id === superCat.id ? "active" : ""}`}
              >
                <h3 className="aaravpos-supercategory-title">
                  {superCat?.isStandAloneCategory
                    ? "Standalone"
                    : superCat.name}
                </h3>
              </button>
            ))}
        </div>
        {selectedSuperCategory?.categories?.some(
          (cat: any) => cat?.services?.length > 0,
        ) && (
            <div
              ref={subCategoryScrollRef}
              onWheel={(e) => {
                if (subCategoryScrollRef.current) {
                  subCategoryScrollRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="aaravpos-supercategory-wrapper"
            >
              <button
                onClick={() => setSelectedSubCategory(null)}
                className={`aaravpos-supercategory-btn ${!selectedSubCategory ? "active" : ""}`}
              >
                All Services (
                {selectedSuperCategory?.categories?.reduce(
                  (sum: number, c: any) => sum + (c?.services?.length || 0),
                  0,
                )}
                )
              </button>
              {selectedSuperCategory?.categories
                ?.filter((cat: any) => cat?.services?.length > 0)
                ?.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSubCategory(cat)}
                    className={`aaravpos-supercategory-btn ${selectedSubCategory?.id === cat.id ? "active" : ""}`}
                  >
                    {cat.name} ({cat.services.length})
                  </button>
                ))}
            </div>
          )}
        <div className="aaravpos-services-wrapper">
          <div className="aaravpos-services-grid">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <ServiceSkeletonCard key={i} />
              ))
            ) : (
              <>
                {!servicesToShow?.length ? (
                  <div className="aaravpos-empty-services">
                    <h3 className="aaravpos-empty-services-title">
                      No Services Found
                    </h3>
                    <p className="aaravpos-empty-services-text">
                      {searchTerm
                        ? "No services found for your search."
                        : "No services are available for selected category."}
                    </p>
                  </div>
                ) : (
                  servicesToShow?.map((svc: any, index: number) => {
                    const isSelected = selectedServices[0]?.id === svc.id;
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          dispatch(selectPrimaryService(svc));
                          dispatch(nextStep());
                          // const exists = selectedServices.find(
                          //   (s: any) => s.id === svc.id,
                          // );
                          // if (exists && exists.qty === 1) {
                          //   dispatch(decrementService(String(svc.id)));
                          // } else {
                          //   dispatch(toggleService(svc));
                          // }
                          // if (window.innerWidth > 991) {
                          //   dispatch(setSidebarOpen(true))
                          // }
                        }}
                        className={`aaravpos-service-card ${isSelected ? "active" : ""}`}
                      >
                        {/* TAX */}
                        {hasActiveTax(svc) && (
                          <span className="aaravpos-tax-badge">TAX</span>
                        )}
                        {/* CONSENT */}
                        {isConsentRequiredService(svc) && (
                          <span className="aaravpos-consent-badge">
                            CONSENT
                          </span>
                        )}
                        {/* NAME */}
                        <p className="aaravpos-service-title">{svc.name}</p>
                        {/* DESCRIPTION */}
                        {/* <div className="aaravpos-service-description-wrapper"> */}
                        <p className="aaravpos-service-description">
                          {svc.description}
                        </p>
                        {/* {svc.description && svc.description.length > 30 && (
                            <div className="aaravpos-service-tooltip">
                              {svc.description}
                            </div>
                          )} */}
                        {/* </div> */}
                        {/* PRICE */}
                        <p className="aaravpos-service-price">
                          <span>
                            {svc.estimated_time
                              ? `${svc.estimated_time} min`
                              : `${svc.min_time}-${svc.max_time} min`}
                          </span>
                          <span className="aaravpos-service-price-right">
                            {svc.price ? (
                              <>
                                <CurrencyIcon className="aaravpos-currency-icon" />
                                {svc.price}
                              </>
                            ) : (
                              <>
                                <CurrencyIcon className="aaravpos-currency-icon" />
                                {svc.min_price} - <CurrencyIcon className="aaravpos-currency-icon" />
                                {svc.max_price}
                              </>
                            )}
                          </span>
                        </p>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout >
  );
}
