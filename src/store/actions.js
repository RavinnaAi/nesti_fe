import { logout } from "./authSlice";
import { clearProfile } from "./profileSlice";
import { setPlans } from "./pricingSlice";
import { clearSelectedPlan } from "./selectedPlanSlice";

const SESSION_KEYS = [
  "nesti_auth_state",
  "nesti_pricing_state",
  "nesti_selected_plan_state",
];

const LOCAL_KEYS = ["nesti_profile_state", "nesti_signup_data"];

export const logoutAndClearAll = () => (dispatch) => {
  dispatch(logout());
  dispatch(clearProfile());
  dispatch(setPlans([]));
  dispatch(clearSelectedPlan());

  if (typeof window !== "undefined") {
    sessionStorage.clear();
    localStorage.clear();
    SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
    LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
  }
};
