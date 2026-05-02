const express = require("express");
const authMiddleware = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();

// Get all workspaces for the current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const workspaces = await req.prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: req.user.id },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
    res.json(workspaces);
  } catch (error) {
    console.error("Get Workspaces Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create workspace
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const workspace = await req.prisma.workspace.create({
      data: {
        name,
        description,
        color,
        members: {
          create: {
            userId: req.user.id,
            role: "ADMIN",
          },
        },
      },
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      workspace.id,
      "CREATE_WORKSPACE",
      "WORKSPACE",
      workspace.id,
      { name }
    );

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Create Workspace Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get single workspace
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const workspace = await req.prisma.workspace.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if user is a member
    const isMember = workspace.members.some((m) => m.userId === req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(workspace);
  } catch (error) {
    console.error("Get Workspace Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update workspace
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const workspaceMember = await req.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: req.params.id,
        },
      },
    });

    if (!workspaceMember || workspaceMember.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can update workspace" });
    }

    const workspace = await req.prisma.workspace.update({
      where: { id: req.params.id },
      data: { name, description, color },
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      workspace.id,
      "UPDATE_WORKSPACE",
      "WORKSPACE",
      workspace.id,
      { name, description, color }
    );

    res.json(workspace);
  } catch (error) {
    console.error("Update Workspace Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add member to workspace
router.post("/:id/members", authMiddleware, async (req, res) => {
  try {
    const { email, role } = req.body;

    const adminMember = await req.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: req.params.id,
        },
      },
    });

    if (!adminMember || adminMember.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    const userToAdd = await req.prisma.user.findUnique({ where: { email } });
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingMember = await req.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToAdd.id,
          workspaceId: req.params.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const member = await req.prisma.workspaceMember.create({
      data: {
        userId: userToAdd.id,
        workspaceId: req.params.id,
        role: role || "MEMBER",
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatar: true },
        },
      },
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      req.params.id,
      "ADD_MEMBER",
      "USER",
      userToAdd.id,
      { email, role: role || "MEMBER" }
    );

    res.status(201).json(member);
  } catch (error) {
    console.error("Add Member Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Remove member
router.delete("/:id/members/:userId", authMiddleware, async (req, res) => {
  try {
    const adminMember = await req.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: req.params.id,
        },
      },
    });

    if (!adminMember || adminMember.role !== "ADMIN") {
      // Users can remove themselves
      if (req.user.id !== req.params.userId) {
        return res.status(403).json({ message: "Only admins can remove other members" });
      }
    }

    await req.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: req.params.userId,
          workspaceId: req.params.id,
        },
      },
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      req.params.id,
      "REMOVE_MEMBER",
      "USER",
      req.params.userId
    );

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove Member Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Audit Logs for workspace
router.get("/:id/audit-logs", authMiddleware, async (req, res) => {
  try {
    const logs = await req.prisma.auditLog.findMany({
      where: { workspaceId: req.params.id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get Analytics for workspace
router.get("/:id/analytics", authMiddleware, async (req, res) => {
  try {
    const workspaceId = req.params.id;

    // Total goals count
    const totalGoals = await req.prisma.goal.count({ where: { workspaceId } });

    // Items completed this week
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const completedThisWeek = await req.prisma.actionItem.count({
      where: {
        OR: [
          { workspaceId },
          { goal: { workspaceId } }
        ],
        status: "DONE",
        updatedAt: { gte: startOfWeek }
      }
    });

    // Overdue count
    const overdueCount = await req.prisma.actionItem.count({
      where: {
        OR: [
          { workspaceId },
          { goal: { workspaceId } }
        ],
        status: { not: "DONE" },
        dueDate: { lt: new Date() }
      }
    });

    // Goal status distribution
    const goalDistribution = await req.prisma.goal.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: true
    });

    // Action item status distribution
    const actionDistribution = await req.prisma.actionItem.groupBy({
      by: ["status"],
      where: {
        OR: [
          { workspaceId },
          { goal: { workspaceId } }
        ]
      },
      _count: true
    });

    // Trend data (last 7 days completions)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      const count = await req.prisma.actionItem.count({
        where: {
          OR: [{ workspaceId }, { goal: { workspaceId } }],
          status: "DONE",
          updatedAt: { gte: start, lte: end }
        }
      });
      trend.push({
        name: start.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: count
      });
    }

    res.json({
      stats: {
        totalGoals,
        completedThisWeek,
        overdueCount
      },
      distribution: {
        goals: goalDistribution.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count }), {}),
        actions: actionDistribution.reduce((acc, curr) => ({ ...acc, [curr.status]: curr._count }), {})
      },
      trend
    });
  } catch (error) {
    console.error("Get Analytics Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export Workspace Data as CSV
router.get("/:id/export", authMiddleware, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    
    const goals = await req.prisma.goal.findMany({
      where: { workspaceId },
      include: { actionItems: true }
    });

    let csv = "Type,Title,Status,Due Date,Created At\n";
    
    goals.forEach(goal => {
      csv += `Goal,"${goal.title}",${goal.status},${goal.dueDate || "N/A"},${goal.createdAt}\n`;
      goal.actionItems.forEach(item => {
        csv += `Action Item,"${item.title}",${item.status},${item.dueDate || "N/A"},${item.createdAt}\n`;
      });
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=workspace-${workspaceId}-export.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
