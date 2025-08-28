import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Initialize i18n
import { initScrollbarCompensation } from "./lib/scrollbar-compensation";

// Initialize scrollbar compensation to prevent layout shift
initScrollbarCompensation();

createRoot(document.getElementById("root")!).render(<App />);
