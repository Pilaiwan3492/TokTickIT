import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authGuard.js";
import { getPrisma } from "../prisma.js";
import { Role, Prisma } from "@prisma/client";
import { hashPassword, validatePasswordPolicy } from "../utils/password.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/v1/admin/users
 * Administrator: List all users with search by name/email and single role filter.
 * Safe fields only; deterministic ordering by createdAt desc, id desc.
 */
export const listUsersHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { search, role } = req.query;

    const andConditions: any[] = [];

    // 1. Search by name or email (case-insensitive partial match)
    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      andConditions.push({
        OR: [
          { name: { contains: term } },
          { email: { contains: term } },
        ],
      });
    }

    // 2. Filter by single role
    if (role && typeof role === "string" && role.trim() !== "") {
      const roleUpper = role.trim().toUpperCase();
      if (!Object.values(Role).includes(roleUpper as Role)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid role filter. Permitted roles: REQUESTER, IT_STAFF, ADMIN.",
          },
        });
      }
      andConditions.push({ role: roleUpper as Role });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      data: users,
    });
  } catch (error) {
    console.error("Error in listUsersHandler:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};

/**
 * POST /api/v1/admin/users
 * Administrator: Create user with exactly one role, initial password, and mustChangePassword = true.
 */
export const createUserHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { name, email, role, isActive, initialPassword } = req.body;

    // Validate Name
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User name is required.",
        },
      });
    }

    // Validate Email
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid email address is required.",
        },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate Role (BR-04: exactly one of REQUESTER, IT_STAFF, ADMIN)
    if (!role || typeof role !== "string") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Role is required. Permitted roles: REQUESTER, IT_STAFF, ADMIN.",
        },
      });
    }

    const roleUpper = role.trim().toUpperCase();
    if (!Object.values(Role).includes(roleUpper as Role)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid role. Permitted roles: REQUESTER, IT_STAFF, ADMIN.",
        },
      });
    }

    // Validate Initial Password (BR-06)
    if (!initialPassword || typeof initialPassword !== "string") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Initial password is required.",
        },
      });
    }

    const policy = validatePasswordPolicy(initialPassword);
    if (!policy.valid) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: policy.reason || "Initial password does not meet complexity requirements.",
        },
      });
    }

    // Check Duplicate Email (BR-20)
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        error: {
          code: "DUPLICATE_EMAIL",
          message: "An account with this email address already exists.",
        },
      });
    }

    const passwordHash = await hashPassword(initialPassword);
    const userIsActive = isActive !== undefined ? Boolean(isActive) : true;

    // Transaction to safely create User and manage legacy RequesterUser compatibility
    try {
      const createdUser = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            role: roleUpper as Role,
            isActive: userIsActive,
            passwordHash,
            mustChangePassword: true, // BR-23
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            mustChangePassword: true,
            createdAt: true,
          },
        });

        // Legacy compatibility: Maintain RequesterUser record for REQUESTER role
        if (roleUpper === Role.REQUESTER) {
          const legacyExisting = await tx.requesterUser.findUnique({
            where: { email: normalizedEmail },
          });

          if (legacyExisting) {
            // Only link if unlinked or already linked to newUser.id (do NOT re-link if belongs to another user)
            if (!legacyExisting.userId || legacyExisting.userId === newUser.id) {
              await tx.requesterUser.update({
                where: { id: legacyExisting.id },
                data: {
                  name: newUser.name,
                  userId: newUser.id,
                  isActive: newUser.isActive,
                },
              });
            }
          } else {
            await tx.requesterUser.create({
              data: {
                name: newUser.name,
                email: newUser.email,
                userId: newUser.id,
                isActive: newUser.isActive,
              },
            });
          }
        }

        return newUser;
      });

      return res.status(201).json({
        data: createdUser,
      });
    } catch (dbError: any) {
      // Catch concurrent database unique constraint violation
      if (dbError.code === "P2002" || String(dbError).includes("UNIQUE")) {
        return res.status(409).json({
          error: {
            code: "DUPLICATE_EMAIL",
            message: "An account with this email address already exists.",
          },
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error in createUserHandler:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};

/**
 * PATCH /api/v1/admin/users/:id
 * Administrator: Edit user name, email, role, and active status.
 * Enforces BR-21 (Self-Deactivation Guard) and BR-22 (Last Active Administrator Guard).
 */
export const updateUserHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const targetId = req.params.id;
    const currentAdminId = req.user?.id;

    if (!targetId || !UUID_REGEX.test(targetId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid user ID is required.",
        },
      });
    }

    const { name, email, role, isActive } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "The requested user was not found.",
        },
      });
    }

    const updateData: any = {};

    // Validate Name if provided
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "User name cannot be empty.",
          },
        });
      }
      updateData.name = name.trim();
    }

    // Validate Email if provided
    if (email !== undefined) {
      if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid email address is required.",
          },
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== targetUser.email.toLowerCase()) {
        const conflictUser = await prisma.user.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: targetId },
          },
        });

        if (conflictUser) {
          return res.status(409).json({
            error: {
              code: "DUPLICATE_EMAIL",
              message: "An account with this email address already exists.",
            },
          });
        }
        updateData.email = normalizedEmail;
      }
    }

    // Validate Role if provided
    let newRole: Role | undefined;
    if (role !== undefined) {
      if (typeof role !== "string") {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid role. Permitted roles: REQUESTER, IT_STAFF, ADMIN.",
          },
        });
      }

      const roleUpper = role.trim().toUpperCase();
      if (!Object.values(Role).includes(roleUpper as Role)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid role. Permitted roles: REQUESTER, IT_STAFF, ADMIN.",
          },
        });
      }
      newRole = roleUpper as Role;
      updateData.role = newRole;
    }

    // Validate Active Status if provided
    let newIsActive: boolean | undefined;
    if (isActive !== undefined) {
      newIsActive = Boolean(isActive);
      updateData.isActive = newIsActive;
    }

    // Safety Guard #2: Last Active Administrator Protection (BR-22)
    // Triggers if target user is currently an active ADMIN and is being deactivated or demoted
    const isCurrentlyActiveAdmin = targetUser.role === Role.ADMIN && targetUser.isActive;
    const isBeingDeactivated = newIsActive === false;
    const isBeingDemoted = newRole !== undefined && newRole !== Role.ADMIN;

    if (isCurrentlyActiveAdmin && (isBeingDeactivated || isBeingDemoted)) {
      // Count within atomic transaction to ensure concurrency safety
      const activeAdminCount = await prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: {
            code: "LAST_ACTIVE_ADMIN_PROTECTED",
            message: "System must have at least one active administrator.",
          },
        });
      }
    }

    // Safety Guard #1: Administrator Self-Deactivation Guard (BR-21)
    if (currentAdminId === targetId && newIsActive === false) {
      return res.status(400).json({
        error: {
          code: "CANNOT_DEACTIVATE_SELF",
          message: "You cannot deactivate your own administrator account.",
        },
      });
    }

    try {
      // Retry wrapper for serialization failures (PostgreSQL 40001 / Prisma P2034)
      const maxRetries = 3;
      let attempt = 0;
      let updatedUser: any;

      while (true) {
        try {
          updatedUser = await prisma.$transaction(
            async (tx) => {
              // 1. Acquire transaction-scoped advisory lock in PostgreSQL for admin mutations
              if (isCurrentlyActiveAdmin && (isBeingDeactivated || isBeingDemoted)) {
                try {
                  await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(838383);");
                } catch {
                  // Ignore if DB provider does not support pg_advisory_xact_lock
                }

                const countInTx = await tx.user.count({
                  where: { role: Role.ADMIN, isActive: true },
                });
                if (countInTx <= 1) {
                  throw new Error("LAST_ACTIVE_ADMIN_PROTECTED");
                }
              }

              // If deactivating, increment tokenVersion to permanently invalidate sessions
              const finalUpdateData: any = { ...updateData };
              if (newIsActive === false) {
                finalUpdateData.tokenVersion = { increment: 1 };
              }

              const user = await tx.user.update({
                where: { id: targetId },
                data: finalUpdateData,
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  isActive: true,
                  mustChangePassword: true,
                  createdAt: true,
                },
              });

              // Invalidate active sessions if deactivated (BR-27)
              if (newIsActive === false) {
                await tx.revokedToken.create({
                  data: {
                    jti: `revoke-deactivate-${targetId}-${Date.now()}`,
                    userId: targetId,
                    expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
                  },
                });
              }

              // Handle RequesterUser synchronization across role transitions
              if (user.role === Role.REQUESTER) {
                // If user is/became REQUESTER, ensure linked RequesterUser exists and is updated safely:
                // 1. Check by userId = targetId first
                const existingByUserId = await tx.requesterUser.findFirst({
                  where: { userId: targetId },
                });

                if (existingByUserId) {
                  await tx.requesterUser.update({
                    where: { id: existingByUserId.id },
                    data: {
                      name: user.name,
                      email: user.email,
                      isActive: user.isActive,
                    },
                  });
                } else {
                  // 2. Fallback: Check by email
                  const existingByEmail = await tx.requesterUser.findUnique({
                    where: { email: user.email },
                  });

                  if (existingByEmail) {
                    // 3. If email record belongs to another user, do NOT re-link to prevent data corruption
                    if (!existingByEmail.userId || existingByEmail.userId === targetId) {
                      await tx.requesterUser.update({
                        where: { id: existingByEmail.id },
                        data: {
                          name: user.name,
                          userId: targetId,
                          isActive: user.isActive,
                        },
                      });
                    }
                  } else {
                    // 4. Record not found at all: create new RequesterUser
                    await tx.requesterUser.create({
                      data: {
                        name: user.name,
                        email: user.email,
                        userId: user.id,
                        isActive: user.isActive,
                      },
                    });
                  }
                }
              } else if (targetUser.role === Role.REQUESTER) {
                // If transitioned from REQUESTER to non-requester (IT_STAFF / ADMIN):
                // Maintain legacy RequesterUser record to preserve FK integrity for historical tickets,
                // but synchronize active state, name, and email.
                const legacyExisting = await tx.requesterUser.findFirst({
                  where: { userId: targetId },
                });
                if (legacyExisting) {
                  await tx.requesterUser.update({
                    where: { id: legacyExisting.id },
                    data: {
                      name: user.name,
                      email: user.email,
                      isActive: user.isActive,
                    },
                  });
                }
              } else {
                // Otherwise if linked RequesterUser exists, keep its fields synchronized
                const reqProfile = await tx.requesterUser.findFirst({
                  where: { userId: targetId },
                });
                if (reqProfile) {
                  await tx.requesterUser.update({
                    where: { id: reqProfile.id },
                    data: {
                      name: user.name,
                      email: user.email,
                      isActive: user.isActive,
                    },
                  });
                }
              }

              return user;
            },
            {
              isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            }
          );

          break; // Transaction committed successfully
        } catch (retryErr: any) {
          attempt++;
          const isSerializationError =
            retryErr?.code === "P2034" ||
            String(retryErr?.message).includes("could not serialize access") ||
            String(retryErr?.message).includes("40001") ||
            String(retryErr?.message).includes("deadlock detected");
          if (isSerializationError && attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 50));
            continue;
          }
          throw retryErr;
        }
      }

      return res.status(200).json({
        data: updatedUser,
      });
    } catch (txError: any) {
      if (txError.message === "LAST_ACTIVE_ADMIN_PROTECTED") {
        return res.status(400).json({
          error: {
            code: "LAST_ACTIVE_ADMIN_PROTECTED",
            message: "System must have at least one active administrator.",
          },
        });
      }
      if (txError.code === "P2002" || String(txError).includes("UNIQUE")) {
        return res.status(409).json({
          error: {
            code: "DUPLICATE_EMAIL",
            message: "An account with this email address already exists.",
          },
        });
      }
      throw txError;
    }
  } catch (error) {
    console.error("Error in updateUserHandler:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};

/**
 * POST /api/v1/admin/users/:id/reset-password
 * Administrator: Reset initial password for a user.
 * Hashes password, sets mustChangePassword = true, invalidates existing sessions.
 */
export const resetUserPasswordHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const targetId = req.params.id;

    if (!targetId || !UUID_REGEX.test(targetId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid user ID is required.",
        },
      });
    }

    const { newInitialPassword } = req.body;

    if (!newInitialPassword || typeof newInitialPassword !== "string") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New initial password is required.",
        },
      });
    }

    const policy = validatePasswordPolicy(newInitialPassword);
    if (!policy.valid) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: policy.reason || "New initial password does not meet complexity requirements.",
        },
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "The requested user was not found.",
        },
      });
    }

    const newHash = await hashPassword(newInitialPassword);

    await prisma.$transaction(async (tx) => {
      // 1. Update user password, set mustChangePassword = true, and increment tokenVersion
      await tx.user.update({
        where: { id: targetId },
        data: {
          passwordHash: newHash,
          mustChangePassword: true, // FR-22, BR-23
          tokenVersion: { increment: 1 },
        },
      });

      // 2. Invalidate existing sessions using the canonical RevokedToken registry
      await tx.revokedToken.create({
        data: {
          jti: `revoke-reset-${targetId}-${Date.now()}`,
          userId: targetId,
          expiresAt: new Date(Date.now() + 8 * 3600 * 1000),
        },
      });
    });

    return res.status(200).json({
      data: {
        message: "Initial password reset successfully. User must change password upon next login.",
      },
    });
  } catch (error) {
    console.error("Error in resetUserPasswordHandler:", error);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
};

/**
 * DELETE /api/v1/admin/users/:id
 * Prohibited endpoint per BR-19: User accounts cannot be deleted, only deactivated.
 */
export const deleteUserMethodNotAllowedHandler = async (
  _req: AuthenticatedRequest,
  res: Response
) => {
  return res.status(405).json({
    error: {
      code: "METHOD_NOT_ALLOWED",
      message: "User accounts cannot be deleted. Use account deactivation instead.",
    },
  });
};
