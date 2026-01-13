import { useAuth } from "../context/AuthContext";
import AppLoader from "./AppLoader";

export default function AppGate({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  return children;
}
