/* pages/pathfinder.tsx */
import React, { useState } from "react";
import Head from "next/head";
import AuthGuard from "../components/AuthGuard"; // adjust if your path is different
import { apiFetch } from "../apiClient"; // same helper you use on jobs pages

type Importance = "low" | "medium" | "high";

type CitySize = "big_city" | "medium_city" | "small_town" | "rural" | "no_preference";
type WorkSetting =
  | "office"
  | "lab"
  | "outdoors"
  | "hospital_clinic"
  | "school"
  | "shop_or_factory"
  | "remote"
  | "mixed"
  | "no_preference";

type Stage =
  | "middle_school"
  | "high_school"
  | "college"
  | "gap_year"
  | "early_career"
  | "other";

interface PathfinderFormData {
  // 1) Basic profile
  stage: Stage;
  ageRange: "13-15" | "16-18" | "19-22" | "23+";
  country: string;
  region: string;

  // 2) Life & location preferences
  dreamCountriesToLiveIn: string; // comma-separated in UI, we'll split
  preferredCitySize: CitySize;
  wantsToStayNearFamily: boolean;
  canRelocateForStudyOrWork: boolean;
  preferredWorkSetting: WorkSetting;
  preferredWorkTravelLevel: "no_travel" | "some_travel" | "frequent_travel";

  // 3) School / academic side
  favoriteSubjects: string;
  leastFavoriteSubjects: string;
  strongestSubjects: string;
  weakestSubjects: string;

  mathComfort: number;
  scienceComfort: number;
  readingWritingComfort: number;
  dealingWithPeopleComfort: number;

  // 4) Personal interests & “what I love”
  interestClusters: string; // comma-separated tags
  hobbiesFreeText: string; // comma-separated
  topThreeThingsILoveDoing: string; // comma-separated
  thingsIDontWantInAFutureJob: string; // comma-separated

  // 5) Personal style / priorities
  softSkills: string; // comma-separated
  energyStyle: "introvert" | "ambivert" | "extrovert" | "unsure";
  likesWorking: "alone" | "in_small_teams" | "in_big_groups" | "no_preference";
  decisionMakingStyle:
    | "practical_and_safe"
    | "bold_and_experimental"
    | "somewhere_in_between"
    | "unsure";

  // 6) Priorities & constraints
  salaryImportance: Importance;
  impactImportance: Importance;
  stabilityImportance: Importance;
  creativityImportance: Importance;
  budgetLevelForStudy: Importance;
  openToScholarshipsAndSideWork: boolean;

  // 7) Free text
  freeTextGoals: string;
  freeTextConcerns: string;
}

interface PathfinderMajorSuggestion {
  field: string;
  confidence: "low" | "medium" | "high";
  whyFit: string;
  exampleCareers: {
    title: string;
    description: string;
  }[];
  studyPlan: {
    highSchool?: string[];
    university?: string[];
  };
  onlineCourseTopics: string[];
  actionChecklist6to12Months: string[];
}

interface PathfinderRecommendation {
  topMajors: PathfinderMajorSuggestion[];
  globalNotes: string;
  safetyDisclaimer: string;
}

const initialForm: PathfinderFormData = {
  stage: "high_school",
  ageRange: "16-18",
  country: "",
  region: "",

  dreamCountriesToLiveIn: "",
  preferredCitySize: "no_preference",
  wantsToStayNearFamily: true,
  canRelocateForStudyOrWork: true,
  preferredWorkSetting: "no_preference",
  preferredWorkTravelLevel: "some_travel",

  favoriteSubjects: "",
  leastFavoriteSubjects: "",
  strongestSubjects: "",
  weakestSubjects: "",

  mathComfort: 3,
  scienceComfort: 3,
  readingWritingComfort: 3,
  dealingWithPeopleComfort: 3,

  interestClusters: "",
  hobbiesFreeText: "",
  topThreeThingsILoveDoing: "",
  thingsIDontWantInAFutureJob: "",

  softSkills: "",
  energyStyle: "unsure",
  likesWorking: "no_preference",
  decisionMakingStyle: "somewhere_in_between",

  salaryImportance: "medium",
  impactImportance: "medium",
  stabilityImportance: "medium",
  creativityImportance: "medium",
  budgetLevelForStudy: "medium",
  openToScholarshipsAndSideWork: true,

  freeTextGoals: "",
  freeTextConcerns: "",
};

