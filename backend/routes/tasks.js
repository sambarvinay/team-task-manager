const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

// Create task
router.post("/", auth, (req, res) => {
  const { title, description, due_date, priority, project_id, assigned_to } = req.body;

  // ✅ 1. Validation
  if (!title || !project_id || !assigned_to) {
    return res.status(400).json("Missing required fields");
  }

  // ✅ 2. Check if current user is admin of project
  db.query(
    "SELECT role FROM project_members WHERE project_id=? AND user_id=?",
    [project_id, req.user.id],
    (err, roleResult) => {

      if (err) return res.status(500).json(err);
      if (!roleResult.length) return res.status(403).json("Not part of project");

      if (roleResult[0].role !== "admin") {
        return res.status(403).json("Only admin can create tasks");
      }

      // ✅ 3. Check if assigned user is part of project
      db.query(
        "SELECT * FROM project_members WHERE project_id=? AND user_id=?",
        [project_id, assigned_to],
        (err, memberResult) => {

          if (err) return res.status(500).json(err);
          if (!memberResult.length) {
            return res.status(400).json("Assigned user not in project");
          }

          // ✅ 4. INSERT TASK (THIS IS YOUR MISSING PART)
          db.query(
            `INSERT INTO tasks 
            (title, description, due_date, priority, status, project_id, assigned_to)
            VALUES (?, ?, ?, ?, 'todo', ?, ?)`,
            [title, description, due_date, priority, project_id, assigned_to],
            (err, result) => {
              if (err) return res.status(500).json(err);

              res.json({
                message: "Task created successfully",
                taskId: result.insertId
              });
            }
          );
        }
      );
    }
  );
});

// Update status
router.put("/:id", auth, (req, res) => {
  const { status } = req.body;

  db.query(
    "UPDATE tasks SET status=? WHERE id=? AND assigned_to=?",
    [status, req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json("Task updated");
    }
  );
});
// Dashboard
router.get("/dashboard", auth, (req, res) => {
  db.query(
    `SELECT 
      COUNT(*) AS total,
      SUM(status='todo') AS todo,
      SUM(status='inprogress') AS inprogress,
      SUM(status='done') AS done,
      SUM(due_date < CURDATE() AND status != 'done') AS overdue
     FROM tasks
     WHERE assigned_to = ?`,
    [req.user.id],
    (err, result) => res.json(result[0])
  );
});

// GET tasks by project
// Only show tasks assigned to user OR admin sees all
router.get("/project/:id", auth, (req, res) => {
  const projectId = req.params.id;

  db.query(
    "SELECT role FROM project_members WHERE project_id=? AND user_id=?",
    [projectId, req.user.id],
    (err, roleResult) => {

      if (!roleResult.length) return res.status(403).json("No access");

      if (roleResult[0].role === "admin") {
        db.query(
          "SELECT * FROM tasks WHERE project_id=?",
          [projectId],
          (err, result) => res.json(result)
        );
      } else {
        db.query(
          "SELECT * FROM tasks WHERE project_id=? AND assigned_to=?",
          [projectId, req.user.id],
          (err, result) => res.json(result)
        );
      }
    }
  );
});

router.get("/my", auth, (req, res) => {
  db.query(
    "SELECT * FROM tasks WHERE assigned_to=?",
    [req.user.id],
    (err, result) => res.json(result)
  );
});

module.exports = router;
