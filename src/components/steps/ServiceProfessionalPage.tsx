import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, X, ChevronRight } from "lucide-react";
import {
  toggleService,
} from "@/slices/serviceSlice";
import Breadcrumb from "@/components/common/Breadcrumb";
import MainLayout from "@/components/common/MainLayout";
import ServiceProfessionalSidebar from "@/components/sidebar/ServiceSidebar";
import ServiceSkeletonCard from "@/components/common/ServiceSkeleton";
import { nextStep } from "@/slices/breadcrumbSlice";
import { isConsentRequiredService } from "@/services";
import { CurrencyIcon } from "@/utils";
import type { AppDispatch } from "@/store";
import type { Service, ServiceItem, TaxRow, StaffAssignment } from "@/types";

export default function ServiceProfessionalPage() {
  const dispatch = useDispatch<AppDispatch>();
  const superCategoryScrollRef = useRef<HTMLDivElement | null>(null);
  const subCategoryScrollRef = useRef<HTMLDivElement | null>(null);
  const { superCategories, selectedServices, selectedProfessional, loading } =
    useSelector((state: any) => state.booking.service);
  const [selectedSuperCategory, setSelectedSuperCategory] = useState<any>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const assignedServiceIds = new Set(
    selectedProfessional
      ? selectedProfessional?.assignments?.map((a: StaffAssignment) => a.id)
      : [],
  );

  const assignedCategoryIds = new Set(
    selectedProfessional
      ? selectedProfessional?.assignments?.map(
        (a: StaffAssignment) => a.categoryId,
      )
      : [],
  );
  const filteredSuperCategories =
    superCategories
      ?.map((superCat: any) => ({
        ...superCat,
        categories:
          superCat.categories
            ?.map((category: any) => ({
              ...category,
              services:
                category.services?.filter((service: Service) =>
                  assignedServiceIds.has(service.id),
                ) || [],
            }))
            .filter(
              (category: any) =>
                assignedCategoryIds.has(category.id) &&
                category.services.length > 0,
            ) || [],
      }))
      .filter((superCat: any) => superCat.categories.length > 0) || [];

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
      filteredSuperCategories?.flatMap((superCat: any) =>
        superCat.categories?.flatMap((cat: any) => cat.services || []),
      ) || []
    );
  }, [filteredSuperCategories]);

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

  const totalPrice = selectedServices.reduce((sum: number, s: ServiceItem) => {
    const price = Number(s.price || s.min_price || 0);
    return sum + price * s.qty;
  }, 0);

  useEffect(() => {
    if (!filteredSuperCategories?.length) return;
    const firstSuperCategory = filteredSuperCategories.find((superCat: any) =>
      superCat?.categories?.some((cat: any) => cat?.services?.length > 0),
    );
    if (firstSuperCategory && !selectedSuperCategory) {
      setSelectedSuperCategory(firstSuperCategory);
      setSelectedSubCategory(null);
    }
  }, [filteredSuperCategories, selectedSuperCategory]);

  return (
    <MainLayout
      sidebar={
        <ServiceProfessionalSidebar
          selectedServices={selectedServices}
          totalPrice={totalPrice}
          goToStep={() => dispatch(nextStep())}
        />
      }
      renderButton={servicesToShow?.length > 0 ? (
        <button
          onClick={() => dispatch(nextStep())}
          disabled={!selectedServices.length}
          className="aaravpos-btn"
        >
          <span className="aaravpos-btn-content">
            Choose Professional <ChevronRight size={16} />
          </span>
        </button>
      ) : null}
    >
      <Breadcrumb />
      <div className="aaravpos-margin-top-20">
        <div className="aaravpos-navbar-form">
          <div>
            <h1 className="aaravpos-page-title">Choose a Service</h1>
            <p className="aaravpos-sub-title">
              Select from {selectedProfessional?.name}'s available services
            </p>
          </div>
          <div className="aaravpos-search-wrapper">
            <span className="aaravpos-search-icon">
              <Search size={14} />
            </span>
            <input
              id="search"
              name="search"
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
          {filteredSuperCategories?.map((superCat: any) => (
            <button
              key={superCat.id}
              onClick={() => {
                setSelectedSuperCategory(superCat);
                setSelectedSubCategory(null);
              }}
              className={`aaravpos-supercategory-btn ${selectedSuperCategory?.id === superCat.id ? "active" : ""}`}
            >
              <h3 className="aaravpos-supercategory-title">
                {superCat?.isStandAloneCategory ? "Standalone" : superCat.name}
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
                All Services ({selectedSuperCategory?.categories?.reduce((sum: number, c: any) => sum + (c?.services?.length || 0), 0,)})
              </button>
              {selectedSuperCategory?.categories?.map((cat: any) => (
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
                      {searchTerm ? "No services found for your search." : "No services are available for this professional."}
                    </p>
                  </div>
                ) : (
                  servicesToShow?.map((svc: any, index: number) => {
                    const isSelected = selectedServices.some((s: any) => s.id === svc.id,);
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          dispatch(toggleService(svc));
                          // const exists = selectedServices.find(
                          //   (s: any) => s.id === svc.id,
                          // );
                          // if (exists && exists.qty === 1) {
                          //   dispatch(decrementService(String(svc.id)));
                          // } else {
                          //   dispatch(
                          //     toggleService({
                          //       ...svc,
                          //       price: svc.price
                          //         ? Number(svc.price)
                          //         : undefined,
                          //     }),
                          //   );
                          // }
                          // if (window.innerWidth > 991) {
                          //   dispatch(setSidebarOpen(true))
                          // }
                        }}
                        className={`aaravpos-service-card ${isSelected ? "active" : ""}`}
                      >
                        {hasActiveTax(svc) && (
                          <span className="aaravpos-tax-badge">TAX</span>
                        )}
                        {isConsentRequiredService(svc) && (
                          <span className="aaravpos-consent-badge">
                            CONSENT
                          </span>
                        )}
                        <p className="aaravpos-service-title">{svc.name}</p>
                        <div className="aaravpos-service-description-wrapper">
                          <p className="aaravpos-service-description">
                            {svc.description}
                          </p>
                          {/* {svc.description && svc.description.length > 30 && (
                            <div className="aaravpos-service-tooltip">
                              {svc.description}
                            </div>
                          )} */}
                        </div>
                        <p className="aaravpos-service-price">
                          <span>
                            {svc.estimated_time ? `${svc.estimated_time} min` : `${svc.min_time}-${svc.max_time} min`}
                          </span>
                          <span className="aaravpos-service-price-right">
                            {svc.price ? (
                              <>
                                <CurrencyIcon className="aaravpos-currency-icon" /> {svc.price}
                              </>
                            ) : (
                              <>
                                <CurrencyIcon className="aaravpos-currency-icon" /> {svc.min_price} - <CurrencyIcon className="aaravpos-currency-icon" /> {svc.max_price}
                              </>
                            )}
                          </span>
                        </p>
                        {/* <div className="aaravpos-service-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(decrementService(String(svc.id)));
                              if (window.innerWidth > 991) {
                                dispatch(setSidebarOpen(true))
                              }
                            }}
                            className="aaravpos-service-action-btn"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="aaravpos-service-qty">
                            {selectedServices.find((s: any) => s.id === svc.id)?.qty || 0}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const exists = selectedServices.find(
                                (s: any) => s.id === svc.id,
                              );
                              if (!exists) {
                                dispatch(
                                  toggleService({
                                    ...svc,
                                    price: svc.price
                                      ? Number(svc.price)
                                      : undefined,
                                  }),
                                );
                              } else {
                                dispatch(incrementService(String(svc.id)));
                              }
                              if (window.innerWidth > 991) {
                                dispatch(setSidebarOpen(true))
                              }
                            }}
                            className="aaravpos-service-action-btn plus"
                          >
                            <Plus size={14} />
                          </button>
                        </div> */}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
