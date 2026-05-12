package com.doomlock

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class DoomlockAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var expiryRunnable: Runnable? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d(TAG, "Accessibility service connected")

        // Re-schedule expiry launch if there's an active unlock from a previous session
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val expiry = prefs.getLong(UNLOCK_EXPIRY_KEY, 0L)
        if (expiry > System.currentTimeMillis()) {
            scheduleExpiryLaunch(expiry)
        }
    }

    override fun onDestroy() {
        instance = null
        expiryRunnable?.let { handler.removeCallbacks(it) }
        super.onDestroy()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val eventType = event?.eventType ?: return
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED) return

        val packageName = event.packageName?.toString()
            ?: rootInActiveWindow?.packageName?.toString()
            ?: return

        if (packageName == this.packageName) return

        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val blockedPackages = prefs.getStringSet(BLOCKED_PACKAGES_KEY, emptySet()) ?: emptySet()
        val unlocked = isUnlocked(prefs)

        Log.d(TAG, "Window changed: $packageName | blocked=${packageName in blockedPackages} | unlocked=$unlocked")

        if (packageName in blockedPackages && !unlocked) {
            Log.d(TAG, "Blocking $packageName — launching Doomlock")
            launchDoomlock()
        }
    }

    override fun onInterrupt() {}

    private fun isUnlocked(prefs: android.content.SharedPreferences): Boolean {
        val expiry = prefs.getLong(UNLOCK_EXPIRY_KEY, 0L)
        return System.currentTimeMillis() < expiry
    }

    private fun launchDoomlock() {
        val intent = Intent(this, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        startActivity(intent)
    }

    fun scheduleExpiryLaunch(expiryTimestamp: Long) {
        expiryRunnable?.let { handler.removeCallbacks(it) }
        val delay = expiryTimestamp - System.currentTimeMillis()
        if (delay > 0) {
            Log.d(TAG, "Scheduling expiry launch in ${delay}ms")
            expiryRunnable = Runnable {
                Log.d(TAG, "Unlock expired — launching Doomlock")
                launchDoomlock()
            }
            handler.postDelayed(expiryRunnable!!, delay)
        }
    }

    fun cancelScheduledLaunch() {
        expiryRunnable?.let { handler.removeCallbacks(it) }
        expiryRunnable = null
        Log.d(TAG, "Scheduled expiry launch cancelled")
    }

    companion object {
        const val TAG = "DoomlockService"
        const val PREFS_NAME = "DoomlockPrefs"
        const val UNLOCK_EXPIRY_KEY = "unlock_expiry"
        const val BLOCKED_PACKAGES_KEY = "blocked_packages"

        @Volatile
        var instance: DoomlockAccessibilityService? = null

        fun scheduleUnlockExpiry(expiryTimestamp: Long) {
            instance?.scheduleExpiryLaunch(expiryTimestamp)
        }

        fun cancelUnlockExpiry() {
            instance?.cancelScheduledLaunch()
        }
    }
}
