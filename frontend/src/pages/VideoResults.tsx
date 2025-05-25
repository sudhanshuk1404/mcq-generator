import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const VideoResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [segments, setSegments] = useState<string[]>([]);
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [edited, setEdited] = useState<any>({
    question: "",
    options: [],
    answer: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const videoRes = await axios.get(
        `http://localhost:3000/api/videos/${id}`
      );
      const mcqRes = await axios.get(`http://localhost:3000/api/mcqs/${id}`);
      setSegments(videoRes.data.segments);
      setMcqs(mcqRes.data.mcqs);
    };
    fetchData();
  }, [id]);

  const handleExportCSV = () => {
    const csvRows = [
      ["Question", "Option A", "Option B", "Option C", "Option D", "Answer"],
      ...mcqs.map((mcq) => [
        mcq.question,
        mcq.options?.[0] || "",
        mcq.options?.[1] || "",
        mcq.options?.[2] || "",
        mcq.options?.[3] || "",
        mcq.answer || "",
      ]),
    ];

    const csvContent = csvRows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "mcqs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableData = mcqs.map((mcq, index) => [
      index + 1,
      mcq.question,
      mcq.options?.[0] || "",
      mcq.options?.[1] || "",
      mcq.options?.[2] || "",
      mcq.options?.[3] || "",
      mcq.answer,
    ]);

    autoTable(doc, {
      head: [["#", "Question", "A", "B", "C", "D", "Answer"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save("mcqs.pdf");
  };

  const handleSave = async (mcqId: string, index: number) => {
    try {
      await axios.patch(`http://localhost:3000/api/mcqs/${mcqId}`, edited);
      const updated = [...mcqs];
      updated[index] = { ...updated[index], ...edited };
      setMcqs(updated);
      setEditingIndex(null);
      setEdited({ question: "", options: [], answer: "" });
    } catch (err) {
      console.error("❌ Save error", err);
    }
  };

  return (
    <div
      className="min-h-screen w-screen"
      style={{
        backgroundImage: 'url("/image.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-0" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 bg-white/30 backdrop-blur-md shadow-md border-b border-white/30">
        <h1 className="text-xl font-semibold text-white tracking-wide">
          🎓 EduTranscribe
        </h1>
        <Button variant="outline" onClick={() => navigate("/")}>
          ⬅ Back to Upload
        </Button>
      </nav>

      <div className="relative z-10 p-6 max-w-6xl mx-auto text-black">
        <h2 className="text-2xl font-bold mb-4">
          📄 Transcript & Editable MCQs
        </h2>

        <div className="flex gap-4 mb-4">
          <Button variant="outline" onClick={handleExportCSV}>
            Download CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            Download PDF
          </Button>
        </div>

        <Card className="p-6 bg-white/90 max-h-[80vh] overflow-y-auto space-y-6">
          {segments.map((segment, sIndex) => (
            <div key={sIndex}>
              <h3 className="font-semibold mb-2">Segment {sIndex + 1}</h3>
              <p className="mb-4">{segment}</p>

              {mcqs
                .filter((q) => q.segmentIndex === sIndex)
                .map((q, i) => {
                  const index = mcqs.findIndex((m) => m._id === q._id);
                  const isEditing = editingIndex === index;

                  return (
                    <div
                      key={q._id}
                      className="mb-4 border p-3 rounded-md bg-white"
                    >
                      {isEditing ? (
                        <>
                          <Input
                            value={edited.question || q.question}
                            onChange={(e) =>
                              setEdited({
                                ...edited,
                                question: e.target.value,
                              })
                            }
                            className="mb-2"
                          />
                          {(q.options || []).map((opt: string, j: number) => (
                            <Input
                              key={j}
                              value={edited.options?.[j] || opt}
                              onChange={(e) => {
                                const newOpts = [
                                  ...(edited.options || q.options || []),
                                ];
                                newOpts[j] = e.target.value;
                                setEdited({ ...edited, options: newOpts });
                              }}
                              className="mb-1"
                            />
                          ))}
                          <Input
                            placeholder="Correct answer"
                            value={edited.answer || q.answer}
                            onChange={(e) =>
                              setEdited({ ...edited, answer: e.target.value })
                            }
                            className="mb-2"
                          />
                          <Button onClick={() => handleSave(q._id, index)}>
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">{q.question}</p>
                          <ul className="list-disc ml-6">
                            {(q.options || []).map((opt: string, j: number) => (
                              <li key={j}>{opt}</li>
                            ))}
                          </ul>
                          <p className="text-sm text-green-700 mt-1">
                            ✅ Answer: {q.answer}
                          </p>
                          <Button
                            variant="outline"
                            className="mt-2"
                            onClick={() => {
                              setEditingIndex(index);
                              setEdited({
                                question: q.question,
                                options: q.options,
                                answer: q.answer,
                              });
                            }}
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default VideoResults;
