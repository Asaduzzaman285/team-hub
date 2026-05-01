/**
 * Helper to record audit logs
 * @param {object} prisma - Prisma client instance
 * @param {string} userId - ID of the user performing the action
 * @param {string} workspaceId - ID of the workspace where the action happened
 * @param {string} action - Action type (e.g., "CREATE_GOAL")
 * @param {string} entityType - Entity type (e.g., "GOAL")
 * @param {string} entityId - ID of the entity
 * @param {object} details - Optional details about the change
 */
const createAuditLog = async (prisma, userId, workspaceId, action, entityType, entityId, details = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        workspaceId,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error("Audit Log Error:", error);
    // We don't throw here to avoid blocking the main operation if audit logging fails
  }
};

module.exports = { createAuditLog };
