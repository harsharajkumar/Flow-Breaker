import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  FOCUS_PRESETS,
  LOCK_DAYS,
  MAX_LOCKS_VISIBLE,
  MOODS,
} from "./src/data/flowContent";
import {
  activateEmergencyShield,
  addGoal,
  addJournalEntry,
  createInitialState,
  cycleGitaVerse,
  formatCountdown,
  formatHourWindow,
  getActiveLocks,
  getCurrentStreakDays,
  getPatternRadar,
  getTodayFocusMinutes,
  getTopGoals,
  lockDomainFor21Days,
  logSlip,
  markUrgeVictory,
  normalizeDomain,
  pauseFocus,
  pruneExpiredLocks,
  resetFocus,
  sanitizeLoadedState,
  startFocus,
  tickFocus,
  toggleGoal,
  updateFocusPreset,
} from "./src/lib/flowEngine";
import {
  requestRiskReminderPermission,
  sendShieldActivatedNotification,
  syncRiskHourNotifications,
} from "./src/lib/notifications";
import { loadAppState, saveAppState } from "./src/lib/storage";

const SURFACE = "#0F172A";
const SURFACE_2 = "#111827";
const BORDER = "rgba(148, 163, 184, 0.18)";
const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const PURPLE = "#8B5CF6";
const RED = "#EF4444";
const TEAL = "#14B8A6";
const CYAN = "#06B6D4";

