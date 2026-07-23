import { useMemo, useState } from "react";
import { Outlet } from "@/types";
import { Search, X } from "lucide-react";

interface OutletProps {
  outlets: Outlet[];
  onSelectOutlet: (outlet: Outlet) => void;
  loadingOutletId?: string | null;
}

interface OutletCardProps {
  item: Outlet;
  onSelect: (id: string) => void;
  selected: boolean;
  isLoading: boolean;
  isDisabled: boolean;
}

const StatusBadge = ({ status }: { status: boolean }) => (
  <span className={`aaravpos-status-badge ${status
    ? "aaravpos-status-open"
    : "aaravpos-status-closed"
    }`}
  >
    {status ? "Open" : "Closed"}
  </span>
);

const OutletCard = ({ item, onSelect, selected, isLoading, isDisabled }: OutletCardProps) => {
  return (
    <div
      className={`aaravpos-outlet-card
        ${selected ? "selected" : ""}
        ${!item.isOpen ? "closed" : ""}
        ${isDisabled && !isLoading ? "loading-disabled" : ""}
        ${isLoading ? "loading-card" : ""}
      `}
      onClick={() => {
        if (!isDisabled) {
          onSelect(String(item?.id));
        }
      }}
    >
      <div className="aaravpos-outlet-card-top">
        <StatusBadge status={item.isOpen} />
        {isLoading && (
          <div className="aaravpos-outlet-card-loader-corner">
            <div className="aaravpos-loader" />
          </div>
        )}
      </div>
      <div className="aaravpos-outlet-card-content">
        <div className="aaravpos-outlet-card-inner">
          <h2 className="aaravpos-outlet-card-title">
            {item.outletName}
          </h2>
          <p className="aaravpos-outlet-card-address">
            {item.address}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function ChooseYourOutlet({
  outlets,
  onSelectOutlet,
  loadingOutletId,
}: OutletProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const activeLoadingId = loadingOutletId || (selected && loadingOutletId !== null ? selected : null);
  const isAnyLoading = Boolean(loadingOutletId);

  const handleSelectOutlet = (id: string) => {
    if (isAnyLoading) return;
    setSelected(id);
    const selectedOutlet = outlets.find((o) => String(o.id) === String(id));
    if (selectedOutlet) {
      onSelectOutlet(selectedOutlet);
    }
  };

  const filteredOutlets = useMemo(() => {
    if (!searchTerm.trim()) return outlets;

    const term = searchTerm.toLowerCase();

    return outlets.filter((outlet) => {
      return (
        outlet.outletName?.toLowerCase().includes(term) ||
        outlet.address?.toLowerCase().includes(term)
      );
    });
  }, [outlets, searchTerm]);

  return (
    <div className="aaravpos-container">
      <div className="aaravpos-header">
        <div>
          <h1 className="aaravpos-title">
            Choose Your Outlet
          </h1>
          <div className="aaravpos-outlet-divider" />
        </div>
        <div className="aaravpos-search-wrapper">
          <span className="aaravpos-search-icon">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search outlet..."
            value={searchTerm}
            disabled={isAnyLoading}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="aaravpos-search-input"
          />
          <div className="aaravpos-search-actions">
            {searchTerm && !isAnyLoading && (
              <button
                onClick={() => setSearchTerm("")}
                className="aaravpos-search-clear"
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="aaravpos-outlet-list-wrapper">
        {filteredOutlets.length > 0 ? (
          <div className="aaravpos-outlet-grid">
            {filteredOutlets.map((outlet: Outlet, index: number) => {
              const isThisSelected = String(selected) === String(outlet.id) || String(loadingOutletId) === String(outlet.id);
              const isThisLoading = String(loadingOutletId) === String(outlet.id);
              return (
                <div key={outlet.id || index}>
                  <OutletCard
                    item={outlet}
                    onSelect={handleSelectOutlet}
                    selected={isThisSelected}
                    isLoading={isThisLoading}
                    isDisabled={isAnyLoading}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="aaravpos-empty-state">
            <div className="aaravpos-empty-content">
              <h3 className="aaravpos-empty-title">
                No outlets found
              </h3>
              <p className="aaravpos-empty-text">
                Try searching with a different keyword
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
