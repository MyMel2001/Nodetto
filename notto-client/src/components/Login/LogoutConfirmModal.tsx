import { invoke } from "@tauri-apps/api/core";
import { useGeneral } from "../../store/general";

export default function LogoutConfirmModal() {
  const { showLogoutConfirm, setShowLogoutConfirm, setUser, syncStatus } = useGeneral();

  function handleLogout() {
    // Clear user session
    setUser(null);
    invoke("logout").catch((e) => console.error(e));
    
    setShowLogoutConfirm(false);
  }

  return (
    <>
    {showLogoutConfirm &&

      <div className="min-h-screen min-w-screen flex items-center justify-center p-4 fixed z-50">
        <div className="fixed inset-0 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        />

        <div className="relative bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Warning
            </h2>
            <p className="text-white">
              Everything saved locally that is not synced will not be recoverable. Current sync status is <span className="font-bold text-white">{syncStatus}</span>.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors mb-3"
          >
            Logout Anyway
          </button>

          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      }
    </>
  )
}