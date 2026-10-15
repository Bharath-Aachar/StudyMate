
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Preferences = {
    theme: "dark" | "light";
    dailyGoal: number;
    reminders: boolean;
};

const DEFAULTS: Preferences = {
    theme: "dark",
    dailyGoal: 60,
    reminders: false,
};

const SETTINGS_KEY = "studymate-settings";

export default function SettingsPage() {
    const router = useRouter();
    const [preferences, setPreferences] =
        useState<Preferences>(DEFAULTS);
    const [ready, setReady] = useState(false);
    const [saved, setSaved] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                setPreferences({ ...DEFAULTS, ...JSON.parse(stored) });
            }
        } catch (error) {
            console.error("Could not load settings:", error);
        } finally {
            setReady(true);
        }
    }, []);

    function updatePreference<K extends keyof Preferences>(
        key: K,
        value: Preferences[K]
    ) {
        setPreferences((current) => ({
            ...current,
            [key]: value,
        }));
        setSaved(false);
    }

    function saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences));
        setSaved(true);
    }

    function resetStudyData() {
        localStorage.removeItem("studymate-courses");

        const keysToRemove: string[] = [];

        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);
            if (key?.startsWith("studymate-completed-")) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));
        sessionStorage.removeItem("studymate-active-document");

        setConfirmReset(false);
        router.push("/courses");
    }

    if (!ready) {
        return (
            <main className="min-h-screen bg-[#080b14] p-8 text-white">
                Loading settings...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#080b14] p-5 text-white sm:p-10">
            <div className="mx-auto max-w-3xl">
                <a
                    href="/"
                    className="text-sm text-blue-400 hover:text-blue-300"
                >
                    ← Dashboard
                </a>

                <div className="mt-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
                        Personalize your experience
                    </p>
                    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                        Settings
                    </h1>
                    <p className="mt-3 text-slate-400">
                        Configure your study preferences for StudyMate.
                    </p>
                </div>

                <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-lg font-semibold">Appearance</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Choose your preferred interface theme.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {(["dark", "light"] as const).map((theme) => (
                            <button
                                key={theme}
                                onClick={() => updatePreference("theme", theme)}
                                className={`rounded-xl border p-4 text-left capitalize ${preferences.theme === theme
                                        ? "border-blue-500 bg-blue-500/10 text-blue-300"
                                        : "border-white/10 text-slate-300 hover:bg-white/5"
                                    }`}
                            >
                                <span className="font-semibold">
                                    {theme === "dark" ? "🌙 Dark mode" : "☀️ Light mode"}
                                </span>
                                <p className="mt-2 text-sm text-slate-400">
                                    {theme === "dark"
                                        ? "Comfortable for low-light study."
                                        : "A brighter appearance preference."}
                                </p>
                            </button>
                        ))}
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                        Theme selection is saved as a preference. It does not
                        automatically change the app's appearance yet.
                    </p>
                </section>

                <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-lg font-semibold">Study goals</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Set how many minutes you want to study each day.
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-4">
                        <input
                            type="number"
                            min={15}
                            max={480}
                            step={15}
                            value={preferences.dailyGoal}
                            onChange={(event) =>
                                updatePreference(
                                    "dailyGoal",
                                    Math.min(480, Math.max(15, Number(event.target.value) || 15))
                                )
                            }
                            className="w-32 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                        <span className="text-sm text-slate-400">minutes per day</span>
                    </div>

                    <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 p-4">
                        <span>
                            <span className="block font-medium">Study reminders</span>
                            <span className="mt-1 block text-sm text-slate-400">
                                Save your preference for study reminders.
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            checked={preferences.reminders}
                            onChange={(event) =>
                                updatePreference("reminders", event.target.checked)
                            }
                            className="h-5 w-5 accent-blue-500"
                        />
                    </label>

                    <p className="mt-3 text-xs text-slate-500">
                        Reminders are a saved preference only; notifications are not
                        implemented in this prototype.
                    </p>
                </section>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button
                        onClick={saveSettings}
                        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500"
                    >
                        Save settings
                    </button>

                    {saved && (
                        <p className="text-sm text-emerald-400">
                            Settings saved successfully.
                        </p>
                    )}
                </div>

                <section className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
                    <h2 className="font-semibold text-red-300">Reset study data</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                        Permanently remove locally saved courses and lesson completion
                        records from this browser. This does not delete your GitHub
                        repository.
                    </p>

                    {!confirmReset ? (
                        <button
                            onClick={() => setConfirmReset(true)}
                            className="mt-5 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                        >
                            Reset study data
                        </button>
                    ) : (
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <p className="w-full text-sm text-red-300">
                                Are you sure? Your locally saved courses will be deleted.
                            </p>
                            <button
                                onClick={resetStudyData}
                                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold hover:bg-red-500"
                            >
                                Yes, delete my study data
                            </button>
                            <button
                                onClick={() => setConfirmReset(false)}
                                className="rounded-xl border border-white/10 px-5 py-3 text-sm hover:bg-white/5"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
