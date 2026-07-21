import { useSelector } from "react-redux";
import { MainLayoutProps } from "@/types";

export default function MainLayout({
    children,
    sidebar,
    renderButton, isConfirm = false, handleSidebarOpen, isSidebarOpen = false
}: MainLayoutProps) {
    const { isOpenSidebar } = useSelector((state: any) => state.booking.theme);
    return (
        <div className="aaravpos-main-layout">
            <div className={isOpenSidebar ? "aaravpos-layout-wrapper" : ""}>
                <main className="aaravpos-main-content">
                    {children}
                    <div className="aaravpos-mobile-action-wrapper">
                        {isConfirm ? (
                            <button
                                onClick={handleSidebarOpen}
                                className="aaravpos-cta-btn"
                            >
                                <span>View Order</span>
                            </button>
                        ) : (
                            renderButton
                        )}
                    </div>
                </main>
                <aside className={`aaravpos-sidebar ${isOpenSidebar ? "open" : ""}`}>
                    {sidebar}
                </aside>
            </div>
            {isSidebarOpen && (
                <div className="aaravpos-sidebar-mobile">
                    {/* <div className="p-3 flex justify-center"><div className="w-12 h-1.5 bg-gray-300 rounded-full" /></div> */}
                    <div className="aaravpos-sidebar-mobile-content">{sidebar}</div>
                </div>
            )}

        </div>
    );
}