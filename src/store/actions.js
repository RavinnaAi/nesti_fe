import { logout } from "./authSlice";
import { clearProfile } from "./profileSlice";
import { setPlans } from "./pricingSlice";
import { clearSelectedPlan } from "./selectedPlanSlice";

const SESSION_KEYS = ["nesti_pricing_state", "nesti_selected_plan_state"];

const LOCAL_KEYS = ["nesti_auth_state", "nesti_profile_state", "nesti_signup_data", "nesti_prochat_unread"];

export const logoutAndClearAll = () => (dispatch) => {
  dispatch(logout());
  dispatch(clearProfile());
  dispatch(setPlans([]));
  dispatch(clearSelectedPlan());

  if (typeof window !== "undefined") {
    SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
    LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
  }
};
