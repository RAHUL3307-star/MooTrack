import React, { useState, useEffect } from "react";
import { BackHeader, Card, SectionLabel, ReadAloudFAB, RiskBadge } from "../components/ui";
import { useAnimals } from "../context/AnimalsContext";
import { fetchInterventions, logIntervention, type InterventionRecord } from "../services/interventionService";
import { t, sendWhatsAppAlert } from "../i18n/index";

export function InterventionsScreen({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: string;
}) {
  const { animals } = useAnimals();
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "in_progress" | "scheduled" | "completed">("all");

  // Modal State for logging new intervention
  const [showModal, setShowModal] = useState(false);
  const [selectedCowId, setSelectedCowId] = useState(animals[0]?.id || "KA-001");
  const [treatmentType, setTreatmentType] = useState("Iodine Barrier Teat Dip (0.5%)");
  const [performedBy, setPerformedBy] = useState("Dr. Sharma (Veterinarian)");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchInterventions();
      setInterventions(data);
    } catch (e) {
      console.warn("Failed to load interventions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCowId || !treatmentType) return;
    setSubmitting(true);
    try {
      await logIntervention(selectedCowId, treatmentType, performedBy, notes);
      // Also add to local state immediately
      const newRec: InterventionRecord = {
        id: `int-${Date.now().toString().slice(-4)}`,
        animal_id: selectedCowId,
        treatment_type: treatmentType,
        performed_by: performedBy,
        notes: notes || "Logged via MooTracker mobile portal",
        status: "in_progress",
        created_at: new Date().toISOString(),
      };
      setInterventions((prev) => [newRec, ...prev]);
      setShowModal(false);
      setNotes("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInterventions = interventions.filter((item) => {
    if (tab === "in_progress") return item.status === "in_progress";
    if (tab === "scheduled") return item.status === "scheduled";
    if (tab === "completed") return item.status === "completed";
    return true;
  });

  const getCowName = (id: string) => {
    const cow = animals.find((a) => a.id === id);
    return cow ? `${cow.name} (${cow.id})` : id;
  };

  const getCowRisk = (id: string) => {
    const cow = animals.find((a) => a.id === id);
    return cow?.risk || "none";
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#F7F4EE",
        position: "relative",
      }}
    >
      <ReadAloudFAB screen="interventions" lang={lang} />
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E0D8" }}>
        <BackHeader title={t("interventions_title", lang)} onBack={onBack} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 80px" }}>
        {/* Action Header Card */}
        <div
          style={{
            background: "linear-gradient(135deg, #1C2714 0%, #2A5C1F 100%)",
            borderRadius: 16,
            padding: "16px 18px",
            color: "#FFFFFF",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 16px rgba(42,92,31,0.2)",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A8D59D", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang === "Tamil" ? "மருத்துவ சிகிச்சை மேலாண்மை" : "Clinical Care Protocols"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              {interventions.filter((i) => i.status === "in_progress").length} Active Treatments
            </div>
            <div style={{ fontSize: 11, color: "#D1E7CC", marginTop: 2 }}>
              ICAR-NRC / NMC Standardized Care Logs
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#4ADE80",
              color: "#0F2912",
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 12,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <span>+</span>
            <span>{lang === "Tamil" ? "பதிவு செய்" : "Log Care"}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {(
            [
              { id: "all", label: "All Logs" },
              { id: "in_progress", label: "In Progress" },
              { id: "scheduled", label: "Scheduled" },
              { id: "completed", label: "Completed" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                border: "none",
                background: tab === item.id ? "#2A5C1F" : "#EBE6DC",
                color: tab === item.id ? "#FFFFFF" : "#594F40",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Timeline List of Interventions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredInterventions.map((item) => {
            const isDone = item.status === "completed";
            const isProg = item.status === "in_progress";
            const cowName = getCowName(item.animal_id);
            const cowRisk = getCowRisk(item.animal_id);

            return (
              <Card key={item.id} style={{ borderLeft: `4px solid ${isDone ? "#2E7D32" : isProg ? "#E65100" : "#0284C7"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong style={{ fontSize: 14, color: "#1C2714" }}>{cowName}</strong>
                      <RiskBadge risk={cowRisk} lang={lang} />
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#2A5C1F", marginTop: 4 }}>
                      💊 {item.treatment_type}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 6,
                      textTransform: "uppercase",
                      background: isDone ? "#E8F5E9" : isProg ? "#FFF3E0" : "#E0F2FE",
                      color: isDone ? "#2E7D32" : isProg ? "#E65100" : "#0284C7",
                    }}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>

                {item.notes && (
                  <p style={{ fontSize: 12, color: "#4A5568", background: "#F7F6F2", padding: "8px 10px", borderRadius: 8, margin: "8px 0 6px", lineHeight: 1.4 }}>
                    {item.notes}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontSize: 11, color: "#7B6F5D" }}>
                  <span>👨‍⚕️ {item.performed_by}</span>
                  <span>🕒 {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, borderTop: "1px solid #ECE7DE", paddingTop: 8 }}>
                  {!isDone && (
                    <button
                      onClick={() => {
                        setInterventions((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, status: "completed" } : i))
                        );
                      }}
                      style={{
                        flex: 1,
                        background: "#E8F5E9",
                        color: "#2E7D32",
                        border: "1px solid #C8E6C9",
                        borderRadius: 8,
                        padding: "6px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Mark Completed
                    </button>
                  )}
                  <button
                    onClick={() => {
                      sendWhatsAppAlert(
                        cowName,
                        cowRisk,
                        `Care Protocol Update: ${item.treatment_type}. Notes: ${item.notes}`,
                        "Continue monitoring and maintain post-milking teat hygiene.",
                        "Immediate",
                        lang
                      );
                    }}
                    style={{
                      flex: 1,
                      background: "#25D366",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <span>💬 Share to Vet</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Log Care Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              width: "100%",
              maxWidth: 480,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "20px 20px 30px",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.25)",
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <strong style={{ fontSize: 16, color: "#1C2714" }}>Log New Care & Intervention</strong>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#666" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIntervention} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#594F40", display: "block", marginBottom: 4 }}>
                  SELECT ANIMAL
                </label>
                <select
                  value={selectedCowId}
                  onChange={(e) => setSelectedCowId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #D0C9BE",
                    fontSize: 13,
                    background: "#FBF9F4",
                  }}
                >
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id}) - {a.risk.toUpperCase()} RISK
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#594F40", display: "block", marginBottom: 4 }}>
                  TREATMENT / PROTOCOL TYPE
                </label>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #D0C9BE",
                    fontSize: 13,
                    background: "#FBF9F4",
                  }}
                >
                  <option value="Iodine Barrier Teat Dip (0.5%)">Iodine Barrier Teat Dip (0.5%)</option>
                  <option value="California Mastitis Test (CMT)">California Mastitis Test (CMT)</option>
                  <option value="Intramammary Infusion (Vet Prescribed)">Intramammary Infusion (Vet Prescribed)</option>
                  <option value="Pen B Isolation & Disinfection">Pen B Isolation & Disinfection</option>
                  <option value="Vitamin E + Selenium Supplement">Vitamin E + Selenium Supplement</option>
                  <option value="Frequent Stripping / Post-Milking Dip">Frequent Stripping / Post-Milking Dip</option>
                  <option value="Milk Culture & Sensitivity Lab Assay">Milk Culture & Sensitivity Lab Assay</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#594F40", display: "block", marginBottom: 4 }}>
                  PERFORMED BY / ATTENDING VET
                </label>
                <input
                  type="text"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  placeholder="e.g. Dr. Sharma / Farm Attendant"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #D0C9BE",
                    fontSize: 13,
                    background: "#FBF9F4",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#594F40", display: "block", marginBottom: 4 }}>
                  CLINICAL OBSERVATIONS & NOTES
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Right-rear quarter inflamed; applied warm fomentation and iodine barrier; milk yield reduced by 2.4L."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #D0C9BE",
                    fontSize: 13,
                    background: "#FBF9F4",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: "1px solid #D0C9BE",
                    background: "#F0EBE1",
                    color: "#594F40",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1.5,
                    padding: "12px",
                    borderRadius: 10,
                    border: "none",
                    background: "#2A5C1F",
                    color: "#FFFFFF",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Saving..." : "Save Intervention"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
