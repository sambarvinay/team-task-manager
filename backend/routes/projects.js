const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

// Create project
router.post("/", auth, (req, res) => {
  const { name } = req.body;

  db.query(
    "INSERT INTO projects (name, admin_id) VALUES (?,?)",
    [name, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      db.query(
        "INSERT INTO project_members (project_id,user_id,role) VALUES (?,?,?)",
        [result.insertId, req.user.id, "admin"]
      );

      res.json("Project created");
    }
  );
});

// Get user projects
router.get("/", auth, (req, res) => {
  db.query(
    `SELECT p.* FROM projects p
     JOIN project_members pm ON p.id=pm.project_id
     WHERE pm.user_id=?`,
    [req.user.id],
    (err, result) => {
      res.json(result);
    }
  );
});

router.get("/user-role", auth, (req, res) => {
  db.query(
    "SELECT role FROM project_members WHERE user_id=?",
    [req.user.id],
    (err, result) => {

      const isAdmin = result.some(r => r.role === "admin");

      res.json({
        role: isAdmin ? "admin" : "member"
      });
    }
  );
});

// ADD MEMBER
router.post("/add-member", auth, (req, res) => {
  const { project_id, user_id } = req.body;

  // Check if admin
  db.query(
    "SELECT * FROM project_members WHERE project_id=? AND user_id=? AND role='admin'",
    [project_id, req.user.id],
    (err, result) => {
      if (result.length === 0) return res.status(403).json("Not admin");

      db.query(
        "INSERT INTO project_members (project_id,user_id,role) VALUES (?,?,?)",
        [project_id, user_id, "member"],
        () => res.json("Member added")
      );
    }
  );
});

// REMOVE MEMBER
router.delete("/remove-member", auth, (req, res) => {
  const { project_id, user_id } = req.body;

  db.query(
    "SELECT * FROM project_members WHERE project_id=? AND user_id=? AND role='admin'",
    [project_id, req.user.id],
    (err, result) => {
      if (result.length === 0) return res.status(403).json("Not admin");

      db.query(
        "DELETE FROM project_members WHERE project_id=? AND user_id=?",
        [project_id, user_id],
        () => res.json("Member removed")
      );
    }
  );
});

module.exports = router;