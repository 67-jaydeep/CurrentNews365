import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  TrendingUp,
  Star,
  Loader2,
  BarChart3,
  CalendarDays,
  Clock,
  Tag,
} from "lucide-react";
import api from "../api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topPosts, setTopPosts] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/auth/summary");
        setData(res.data);

        const postsRes = await api.get("/admin/posts");
        const posts = postsRes.data;
        setRecentPosts(posts.slice(0, 5));

        const topFive = [...posts]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5)
          .map((p) => ({
            title: p.title.length > 20 ? p.title.slice(0, 20) + "..." : p.title,
            views: p.views || 0,
            category: p.category,
          }));
        setTopPosts(topFive);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const chartData = [
    { name: "Published", value: data?.published || 0 },
    { name: "Drafts", value: data?.drafts || 0 },
    { name: "Scheduled", value: data?.scheduled || 0 },
  ];

const dailyViewsData = Array.isArray(data?.last7Days) && data.last7Days.length
  ? data.last7Days
  : [
      { day: "Mon", views: 0 },
      { day: "Tue", views: 0 },
      { day: "Wed", views: 0 },
      { day: "Thu", views: 0 },
      { day: "Fri", views: 0 },
      { day: "Sat", views: 0 },
      { day: "Sun", views: 0 },
    ];

  const categoryData =
    data?.categories?.map((c) => ({
      name: c.name,
      value: c.count,
    })) || [];

  const postRatioData = [
    { name: "Published", value: data?.published || 0 },
    { name: "Drafts", value: data?.drafts || 0 },
  ];

  // ✅ Dynamic color system
  const COLORS = [
    "var(--accent-color)",
    "color-mix(in srgb, var(--accent-color) 80%, white)",
    "color-mix(in srgb, var(--accent-color) 65%, white)",
    "color-mix(in srgb, var(--accent-color) 50%, white)",
    "color-mix(in srgb, var(--accent-color) 35%, white)",
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
      </div>
    );

  const stats = [
    {
      icon: <FileText className="w-6 h-6 text-[var(--accent-color)]" />,
      title: "Total Posts",
      value: data?.total || 0,
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-[var(--accent-color)]" />,
      title: "Published Posts",
      value: data?.published || 0,
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-[var(--accent-color)]/80" />,
      title: "Draft Posts",
      value: data?.drafts || 0,
    },
    {
      icon: <Eye className="w-6 h-6 text-[var(--accent-color)]/70" />,
      title: "Views Today",
      value: data?.today?.views || 0,
    },
  ];

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-[var(--accent-color)]" /> Dashboard Overview
        </h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03, y: -5 }}
            className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-center mb-3">
              {stat.icon}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stat.title}
              </span>
            </div>
            <h3 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
              {stat.value}
            </h3>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Post Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--accent-color)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Views in Last 7 Days
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyViewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="views"
                stroke="var(--accent-color)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--accent-color)" }}
                activeDot={{ r: 6, fill: "var(--accent-color)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Category Chart + Recent Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Posts by Category
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-3">
            {categoryData.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {c.name} ({c.value})
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Posts */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--accent-color)]" /> Recent Activity
          </h3>
          <ul className="space-y-4">
            {recentPosts.map((post) => (
              <li
                key={post._id}
                className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2"
              >
                <div>
                  <p className="text-gray-800 dark:text-gray-100 font-medium">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString()} —{" "}
                    <span
                      className={`font-medium ${
                        post.status === "published"
                          ? "text-[var(--accent-color)]"
                          : "text-yellow-500"
                      }`}
                    >
                      {post.status}
                    </span>
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Tag className="w-4 h-4" /> {post.category}
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Top Post */}
      {data?.topPost && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Top Performing Post
            </h3>
          </div>
          <p className="text-2xl font-bold text-[var(--accent-color)] mb-2">
            {data.topPost.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Views: {data.topPost.views || 0} | Category: {data.topPost.category}
          </p>
        </motion.div>
      )}

      {/* Top 5 Posts & Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top 5 Posts */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Top 5 Posts by Views
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" opacity={0.2} />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis
                dataKey="title"
                type="category"
                stroke="#9ca3af"
                width={120}
              />
              <Tooltip />
              <Bar dataKey="views" fill="var(--accent-color)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Published vs Draft Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Published vs Draft Ratio
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={postRatioData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {postRatioData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 flex justify-center gap-5">
            {postRatioData.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                {c.name} ({c.value})
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
