const express = require("express");
const authMiddleware = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();

// Get action items for a workspace
router.get("/workspace/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const items = await req.prisma.actionItem.findMany({
      where: {
        OR: [
          { workspaceId: req.params.workspaceId },
          { goal: { workspaceId: req.params.workspaceId } }
        ]
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true }
        },
        goal: {
          select: { id: true, title: true }
        }
      },
      orderBy: { updatedAt: "desc" }
    });
    res.json(items);
  } catch (error) {
    console.error("Get Action Items Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create action item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, priority, status, dueDate, goalId, workspaceId, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const item = await req.prisma.actionItem.create({
      data: {
        title,
        priority: priority || "MEDIUM",
        status: status || "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
        goalId,
        workspaceId,
        assigneeId
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } }
      }
    });

    const effectiveWorkspaceId = workspaceId || (goalId ? (await req.prisma.goal.findUnique({ where: { id: goalId } }))?.workspaceId : null);

    if (effectiveWorkspaceId) {
      await createAuditLog(
        req.prisma,
        req.user.id,
        effectiveWorkspaceId,
        "CREATE_ACTION_ITEM",
        "ACTION_ITEM",
        item.id,
        { title }
      );
      req.io.to(effectiveWorkspaceId).emit("action-item-created", item);
    }

    res.status(201).json(item);
  } catch (error) {
    console.error("Create Action Item Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update action item (Kanban move)
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, priority, status, dueDate, assigneeId } = req.body;

    const existingItem = await req.prisma.actionItem.findUnique({
      where: { id: req.params.id },
      include: { goal: true }
    });

    if (!existingItem) {
      return res.status(404).json({ message: "Action item not found" });
    }

    const item = await req.prisma.actionItem.update({
      where: { id: req.params.id },
      data: {
        title,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } }
      }
    });

    const workspaceId = existingItem.workspaceId || existingItem.goal?.workspaceId;

    if (workspaceId) {
      await createAuditLog(
        req.prisma,
        req.user.id,
        workspaceId,
        "UPDATE_ACTION_ITEM",
        "ACTION_ITEM",
        item.id,
        { title: item.title, status: item.status }
      );
      req.io.to(workspaceId).emit("action-item-updated", item);
    }

    res.json(item);
  } catch (error) {
    console.error("Update Action Item Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete action item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const item = await req.prisma.actionItem.findUnique({
      where: { id: req.params.id },
      include: { goal: true }
    });

    if (!item) {
      return res.status(404).json({ message: "Action item not found" });
    }

    await req.prisma.actionItem.delete({ where: { id: req.params.id } });

    const workspaceId = item.workspaceId || item.goal?.workspaceId;
    if (workspaceId) {
      await createAuditLog(
        req.prisma,
        req.user.id,
        workspaceId,
        "DELETE_ACTION_ITEM",
        "ACTION_ITEM",
        req.params.id
      );
      req.io.to(workspaceId).emit("action-item-deleted", req.params.id);
    }

    res.json({ message: "Action item deleted" });
  } catch (error) {
    console.error("Delete Action Item Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