export default function App() {
  const fallbackState = useMemo(() => createInitialState(), []);
  const [appState, setAppState] = useState(fallbackState);
  const appStateRef = useRef(fallbackState);
  const [isReady, setIsReady] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [journalContext, setJournalContext] = useState("");
  const [journalResponse, setJournalResponse] = useState("");
  const [selectedMood, setSelectedMood] = useState("Stressed");
  const [selectedIntensity, setSelectedIntensity] = useState(7);

  const radar = useMemo(() => getPatternRadar(appState), [appState]);
  const notificationPlanKey = useMemo(
    () =>
      `${radar.gitaCard.verse}|${radar.reminderHours
        .map((bucket) => bucket.hour)
        .join(",")}`,
    [radar]
  );
  const activeLocks = useMemo(() => getActiveLocks(appState), [appState]);
  const topGoals = useMemo(() => getTopGoals(appState), [appState]);
  const streakDays = useMemo(() => getCurrentStreakDays(appState), [appState]);
  const focusMinutesToday = useMemo(() => getTodayFocusMinutes(appState), [appState]);
  const shieldActive = Boolean(
    appState.shield.activeUntil && appState.shield.activeUntil > Date.now()
  );

  useEffect(() => {
    let mounted = true;

    async function hydrateState() {
      const loadedState = await loadAppState(fallbackState);
      const safeState = pruneExpiredLocks(
        sanitizeLoadedState(loadedState, fallbackState)
      );

      if (!mounted) {
        return;
      }

      appStateRef.current = safeState;
      setAppState(safeState);
      await requestRiskReminderPermission();
      setIsReady(true);
    }

    hydrateState();

    return () => {
      mounted = false;
    };
  }, [fallbackState]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    appStateRef.current = appState;
    saveAppState(appState);
  }, [appState, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    syncRiskHourNotifications(radar);
  }, [isReady, notificationPlanKey]);

  useEffect(() => {
    if (!appState.focus.running) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setAppState((previous) => {
        const nextState = tickFocus(previous);
        appStateRef.current = nextState;
        return nextState;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [appState.focus.running]);

  function commitState(nextState) {
    appStateRef.current = nextState;
    setAppState(nextState);
  }

  async function handleEmergencyShield() {
    const nextState = activateEmergencyShield(appStateRef.current);
    const nextRadar = getPatternRadar(nextState);
    commitState(nextState);
    await sendShieldActivatedNotification(nextRadar.gitaCard);
    Alert.alert(
      "Emergency Shield activated",
      `Adult domains were added to your ${LOCK_DAYS}-day lock vault. ${nextRadar.gitaCard.practice}`
    );
  }

  function handleLockDomain() {
    const domain = normalizeDomain(domainInput);

    if (!domain) {
      Alert.alert("Enter a domain", "Example: example.com");
      return;
    }

    commitState(lockDomainFor21Days(appStateRef.current, domain));
    setDomainInput("");
    Alert.alert("Locked for 21 days", `${domain} is now protected by Flow Breaker.`);
  }

  function handleAddGoal() {
    if (!goalInput.trim()) {
      return;
    }

    commitState(addGoal(appStateRef.current, goalInput, "Today", "Discipline"));
    setGoalInput("");
  }

  function handleJournalSave() {
    if (!journalContext.trim() || !journalResponse.trim()) {
      Alert.alert("Finish the log", "Write the trigger and what you did instead.");
      return;
    }

    commitState(
      addJournalEntry(
        appStateRef.current,
        journalContext,
        selectedMood,
        selectedIntensity,
        journalResponse
      )
    );
    setJournalContext("");
    setJournalResponse("");
    setSelectedMood("Stressed");
    setSelectedIntensity(7);
  }

  function handleSlipReset() {
    Alert.alert(
      "Reset without shame",
      "Log a slip and restart your streak from this moment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset streak",
          style: "destructive",
          onPress: () => commitState(logSlip(appStateRef.current)),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.safeArea}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Flow Breaker</Text>
            <Text style={styles.heroTitle}>Goals over urges.</Text>
            <Text style={styles.heroCopy}>
              No login. No subscription. Your streak, risk patterns, Gita
              reminders, and 21-day lock vault stay on this phone.
            </Text>

            <View style={styles.metricsRow}>
              <MetricCard label="Streak" value={`${streakDays}d`} />
              <MetricCard label="Focus today" value={`${focusMinutesToday}m`} />
              <MetricCard label="Locks" value={String(activeLocks.length)} />
              <MetricCard label="Wins" value={String(appState.stats.urgesBeaten)} />
            </View>

            <Pressable style={styles.emergencyButton} onPress={handleEmergencyShield}>
              <Text style={styles.emergencyButtonText}>Emergency Urge Shield</Text>
            </Pressable>

            <Pressable
              style={styles.winButton}
              onPress={() => commitState(markUrgeVictory(appStateRef.current))}
            >
              <Text style={styles.winButtonText}>I beat the urge</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>Danger Pattern Radar</Text>
              <Text
                style={[
                  styles.statusPill,
                  radar.riskBadge === "RISK HOUR NOW" && styles.statusPillAlert,
                ]}
              >
                {radar.riskBadge}
              </Text>
            </View>
            <Text style={styles.sectionTitle}>The app learns your weak hours</Text>
            <Text style={styles.sectionCopy}>{radar.insight}</Text>

            <View style={styles.gitaCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.eyebrow}>Bhagavad Gita</Text>
                <Pressable
                  style={styles.smallButton}
                  onPress={() => commitState(cycleGitaVerse(appStateRef.current))}
                >
                  <Text style={styles.smallButtonText}>New verse</Text>
                </Pressable>
              </View>
              <Text style={styles.gitaQuote}>{radar.gitaCard.line}</Text>
              <Text style={styles.gitaMeta}>{radar.gitaCard.verse}</Text>
              <Text style={styles.gitaPractice}>{radar.gitaCard.practice}</Text>
            </View>

            <View style={styles.riskList}>
              {radar.rankedHours.length === 0 ? (
                <Text style={styles.emptyText}>
                  Press Emergency Shield or save a trigger log to start training
                  the radar.
                </Text>
              ) : (
                radar.rankedHours.map((bucket) => (
                  <View key={bucket.hour} style={styles.riskItem}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.riskTitle}>{bucket.window}</Text>
                      <Text style={styles.riskMeta}>{bucket.count} signals</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.max(
                              14,
                              Math.round(
                                (bucket.count / radar.rankedHours[0].count) * 100
                              )
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>Focus Timer</Text>
              <Text style={styles.statusPill}>
                {appState.focus.selectedMinutes} MIN
              </Text>
            </View>
            <Text style={styles.timerText}>
              {formatCountdown(appState.focus.remainingSeconds)}
            </Text>
            <Text style={styles.sectionCopy}>{radar.coachPlan}</Text>

            <View style={styles.presetRow}>
              {FOCUS_PRESETS.map((minutes) => (
                <Pressable
                  key={minutes}
                  style={[
                    styles.presetChip,
                    appState.focus.selectedMinutes === minutes &&
                      styles.presetChipActive,
                  ]}
                  onPress={() =>
                    commitState(updateFocusPreset(appStateRef.current, minutes))
                  }
                >
                  <Text style={styles.presetChipText}>{minutes}m</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.dualRow}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => commitState(startFocus(appStateRef.current))}
              >
                <Text style={styles.primaryButtonText}>Start</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => commitState(pauseFocus(appStateRef.current))}
              >
                <Text style={styles.secondaryButtonText}>Pause</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => commitState(resetFocus(appStateRef.current))}
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>{LOCK_DAYS}-Day Lock Vault</Text>
              <Text style={[styles.statusPill, shieldActive && styles.statusPillSafe]}>
                {shieldActive ? "SHIELD ON" : "STANDBY"}
              </Text>
            </View>
            <Text style={styles.sectionTitle}>Block the sites that pull you down</Text>
            <Text style={styles.sectionCopy}>
              Mobile app version stores your lock rules locally and removes them
              only after {LOCK_DAYS} days. A native iOS content blocker target is
              still needed for true Safari-wide enforcement.
            </Text>

            <TextInput
              value={domainInput}
              onChangeText={setDomainInput}
              placeholder="example.com"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.textInput}
            />

            <Pressable style={styles.primaryButton} onPress={handleLockDomain}>
              <Text style={styles.primaryButtonText}>Lock domain for 21 days</Text>
            </Pressable>

            <View style={styles.lockList}>
              {activeLocks.slice(0, MAX_LOCKS_VISIBLE).map((lock) => (
                <View key={lock.id} style={styles.lockItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lockDomain}>{lock.domain}</Text>
                    <Text style={styles.lockMeta}>{lock.source}</Text>
                  </View>
                  <Text style={styles.lockDays}>
                    {Math.max(
                      1,
                      Math.ceil((lock.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
                    )}
                    d
                  </Text>
                </View>
              ))}
              {activeLocks.length === 0 && (
                <Text style={styles.emptyText}>
                  No domains locked yet. If an urge appears, press Emergency
                  Shield immediately.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>Goal System</Text>
              <Text style={styles.statusPill}>
                {topGoals.filter((goal) => goal.completed).length} DONE
              </Text>
            </View>
            <Text style={styles.sectionTitle}>Keep your real mission visible</Text>

            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Add one goal worth protecting"
              placeholderTextColor="#64748B"
              style={styles.textInput}
            />

            <Pressable style={styles.primaryButton} onPress={handleAddGoal}>
              <Text style={styles.primaryButtonText}>Add goal</Text>
            </Pressable>

            {topGoals.map((goal) => (
              <Pressable
                key={goal.id}
                style={styles.goalItem}
                onPress={() => commitState(toggleGoal(appStateRef.current, goal.id))}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.goalTitle,
                      goal.completed && styles.goalCompleted,
                    ]}
                  >
                    {goal.title}
                  </Text>
                  <Text style={styles.goalMeta}>
                    {goal.horizon} | {goal.area}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.statusPill,
                    goal.completed ? styles.statusPillSafe : styles.statusPillAlert,
                  ]}
                >
                  {goal.completed ? "DONE" : "ACTIVE"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.eyebrow}>Trigger Journal</Text>
              <Text style={styles.statusPill}>{appState.journal.length} LOGS</Text>
            </View>
            <Text style={styles.sectionTitle}>Turn patterns into data</Text>

            <TextInput
              value={journalContext}
              onChangeText={setJournalContext}
              placeholder="Trigger context: late night, stress, loneliness..."
              placeholderTextColor="#64748B"
              style={styles.textInput}
            />

            <View style={styles.chipRow}>
              {MOODS.map((mood) => (
                <Pressable
                  key={mood}
                  style={[
                    styles.filterChip,
                    selectedMood === mood && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedMood(mood)}
                >
                  <Text style={styles.filterChipText}>{mood}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.chipRow}>
              {[3, 5, 7, 9].map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.filterChip,
                    selectedIntensity === level && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedIntensity(level)}
                >
                  <Text style={styles.filterChipText}>{level}/10</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              value={journalResponse}
              onChangeText={setJournalResponse}
              placeholder="What did you do instead?"
              placeholderTextColor="#64748B"
              multiline
              style={[styles.textInput, styles.multilineInput]}
            />

            <Pressable style={styles.primaryButton} onPress={handleJournalSave}>
              <Text style={styles.primaryButtonText}>Save trigger log</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={handleSlipReset}>
              <Text style={styles.secondaryButtonText}>Log slip without shame</Text>
            </Pressable>

            {(appState.journal || []).slice(0, 4).map((entry) => (
              <View key={entry.id} style={styles.journalItem}>
                <Text style={styles.goalTitle}>{entry.context}</Text>
                <Text style={styles.goalMeta}>
                  {entry.mood} | {entry.intensity}/10 | {entry.response}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 18,
  },
  heroCard: {
    padding: 24,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.18)",
    backgroundColor: "#1E0B15",
  },
  eyebrow: {
    color: "#C4B5FD",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 52,
    lineHeight: 50,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: -2.8,
  },
  heroCopy: {
    marginTop: 14,
    color: "#E2E8F0",
    lineHeight: 24,
    fontSize: 14,
  },
  metricsRow: {
    marginTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  metricLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    marginTop: 8,
    color: TEXT,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.8,
  },
  emergencyButton: {
    marginTop: 20,
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: RED,
    alignItems: "center",
  },
  emergencyButtonText: {
    color: "#FFF7ED",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  winButton: {
    marginTop: 12,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  winButtonText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
  },
  sectionCard: {
    padding: 22,
    borderRadius: 32,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: MUTED,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  statusPillAlert: {
    color: "#FED7AA",
    backgroundColor: "rgba(249,115,22,0.16)",
  },
  statusPillSafe: {
    color: "#99F6E4",
    backgroundColor: "rgba(20,184,166,0.14)",
  },
  sectionTitle: {
    marginTop: 14,
    color: TEXT,
    fontSize: 34,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -2,
  },
  sectionCopy: {
    marginTop: 12,
    color: MUTED,
    fontSize: 14,
    lineHeight: 22,
  },
  gitaCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 26,
    backgroundColor: "#140F2A",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },
  gitaQuote: {
    marginTop: 14,
    color: TEXT,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  gitaMeta: {
    marginTop: 12,
    color: "#C4B5FD",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  gitaPractice: {
    marginTop: 12,
    color: "#DBEAFE",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  smallButtonText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "800",
  },
  riskList: {
    marginTop: 16,
    gap: 12,
  },
  riskItem: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: SURFACE_2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  riskTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  riskMeta: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },
  progressTrack: {
    marginTop: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: PURPLE,
  },
  timerText: {
    marginTop: 18,
    color: TEXT,
    fontSize: 68,
    lineHeight: 72,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -4,
  },
  presetRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  presetChipActive: {
    backgroundColor: "rgba(139,92,246,0.24)",
    borderColor: "rgba(139,92,246,0.5)",
  },
  presetChipText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "900",
  },
  dualRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    marginTop: 14,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  secondaryButton: {
    flex: 1,
    marginTop: 14,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
  },
  textInput: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  lockList: {
    marginTop: 16,
    gap: 12,
  },
  lockItem: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: SURFACE_2,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lockDomain: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  lockMeta: {
    marginTop: 6,
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },
  lockDays: {
    color: "#99F6E4",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  goalItem: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: SURFACE_2,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  goalTitle: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    letterSpacing: -0.5,
  },
  goalCompleted: {
    opacity: 0.45,
    textDecorationLine: "line-through",
  },
  goalMeta: {
    marginTop: 6,
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
  chipRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(6,182,212,0.18)",
    borderColor: "rgba(6,182,212,0.4)",
  },
  filterChipText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
  },
  journalItem: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: SURFACE_2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
  },
});
