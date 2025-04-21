const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Tạo thư mục nếu chưa tồn tại
["uploads", "trimmed"].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

app.use(cors());

// Cấu hình upload
const upload = multer({ dest: "uploads/" });

// API: POST /trim
app.post("/trim", upload.single("video"), (req, res) => {
  const start = parseFloat(req.body.start) || 0;
  const end = parseFloat(req.body.end) || 10;
  const inputPath = req.file.path;
  const outputName = `${Date.now()}_trimmed.mp4`;
  const outputPath = path.join("trimmed", outputName);

  const duration = end - start;

  ffmpeg(inputPath)
    .setStartTime(start)
    .duration(duration)
    .output(outputPath)
    .on("end", () => {
      fs.unlinkSync(inputPath); // Xóa file gốc sau khi xử lý
      res.json({
        success: true,
        url: `${req.protocol}://${req.get("host")}/trimmed/${outputName}`,
      });
    })
    .on("error", (err) => {
      console.error("FFmpeg Error:", err);
      res.status(500).json({ success: false, error: err.message });
    })
    .run();
});

// Phục vụ video đã cắt
app.use("/trimmed", express.static(path.join(__dirname, "trimmed")));

app.get("/", (req, res) => {
  res.send("Video Trim Server is running.");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
