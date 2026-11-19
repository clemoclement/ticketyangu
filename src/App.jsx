import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "./context.jsx";
import { Header, Footer } from "./components/Layout.jsx";
import Discover from "./pages/Discover.jsx"; 
import EventDetail from "./pages/EventDetail.jsx";
import Cart from "./pages/Cart.jsx"; 
import Checkout from "./pages/Checkout.jsx";
import Booking from "./pages/Booking.jsx"; 
import MyBookings from "./pages/MyBookings.jsx"; 
import SignIn from "./pages/SignIn.jsx";
import AdminLayout from "./admin/AdminLayout.jsx"; 
import AdminOverview from "./admin/Overview.jsx";
import AdminBookings from "./admin/Bookings.jsx"; 
import AdminEvents from "./admin/Events.jsx";

function Client() { return <div className="flex min-h-screen flex-col"><Header /><main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"><Outlet /></main><Footer /></div>; }
function Protected({ admin, children }) {
  const { user } = useApp(); 
  const loc = useLocation();
  if (!user) return <Navigate to="/sign-in" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Client />}>
        <Route index element={<Discover />} /><Route path="events/:id" element={<EventDetail />} /><Route path="cart" element={<Cart />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="checkout" element={<Protected><Checkout /></Protected>} />
        <Route path="bookings" element={<Protected><MyBookings /></Protected>} />
        <Route path="bookings/:id" element={<Protected><Booking /></Protected>} />
      </Route>
      <Route path="admin" element={<Protected admin><AdminLayout /></Protected>}>
        <Route index element={<AdminOverview />} /><Route path="events" element={<AdminEvents />} /><Route path="bookings" element={<AdminBookings />} />
      </Route>
    </Routes>
  );
}
