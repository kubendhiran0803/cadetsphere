const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const messageRoutes = require("./routes/messageRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const achievementRoutes = require("./routes/achievementRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const eventRoutes = require("./routes/eventRoutes");
const path = require("path");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
