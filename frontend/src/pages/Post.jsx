import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import {
  Send,
  Loader2,
  Image,
  Bold,
  Italic,
  Link as LinkIcon,
  Sparkles,
  Wand2,
  X,
  RefreshCw,
  CheckCheck,
  Zap,
} from "lucide-react";
import PostCard from "../components/Postcard.jsx";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import { generatePost } from "../utils/aiService.js";

const MAX_CHARS = 280;

function Post({ islogin, id, toast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const loaderRef = useRef(null);
  const [hasmore, sethasmore] = useState(true);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(undefined);
  const [isPosting, setIsPosting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: "", message: "" });

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [aiUsed, setAiUsed] = useState(false);

  const showToast = (type, message) => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Link,
      CharacterCount.configure({ limit: MAX_CHARS }),
    ],
    content: "",
    onUpdate({ editor }) { setContent(editor.getText()); },
    editorProps: {
      attributes: {
        class: "outline-none w-full min-h-[80px] text-[15px] leading-relaxed",
        "data-placeholder": "What's on your mind?",
      },
    },
  });

  async function fetchPost(cursor) {
    if (!hasmore || loading) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/post`, {
        params: { cursor },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      const { dataf: newPosts, hasmore: more, cursorb } = res.data;
      if (!cursor) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);
      sethasmore(more);
      setCursor(cursorb);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { fetchPost(undefined); }, []);

  useEffect(() => {
    if (!hasmore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !loading) fetchPost(cursor); },
      { threshold: 0.5 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasmore, loading, cursor]);

  async function handleCreatePost() {
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("postcontent", content);
    if (!content.trim() && !selectedFile) { showToast("error", "Add some content or an image"); return; }
    setIsPosting(true);
    try {
      const data = await axios.post(`${import.meta.env.VITE_API_URL}/post`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null); setPreviewUrl(null); setContent(""); editor?.commands.setContent(""); setAiResult(null); setAiUsed(false);
      if (data?.data?.flag) {
        showToast("success", "Post created successfully!");
        setCursor(undefined); sethasmore(true); setPosts([]); fetchPost(undefined);
      }
    } catch { showToast("error", "Failed to create post."); navigate("/login"); }
    finally { setIsPosting(false); }
  }

  async function handleGenerate() {
    if (!aiPrompt.trim()) { setAiError("Please enter a keyword or prompt first."); return; }
    setAiError(null); setAiResult(null); setAiGenerating(true);
    try {
      const text = await generatePost(aiPrompt.trim());
      setAiResult(text);
    } catch (err) {
      setAiError(err.message || "Something went wrong.");
    } finally { setAiGenerating(false); }
  }

  function handleUseAiPost() {
    if (!aiResult || !editor) return;
    editor.commands.setContent(aiResult);
    setContent(aiResult); setAiUsed(true);
    document.getElementById("post-editor-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("success", "AI post loaded into editor!");
  }

  function handleClearAi() { setAiPrompt(""); setAiResult(null); setAiError(null); setAiUsed(false); }

  const Filechange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => { setSelectedFile(null); setPreviewUrl(null); };

  if (!editor) return null;

  const count = editor.storage.characterCount.characters();
  const pct = count / MAX_CHARS;

  return (
    <>
      {showAlert && (
        <Alert type={alertConfig.type} message={alertConfig.message} onClose={() => setShowAlert(false)} duration={3000} />
      )}
      <Navbar />

      <div className="page-content py-8 px-4" style={{ background: "var(--bg-base)" }}>
        {/* Subtle bg blobs */}
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full"
            style={{ background: "rgba(99,102,241,0.04)", filter: "blur(80px)" }} />
        </div>

        <div className="max-w-2xl mx-auto space-y-5">

          {/* ── AI Post Generator ─────────────────────────────────────── */}
          <div
            className="relative rounded-2xl p-5 space-y-4 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.2) 50%, rgba(6,182,212,0.15) 100%)",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            {/* Glow accents */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "rgba(168,85,247,0.15)", filter: "blur(40px)" }} />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: "rgba(99,102,241,0.15)", filter: "blur(40px)" }} />

            {/* Header */}
            <div className="flex items-center gap-3 relative">
              <div
                className="p-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              >
                <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">AI Post Generator</h2>
                <p className="text-indigo-200 text-xs mt-0.5">Type a keyword or idea — AI crafts your post ✨</p>
              </div>
            </div>

            {/* Input row */}
            <div className="relative flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => { setAiPrompt(e.target.value); setAiError(null); }}
                onKeyDown={(e) => e.key === "Enter" && !aiGenerating && handleGenerate()}
                placeholder="e.g. motivation, tech news, travel tips…"
                aria-label="AI post prompt"
                className="w-full sm:flex-1 px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
              />
              <button
                onClick={handleGenerate}
                disabled={aiGenerating || !aiPrompt.trim()}
                aria-label="Generate AI post"
                className="flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-3 rounded-xl hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg text-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white w-full sm:w-auto"
              >
                {aiGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Generating…</>
                ) : (
                  <><Wand2 className="w-4 h-4" aria-hidden="true" />Generate</>
                )}
              </button>
            </div>

            {/* Error */}
            {aiError && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl text-red-200 text-sm"
                style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}
                role="alert"
              >
                <X className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{aiError}</span>
              </div>
            )}

            {/* Result */}
            {aiResult && (
              <div className="space-y-2">
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Generated — click to use</p>
                <button
                  onClick={handleUseAiPost}
                  className="w-full text-left bg-white rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ border: "2px solid transparent" }}
                  onMouseEnter={(e) => (e.target.style.borderColor = "#a855f7")}
                  onMouseLeave={(e) => (e.target.style.borderColor = "transparent")}
                >
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{aiResult}</p>
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
                    <span className="text-xs text-gray-400">{aiResult.length}/{MAX_CHARS} chars</span>
                    <span className="text-xs font-semibold text-purple-600">Click to use →</span>
                  </div>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={aiGenerating}
                    className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Regenerate
                  </button>
                  <button
                    onClick={handleClearAi}
                    className="flex items-center gap-1.5 text-indigo-200 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" /> Clear
                  </button>
                </div>
              </div>
            )}

            {/* Shimmer skeleton while generating */}
            {aiGenerating && !aiResult && (
              <div className="space-y-2 animate-pulse">
                {[100, 80, 65].map((w, i) => (
                  <div key={i} className="h-3.5 rounded-lg" style={{ width: `${w}%`, background: "rgba(255,255,255,0.15)" }} />
                ))}
              </div>
            )}
          </div>

          {/* ── Create Post Editor ────────────────────────────────────── */}
          <div
            id="post-editor-card"
            className="rounded-2xl p-5 space-y-4 transition-all duration-500"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: aiUsed
                ? "1px solid rgba(168,85,247,0.5)"
                : "1px solid rgba(255,255,255,0.07)",
              boxShadow: aiUsed ? "0 0 30px rgba(168,85,247,0.1)" : "none",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Post</h2>
              {aiUsed && (
                <span
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-purple-300"
                  style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)" }}
                >
                  <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" /> AI-generated
                </span>
              )}
            </div>

            {/* Editor area */}
            <div
              className="rounded-xl p-4 transition-all"
              style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            >
              <EditorContent editor={editor} />

              {/* Image preview */}
              {previewUrl && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    width={200}
                    style={{ borderRadius: "10px", maxWidth: "200px" }}
                    className="block"
                  />
                  <button
                    onClick={removeImage}
                    aria-label="Remove image"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div
                className="flex justify-between items-center mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex gap-1">
                  {[
                    {
                      icon: Bold, label: "Bold",
                      action: () => editor.chain().focus().toggleBold().run(),
                      isActive: editor.isActive("bold"),
                    },
                    {
                      icon: Italic, label: "Italic",
                      action: () => editor.chain().focus().toggleItalic().run(),
                      isActive: editor.isActive("italic"),
                    },
                    {
                      icon: LinkIcon, label: "Add Link",
                      action: () => {
                        const url = prompt("Enter URL");
                        if (url) editor.chain().focus().setLink({ href: url }).run();
                      },
                      isActive: false,
                    },
                  ].map(({ icon: Icon, label, action, isActive }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={action}
                      aria-label={label}
                      className={`p-2 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isActive
                          ? "text-indigo-400 bg-indigo-500/20"
                          : "text-slate-400 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </button>
                  ))}

                  <label
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500"
                    aria-label="Attach image"
                  >
                    <Image className="w-4 h-4" aria-hidden="true" />
                    <input type="file" accept="image/*" onChange={Filechange} className="sr-only" />
                  </label>
                </div>

                {/* Char counter */}
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20" aria-hidden="true">
                    <circle cx="10" cy="10" r="8" fill="none" strokeWidth="2" stroke="rgba(255,255,255,0.1)" />
                    <circle
                      cx="10" cy="10" r="8" fill="none" strokeWidth="2"
                      stroke={pct > 0.9 ? "#ef4444" : pct > 0.75 ? "#f59e0b" : "#6366f1"}
                      strokeDasharray={`${pct * 50.27} 50.27`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    className={`text-xs font-medium ${
                      count > MAX_CHARS ? "text-red-400" : count > MAX_CHARS * 0.8 ? "text-yellow-400" : "text-slate-500"
                    }`}
                  >
                    {MAX_CHARS - count}
                  </span>
                </div>
              </div>
            </div>

            <button
              disabled={(!content.trim() && !selectedFile) || isPosting}
              onClick={handleCreatePost}
              className="btn-primary w-full py-3 rounded-xl flex justify-center items-center gap-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isPosting ? (
                <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Posting…</>
              ) : (
                <><Send className="w-4 h-4" aria-hidden="true" />Post</>
              )}
            </button>
          </div>

          {/* ── Feed ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} IsHoveCard />
            ))}
          </div>

          {/* Loader */}
          {hasmore && (
            <div ref={loaderRef} className="h-14 flex items-center justify-center" aria-live="polite">
              {loading && (
                <div
                  className="w-8 h-8 rounded-full animate-spin"
                  style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }}
                />
              )}
            </div>
          )}

          {/* End of feed */}
          {!hasmore && posts.length > 0 && (
            <div className="glass-card p-6 text-center space-y-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(99,102,241,0.1)" }}
              >
                <Zap className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              </div>
              <p className="text-white font-semibold">You're all caught up!</p>
              <p className="text-slate-500 text-sm">No more posts available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Post;
