package com.doomlock

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class UnlockModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "UnlockModule"

    @ReactMethod
    fun setUnlockExpiry(expiryTimestamp: Double) {
        val prefs = reactApplicationContext.getSharedPreferences(
            DoomlockAccessibilityService.PREFS_NAME, Context.MODE_PRIVATE
        )
        prefs.edit().putLong(DoomlockAccessibilityService.UNLOCK_EXPIRY_KEY, expiryTimestamp.toLong()).apply()
        DoomlockAccessibilityService.scheduleUnlockExpiry(expiryTimestamp.toLong())
    }

    @ReactMethod
    fun clearUnlockExpiry() {
        val prefs = reactApplicationContext.getSharedPreferences(
            DoomlockAccessibilityService.PREFS_NAME, Context.MODE_PRIVATE
        )
        prefs.edit().remove(DoomlockAccessibilityService.UNLOCK_EXPIRY_KEY).apply()
        DoomlockAccessibilityService.cancelUnlockExpiry()
    }
}
