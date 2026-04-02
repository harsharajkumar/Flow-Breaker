import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "flow-breaker-mobile-state-v1";

export async function loadAppState(fallbackState) {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : fallbackState;
  } catch (error) {
    console.warn("Flow Breaker storage load failed, using fallback state.", error);
    return fallbackState;
  }
}

export async function saveAppState(appState) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (error) {
    console.warn("Flow Breaker storage save failed.", error);
  }
}
