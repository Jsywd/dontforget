require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const passport = require("./config/passport");
const cors = require("cors");
const path = require("path");
const db = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionStore = new MySQLStore({}, db);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dontforget_secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/auth", require("./routes/auth"));
app.use("/api/checklists", require("./routes/checklists"));
app.use("/api/items", require("./routes/items"));
app.use("/api/places", require("./routes/places"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/checklist-gallery", require("./routes/gallery"));

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../frontend/index.html")),
);
app.get("/pages/*", (req, res) => {
  const page = path.join(__dirname, "../frontend", req.path);
  res.sendFile(page, (err) => {
    if (err) res.sendFile(path.join(__dirname, "../frontend/index.html"));
  });
});

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Not found" }),
);

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