const PathfinderPage: React.FC = () => {
  const [form, setForm] = useState<PathfinderFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PathfinderRecommendation | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setForm((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
      return;
    }

    if (type === "range" || type === "number") {
      setForm((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Transform comma-separated fields into arrays
      const body = {
        stage: form.stage,
        ageRange: form.ageRange,
        country: form.country,
        region: form.region || undefined,

        dreamCountriesToLiveIn: form.dreamCountriesToLiveIn
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        preferredCitySize: form.preferredCitySize,
        wantsToStayNearFamily: form.wantsToStayNearFamily,
        canRelocateForStudyOrWork: form.canRelocateForStudyOrWork,
        preferredWorkSetting: form.preferredWorkSetting,
        preferredWorkTravelLevel: form.preferredWorkTravelLevel,

        favoriteSubjects: form.favoriteSubjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        leastFavoriteSubjects: form.leastFavoriteSubjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        strongestSubjects: form.strongestSubjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        weakestSubjects: form.weakestSubjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),

        mathComfort: form.mathComfort,
        scienceComfort: form.scienceComfort,
        readingWritingComfort: form.readingWritingComfort,
        dealingWithPeopleComfort: form.dealingWithPeopleComfort,

        interestClusters: form.interestClusters
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hobbiesFreeText: form.hobbiesFreeText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        topThreeThingsILoveDoing: form.topThreeThingsILoveDoing
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        thingsIDontWantInAFutureJob: form.thingsIDontWantInAFutureJob
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),

        softSkills: form.softSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        energyStyle: form.energyStyle,
        likesWorking: form.likesWorking,
        decisionMakingStyle: form.decisionMakingStyle,

        salaryImportance: form.salaryImportance,
        impactImportance: form.impactImportance,
        stabilityImportance: form.stabilityImportance,
        creativityImportance: form.creativityImportance,
        budgetLevelForStudy: form.budgetLevelForStudy,
        openToScholarshipsAndSideWork: form.openToScholarshipsAndSideWork,

        freeTextGoals: form.freeTextGoals || undefined,
        freeTextConcerns: form.freeTextConcerns || undefined,
      };

      // Use the same apiFetch helper as in other files
      const response = await apiFetch("/api/pathfinder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate path");
      }

      const data = await response.json();
      setResult(data.recommendation || data);
    } catch (err: any) {
      console.error("Error submitting pathfinder:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthGuard>
      <Head>
        <title>YPropelAI – Path Finder</title>
      </Head>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          YPropelAI Path Finder
        </h1>
        <p style={{ marginBottom: "1.5rem", color: "#555" }}>
          Tell us about what you love, what you&apos;re good at, and how you want your life to look.
          YPropelAI will suggest majors and a simple action plan. This is a starting point, not a
          final decision.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
          {/* Section: Basic profile */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>1. About you</h2>
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div>
                <label>Stage</label>
                <select name="stage" value={form.stage} onChange={handleChange} style={{ width: "100%" }}>
                  <option value="middle_school">Middle school</option>
                  <option value="high_school">High school</option>
                  <option value="college">College</option>
                  <option value="gap_year">Gap year</option>
                  <option value="early_career">Early career</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label>Age range</label>
                <select name="ageRange" value={form.ageRange} onChange={handleChange} style={{ width: "100%" }}>
                  <option value="13-15">13–15</option>
                  <option value="16-18">16–18</option>
                  <option value="19-22">19–22</option>
                  <option value="23+">23+</option>
                </select>
              </div>

              <div>
                <label>Country you live in now</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label>City / state / region (optional)</label>
                <input
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </section>

          {/* Section: Life & location */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
              2. Life & location preferences
            </h2>
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <label>Dream countries to live in (comma-separated)</label>
                <input
                  name="dreamCountriesToLiveIn"
                  value={form.dreamCountriesToLiveIn}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="USA, Germany, Japan"
                />
              </div>

              <div>
                <label>Preferred city size</label>
                <select
                  name="preferredCitySize"
                  value={form.preferredCitySize}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="no_preference">No preference</option>
                  <option value="big_city">Big city</option>
                  <option value="medium_city">Medium city</option>
                  <option value="small_town">Small town</option>
                  <option value="rural">Rural</option>
                </select>
              </div>

              <div>
                <label>Preferred work setting</label>
                <select
                  name="preferredWorkSetting"
                  value={form.preferredWorkSetting}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="no_preference">No preference</option>
                  <option value="office">Office</option>
                  <option value="lab">Lab</option>
                  <option value="outdoors">Outdoors</option>
                  <option value="hospital_clinic">Hospital / clinic</option>
                  <option value="school">School</option>
                  <option value="shop_or_factory">Shop / factory</option>
                  <option value="remote">Remote</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label>How much travel in your future job?</label>
                <select
                  name="preferredWorkTravelLevel"
                  value={form.preferredWorkTravelLevel}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="no_travel">Almost no travel</option>
                  <option value="some_travel">Some travel</option>
                  <option value="frequent_travel">Frequent travel</option>
                </select>
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    name="wantsToStayNearFamily"
                    checked={form.wantsToStayNearFamily}
                    onChange={handleChange}
                    style={{ marginRight: 6 }}
                  />
                  I would like to stay near my family if possible
                </label>
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    name="canRelocateForStudyOrWork"
                    checked={form.canRelocateForStudyOrWork}
                    onChange={handleChange}
                    style={{ marginRight: 6 }}
                  />
                  I&apos;m open to relocating for study or work
                </label>
              </div>
            </div>
          </section>

          {/* Section: School / academics */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>3. School & academics</h2>
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <label>Favorite subjects (comma-separated)</label>
                <input
                  name="favoriteSubjects"
                  value={form.favoriteSubjects}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="Biology, Math"
                />
              </div>
              <div>
                <label>Least favorite subjects</label>
                <input
                  name="leastFavoriteSubjects"
                  value={form.leastFavoriteSubjects}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="History"
                />
              </div>
              <div>
                <label>Subjects you feel strongest in</label>
                <input
                  name="strongestSubjects"
                  value={form.strongestSubjects}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label>Subjects you feel weakest in</label>
                <input
                  name="weakestSubjects"
                  value={form.weakestSubjects}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Sliders */}
            <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <label>Comfort with math (1–5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  name="mathComfort"
                  value={form.mathComfort}
                  onChange={handleChange}
                />
                <div>{form.mathComfort}</div>
              </div>
              <div>
                <label>Comfort with science (1–5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  name="scienceComfort"
                  value={form.scienceComfort}
                  onChange={handleChange}
                />
                <div>{form.scienceComfort}</div>
              </div>
              <div>
                <label>Comfort with reading & writing (1–5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  name="readingWritingComfort"
                  value={form.readingWritingComfort}
                  onChange={handleChange}
                />
                <div>{form.readingWritingComfort}</div>
              </div>
              <div>
                <label>Comfort dealing with people (1–5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  name="dealingWithPeopleComfort"
                  value={form.dealingWithPeopleComfort}
                  onChange={handleChange}
                />
                <div>{form.dealingWithPeopleComfort}</div>
              </div>
            </div>
          </section>

          {/* Section: What you love */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>4. What you love & don&apos;t love</h2>
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <label>Interest areas (comma-separated words)</label>
                <input
                  name="interestClusters"
                  value={form.interestClusters}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="tech, animals, art, business"
                />
              </div>
              <div>
                <label>Hobbies (comma-separated)</label>
                <input
                  name="hobbiesFreeText"
                  value={form.hobbiesFreeText}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="playing piano, drawing, soccer"
                />
              </div>
              <div>
                <label>Top 3 things you love doing</label>
                <input
                  name="topThreeThingsILoveDoing"
                  value={form.topThreeThingsILoveDoing}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="helping kids, fixing things, performing"
                />
              </div>
              <div>
                <label>Things you don&apos;t want in a future job</label>
                <input
                  name="thingsIDontWantInAFutureJob"
                  value={form.thingsIDontWantInAFutureJob}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="blood, constant sales pressure, night shifts"
                />
              </div>
            </div>
          </section>

          {/* Section: Personal style & priorities */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>5. Personal style & priorities</h2>
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <label>Soft skills (comma-separated)</label>
                <input
                  name="softSkills"
                  value={form.softSkills}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                  placeholder="communication, leadership, creativity"
                />
              </div>
              <div>
                <label>Energy style</label>
                <select
                  name="energyStyle"
                  value={form.energyStyle}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="unsure">Unsure</option>
                  <option value="introvert">Introvert</option>
                  <option value="ambivert">In between</option>
                  <option value="extrovert">Extrovert</option>
                </select>
              </div>
              <div>
                <label>How do you like working?</label>
                <select
                  name="likesWorking"
                  value={form.likesWorking}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="no_preference">No preference</option>
                  <option value="alone">Alone</option>
                  <option value="in_small_teams">In small teams</option>
                  <option value="in_big_groups">In big groups</option>
                </select>
              </div>
              <div>
                <label>Decision-making style</label>
                <select
                  name="decisionMakingStyle"
                  value={form.decisionMakingStyle}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="somewhere_in_between">Somewhere in between</option>
                  <option value="practical_and_safe">More practical & safe</option>
                  <option value="bold_and_experimental">More bold & experimental</option>
                  <option value="unsure">Unsure</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div>
                <label>Salary importance</label>
                <select
                  name="salaryImportance"
                  value={form.salaryImportance}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label>Impact / meaning importance</label>
                <select
                  name="impactImportance"
                  value={form.impactImportance}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label>Stability importance</label>
                <select
                  name="stabilityImportance"
                  value={form.stabilityImportance}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label>Creativity / expression importance</label>
                <select
                  name="creativityImportance"
                  value={form.creativityImportance}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label>Budget level for studies</label>
                <select
                  name="budgetLevelForStudy"
                  value={form.budgetLevelForStudy}
                  onChange={handleChange}
                  style={{ width: "100%" }}
                >
                  <option value="low">Tight budget</option>
                  <option value="medium">Medium</option>
                  <option value="high">Comfortable</option>
                </select>
              </div>
              <div>
                <label>
                  <input
                    type="checkbox"
                    name="openToScholarshipsAndSideWork"
                    checked={form.openToScholarshipsAndSideWork}
                    onChange={handleChange}
                    style={{ marginRight: 6 }}
                  />
                  I&apos;m open to scholarships / part-time work to support my studies
                </label>
              </div>
            </div>
          </section>

          {/* Section: Free text */}
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>6. Your goals & concerns</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <label>In your own words, what do you hope your future work/life looks like?</label>
                <textarea
                  name="freeTextGoals"
                  value={form.freeTextGoals}
                  onChange={handleChange}
                  style={{ width: "100%", minHeight: 80 }}
                />
              </div>
              <div>
                <label>Anything you&apos;re worried or unsure about?</label>
                <textarea
                  name="freeTextConcerns"
                  value={form.freeTextConcerns}
                  onChange={handleChange}
                  style={{ width: "100%", minHeight: 80 }}
                />
              </div>
            </div>
          </section>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: 999,
                border: "none",
                backgroundColor: "#0366d6",
                color: "white",
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Generating your path..." : "Generate my path"}
            </button>
            {error && <span style={{ color: "red" }}>{error}</span>}
          </div>
        </form>

        {/* Results */}
        {result && (
          <section style={{ marginTop: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>Suggested paths</h2>

            <p style={{ marginBottom: "1rem", color: "#555" }}>{result.globalNotes}</p>

            <div style={{ display: "grid", gap: "1rem" }}>
              {result.topMajors?.map((major, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: "1rem",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>
                    {major.field}{" "}
                    <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#666" }}>
                      ({major.confidence} match)
                    </span>
                  </h3>
                  <p style={{ marginBottom: "0.6rem" }}>{major.whyFit}</p>

                  <div style={{ marginBottom: "0.6rem" }}>
                    <strong>Example careers:</strong>
                    <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                      {major.exampleCareers?.map((c, i) => (
                        <li key={i}>
                          <strong>{c.title}:</strong> {c.description}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {major.studyPlan?.highSchool && (
                    <div style={{ marginBottom: "0.6rem" }}>
                      <strong>If you&apos;re in high school:</strong>
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {major.studyPlan.highSchool.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {major.studyPlan?.university && (
                    <div style={{ marginBottom: "0.6rem" }}>
                      <strong>If you&apos;re in college / planning college:</strong>
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {major.studyPlan.university.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {major.onlineCourseTopics?.length > 0 && (
                    <div style={{ marginBottom: "0.6rem" }}>
                      <strong>Online course topics to explore:</strong>
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {major.onlineCourseTopics.map((topic, i) => (
                          <li key={i}>{topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {major.actionChecklist6to12Months?.length > 0 && (
                    <div>
                      <strong>Action steps for the next 6–12 months:</strong>
                      <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                        {major.actionChecklist6to12Months.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#777" }}>
              {result.safetyDisclaimer}
            </p>
          </section>
        )}
      </div>
    </AuthGuard>
  );
};

export default PathfinderPage;
