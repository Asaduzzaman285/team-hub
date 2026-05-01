const express = require("express");
const authMiddleware = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();

// Get goals for a workspace
router.get("/workspace/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const goals = await req.prisma.goal.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        milestones: true,
        _count: {
          select: { actionItems: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(goals);
  } catch (error) {
    console.error("Get Goals Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create goal
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, workspaceId, milestones } = req.body;

    if (!title || !workspaceId) {
      return res.status(400).json({ message: "Title and Workspace ID are required" });
    }

    const goal = await req.prisma.goal.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        workspaceId,
        milestones: {
          create: milestones?.map((m) => ({ title: m.title })) || [],
        },
      },
      include: { milestones: true },
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      workspaceId,
      "CREATE_GOAL",
      "GOAL",
      goal.id,
      { title }
    );

    res.status(201).json(goal);
  } catch (error) {
    console.error("Create Goal Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update goal
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;

    const existingGoal = await req.prisma.goal.findUnique({
      where: { id: req.params.id },
    });

    if (!existingGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const goal = await req.prisma.goal.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      existingGoal.workspaceId,
      "UPDATE_GOAL",
      "GOAL",
      goal.id,
      { title, status }
    );

    // Emit socket event for real-time update
    req.io.to(existingGoal.workspaceId).emit("goal-updated", goal);

    res.json(goal);
  } catch (error) {
    console.error("Update Goal Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete goal
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const goal = await req.prisma.goal.findUnique({
      where: { id: req.params.id },
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    await req.prisma.goal.delete({ where: { id: req.params.id } });

    await createAuditLog(
      req.prisma,
      req.user.id,
      goal.workspaceId,
      "DELETE_GOAL",
      "GOAL",
      req.params.id
    );

    res.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Delete Goal Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Toggle milestone
router.patch("/milestones/:id", authMiddleware, async (req, res) => {
  try {
    const { isDone } = req.body;

    const milestone = await req.prisma.milestone.update({
      where: { id: req.params.id },
      data: { isDone },
      include: { goal: true },
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      milestone.goal.workspaceId,
      "TOGGLE_MILESTONE",
      "MILESTONE",
      milestone.id,
      { title: milestone.title, isDone }
    );

    res.json(milestone);
  } catch (error) {
    console.error("Toggle Milestone Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
