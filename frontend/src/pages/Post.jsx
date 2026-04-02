import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { Axis3D, InspectIcon, Send, Loader2, Image, Bold, Italic, Link as LinkIcon } from "lucide-react";
import PostCard from "../components/Postcard.jsx";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import { useSearchParams, useNavigate } from "react-router-dom";
import Alert from "../components/Alert.jsx";

const MAX_CHARS = 280;

function Post({ islogin, id, toast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const loaderRef = useRef(null);
  const [hasmore, sethasmore] = useState(true);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [flag, setflag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newpostflag, setpostflag] = useState(false);
  const [cursor, setCursor] = useState(undefined);
  const [isPosting, setIsPosting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Link,
      CharacterCount.configure({
        limit: MAX_CHARS,
      }),
    ],
    content: "",
    onUpdate({ editor }) {
      setContent(editor.getText());
    },
    editorProps: {
      attributes: {
        class: "outline-none w-full min-h-[80px] text-[15px] leading-relaxed",
      },
    },
  });

  async function fetchPost(cursor) {
    if (!hasmore || loading) return;
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/post", {
        params: {
          cursor: cursor,
        },
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { dataf: newPosts, hasmore: more, cursorb } = res.data;
      console.log(res.data);
      if (!cursor) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      sethasmore(more);
      setCursor(cursorb);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPost(undefined); // 👈 FIRST API CALL
  }, []);

  useEffect(() => {
    if (!hasmore) return;
    const observer = new IntersectionObserver((entries) => {
      console.log(entries);
      if (entries[0].isIntersecting && !loading) {
        fetchPost(cursor); // ✅ CALL API HERE
      }
    }, { threshold: 0.5 });
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [hasmore, loading, cursor]);

  async function handleCreatePost() {
    console.log(selectedFile);
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("postcontent", content);
    for (let [key, value] of fd.entries()) {
      console.log(key, value);
    }
    console.log(":->", editor.getHTML());

    if (!content.trim() && !selectedFile) {
      showToast("error", "Please add some content or an image");
      return;
    }

    setIsPosting(true);
    try {
      const data = await axios.post("http://localhost:5000/post", fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setContent("");
      editor?.commands.setContent("");
      if (data?.data?.flag) {
        showToast("success", "Post created successfully!");
        setCursor(undefined);
        sethasmore(true);
        setPosts([]);
        fetchPost(undefined);
      }
    } catch (error) {
      console.log(error);
      showToast("error", "Failed to create post. Please try again.");
      navigate("/login");
    } finally {
      setIsPosting(false);
    }
  }

  if (!editor) return null;

  const count = editor.storage.characterCount.characters();

  const Filechange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <>
      {showAlert && (
        <Alert
          type={alertConfig.type}
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          duration={3000}
        />
      )}
      <Navbar />
      {/* {loading && <div>Loading ........</div>} */}
      <div className="min-h-screen bg-gray-50 py-8 px-4 md:ml-[260px]">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* CREATE POST */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Post
            </h2>

            {/* EDITOR */}
            <div className="border-2 border-gray-100 rounded-xl p-4 bg-white focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-100 transition-all">
              <EditorContent editor={editor} />
              {previewUrl && (
                <div
                  style={{ marginTop: "10px" }}
                  className="relative inline-block"
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: "200px", borderRadius: "8px" }}
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {/* FOOTER */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                {/* ACTIONS */}
                <div className="flex gap-1">
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded-lg transition-colors ${
                      editor.isActive("bold")
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded-lg transition-colors ${
                      editor.isActive("italic")
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const url = prompt("Enter link");
                      if (url)
                        editor.chain().focus().setLink({ href: url }).run();
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                    title="Add Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>

                  <label className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer">
                    <Image className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={Filechange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* CHARACTER COUNT */}
                <div
                  className={`text-sm font-medium ${
                    count > MAX_CHARS
                      ? "text-red-500"
                      : count > MAX_CHARS * 0.8
                        ? "text-yellow-500"
                        : "text-gray-500"
                  }`}
                >
                  {count}/{MAX_CHARS}
                </div>
              </div>
            </div>

            <button
              disabled={(!content.trim() && !selectedFile) || isPosting}
              onClick={handleCreatePost}
              className="w-full bg-gray-900 text-white py-3 rounded-xl flex justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-all font-medium shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>

          {posts.map((post) => (
            <PostCard key={post._id} post={post} IsHoveCard={true} />
          ))}
          {/* {posts.map((post) => (  
            <PostCard key={post._id} post={post} currentUserId={post.author} />
          ))} */}
          {hasmore && (
            <div
              ref={loaderRef}
              className="h-10 flex items-center justify-center"
            >
              {loading && (
                <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          )}
          {!hasmore && posts.length > 0 && (
            <div className="bg-white p-5 rounded-xl shadow space-y-4 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Axis3D className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No More Posts Available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Post;
