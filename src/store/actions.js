import { logout } from "./authSlice";
import { clearProfile } from "./profileSlice";
import { setPlans } from "./pricingSlice";
import { clearSelectedPlan } from "./selectedPlanSlice";

const SESSION_KEYS = ["nesti_pricing_state", "nesti_selected_plan_state"];

const LOCAL_KEYS = ["nesti_auth_state", "nesti_profile_state", "nesti_signup_data", "nesti_prochat_unread"];

function clearStorageKeys(storageRef, keys) {
  if (!storageRef || !Array.isArray(keys)) return;
  keys.forEach((key) => {
    try {
      storageRef.removeItem(key);
    } catch {
      // ignore storage removal errors
    }
  });
}

export const logoutAndClearAll = () => (dispatch) => {
  dispatch(logout());
  dispatch(clearProfile());
  dispatch(setPlans([]));
  dispatch(clearSelectedPlan());

  if (typeof window !== "undefined") {
    clearStorageKeys(window.sessionStorage, SESSION_KEYS);
    clearStorageKeys(window.localStorage, LOCAL_KEYS);
  }
};
