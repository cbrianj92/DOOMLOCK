package com.doomlock

import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class BlockingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BlockingModule"

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        try {
            val serviceName = "${reactApplicationContext.packageName}/${DoomlockAccessibilityService::class.java.canonicalName}"
            val enabled = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            promise.resolve(enabled?.contains(serviceName) == true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun updateBlockedPackages(blockedPackages: ReadableArray) {
        val packages = mutableSetOf<String>()
        for (i in 0 until blockedPackages.size()) {
            blockedPackages.getString(i)?.let { packages.add(it) }
        }
        val prefs = reactApplicationContext.getSharedPreferences(
            DoomlockAccessibilityService.PREFS_NAME, Context.MODE_PRIVATE
        )
        prefs.edit().putStringSet(DoomlockAccessibilityService.BLOCKED_PACKAGES_KEY, packages).apply()
    }
}
