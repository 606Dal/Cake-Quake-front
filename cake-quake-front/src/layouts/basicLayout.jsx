// layouts/BasicLayout.jsx


import { Outlet } from "react-router";
import BuyerHeader from "../components/common/buyerHeader.jsx";
import Footer from "../components/common/footer.jsx";

function BasicLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <BuyerHeader />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default BasicLayout;