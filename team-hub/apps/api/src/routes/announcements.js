const express = require("express");
const authMiddleware = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();

// Get announcements for a workspace
router.get("/workspace/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const announcements = await req.prisma.announcement.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        reactions: true,
        _count: {
          select: { comments: true }
        }
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" }
      ]
    });
    res.json(announcements);
  } catch (error) {
    console.error("Get Announcements Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create announcement
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, workspaceId, isPinned } = req.body;

    if (!title || !content || !workspaceId) {
      return res.status(400).json({ message: "Title, content and workspace ID are required" });
    }

    const announcement = await req.prisma.announcement.create({
      data: {
        title,
        content,
        workspaceId,
        isPinned: isPinned || false,
        authorId: req.user.id
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: true,
        reactions: true
      }
    });

    await createAuditLog(
      req.prisma,
      req.user.id,
      workspaceId,
      "CREATE_ANNOUNCEMENT",
      "ANNOUNCEMENT",
      announcement.id,
      { title }
    );

    req.io.to(workspaceId).emit("announcement-created", announcement);

    res.status(201).json(announcement);
  } catch (error) {
    console.error("Create Announcement Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add comment to announcement
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const announcement = await req.prisma.announcement.findUnique({
      where: { id: req.params.id },
      include: { workspace: { include: { members: { include: { user: true } } } } }
    });

    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    const comment = await req.prisma.comment.create({
      data: {
        content,
        announcementId: req.params.id,
        authorId: req.user.id
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Parse @mentions
    const mentions = content.match(/@(\w+)/g);
    if (mentions) {
      const mentionedNames = mentions.map(m => m.slice(1).toLowerCase());
      const mentionedMembers = announcement.workspace.members.filter(m => 
        m.user.name && mentionedNames.includes(m.user.name.toLowerCase()) && m.userId !== req.user.id
      );

      for (const member of mentionedMembers) {
        const notification = await req.prisma.notification.create({
          data: {
            type: "MENTION",
            message: `${req.user.name} mentioned you in a comment`,
            userId: member.userId,
            link: `/workspace/${announcement.workspaceId}?tab=announcements&id=${announcement.id}`
          }
        });
        req.io.to(`user:${member.userId}`).emit("notification", notification);
      }
    }

    req.io.to(announcement.workspaceId).emit("comment-added", {
      announcementId: req.params.id,
      comment
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add/Remove reaction
router.post("/:id/reactions", authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const announcement = await req.prisma.announcement.findUnique({
      where: { id: req.params.id }
    });

    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    const existingReaction = await req.prisma.reaction.findFirst({
      where: {
        announcementId: req.params.id,
        userId: req.user.id,
        emoji
      }
    });

    if (existingReaction) {
      await req.prisma.reaction.delete({ where: { id: existingReaction.id } });
      req.io.to(announcement.workspaceId).emit("reaction-removed", {
        announcementId: req.params.id,
        userId: req.user.id,
        emoji
      });
      return res.json({ message: "Reaction removed" });
    } else {
      const reaction = await req.prisma.reaction.create({
        data: {
          emoji,
          announcementId: req.params.id,
          userId: req.user.id
        }
      });
      req.io.to(announcement.workspaceId).emit("reaction-added", {
        announcementId: req.params.id,
        reaction
      });
      return res.status(201).json(reaction);
    }
  } catch (error) {
    console.error("Reaction Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete announcement
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const announcement = await req.prisma.announcement.findUnique({
      where: { id: req.params.id }
    });

    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    // Only author or admin can delete
    const member = await req.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: req.user.id,
          workspaceId: announcement.workspaceId
        }
      }
    });

    if (announcement.authorId !== req.user.id && member?.role !== "ADMIN") {
      return res.status(403).json({ message: "Permission denied" });
    }

    await req.prisma.announcement.delete({ where: { id: req.params.id } });

    await createAuditLog(
      req.prisma,
      req.user.id,
      announcement.workspaceId,
      "DELETE_ANNOUNCEMENT",
      "ANNOUNCEMENT",
      req.params.id
    );

    req.io.to(announcement.workspaceId).emit("announcement-deleted", req.params.id);

    res.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
